"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings2,
  Printer,
  RefreshCcw,
  FileText,
  FileSpreadsheet,
} from "lucide-react"
import axios from "axios"
import { Checkbox } from "@/components/ui/checkbox"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

const DEFAULT_PAGE_SIZE = 20
const DEBOUNCE_DELAY = 500

// ─── Module-level singleton promise for client/franchise map ───────────────────
let dataMapPromise = null

const getClientAndFranchiseMap = () => {
  if (!dataMapPromise) {
    dataMapPromise = new Promise(async (resolve, reject) => {
      try {
        const [clientsRes, franchisesRes] = await Promise.all([
          axios.get("/api/clients").catch(() => ({ data: [] })),
          axios.get("/api/franchises").catch(() => ({ data: [] })),
        ])

        const combinedMap = new Map()

        ;(clientsRes.data || []).forEach((c) => {
          const key = c.code || c.id
          const name = c.companyName || c.name || "Unnamed Client"
          if (key) combinedMap.set(String(key), name)
        })

        ;(franchisesRes.data || []).forEach((f) => {
          const key = f.code || f.id
          const name = f.firmName || f.name || "Unnamed Franchise"
          if (key) combinedMap.set(String(key), name)
        })

        resolve(combinedMap)
      } catch (error) {
        console.error("Failed to pre-fetch client/franchise data:", error)
        dataMapPromise = null
        reject(error)
      }
    })
  }
  return dataMapPromise
}

// ✅ Format date to dd/mm/yyyy
const formatDate = (dateValue) => {
  if (!dateValue) return "-"
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return "-"
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return "-"
  }
}

// ✅ Detect service from forwarding link
const detectService = (forwardingLink) => {
  if (!forwardingLink || forwardingLink === "-") return "Self"
  const url = forwardingLink.toLowerCase()
  if (url.includes("dhl")) return "DHL"
  if (url.includes("ups")) return "UPS"
  if (url.includes("fedex")) return "FedEx"
  if (url.includes("aramex")) return "Aramex"
  if (url.includes("bluedart")) return "BlueDart"
  if (url.includes("dtdc")) return "DTDC"
  if (url.includes("ecom")) return "Ecom Express"
  if (url.includes("xpressbees")) return "XpressBees"
  if (url.includes("delhivery")) return "Delhivery"
  if (url.includes("shadowfax")) return "Shadowfax"
  if (url.includes("ekart")) return "Ekart"
  if (url.includes("smartr")) return "Smartr"
  if (url.includes("gati")) return "Gati"
  if (url.includes("tnt")) return "TNT"
  if (url.includes("usps")) return "USPS"
  if (url.includes("royalmail") || url.includes("royal-mail")) return "Royal Mail"
  if (url.includes("postnl")) return "PostNL"
  if (url.includes("dpd")) return "DPD"
  if (url.includes("hermes")) return "Hermes"
  if (url.includes("gls")) return "GLS"
  return "Self"
}

// ✅ Detect shipment type based on receiver country
const detectShipmentType = (receiverCountry) => {
  if (!receiverCountry) return "International"
  const country = receiverCountry.toString().toLowerCase().trim()
  if (country === "india" || country === "in" || country === "ind") {
    return "Domestic"
  }
  return "International"
}

// ✅ Excel column letter helper
const colLetter = (index) => {
  let letter = ""
  let n = index + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    n = Math.floor((n - 1) / 26)
  }
  return letter
}

export function DataTableOptimized({ columns, userType, userId }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [clientNameInput, setClientNameInput] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [visibleColumns, setVisibleColumns] = useState({})
  const [clientOptions, setClientOptions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showClientFilter, setShowClientFilter] = useState(false)
  const [selectedAwbs, setSelectedAwbs] = useState({})
  const [manifestLoading, setManifestLoading] = useState(false)
  // ✅ Store the resolved client/franchise map in state so it's available for manifest
  const [clientFranchiseMap, setClientFranchiseMap] = useState(new Map())

  const dropdownRef = useRef(null)
  const debounceTimer = useRef(null)

  // ✅ Pre-fetch client/franchise map on mount
  useEffect(() => {
    getClientAndFranchiseMap()
      .then((map) => setClientFranchiseMap(map))
      .catch(() => setClientFranchiseMap(new Map()))
  }, [])

  const fetchData = useCallback(
    async (
      currentPage,
      currentSearch,
      currentCountry,
      currentClientCode,
      currentStartDate,
      currentEndDate
    ) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
          search: currentSearch,
          country: currentCountry,
          clientCode: currentClientCode,
          startDate: currentStartDate,
          endDate: currentEndDate,
        })
        const response = await axios.get(`/api/awb?${params.toString()}`, {
          headers: { userType, userId },
        })
        setData(response.data.data)
        setTotalPages(response.data.pagination?.totalPages || 1)
        setTotalCount(response.data.pagination?.totalCount || response.data.totalCount || 0)
        setPage(response.data.pagination?.page || currentPage)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to fetch data. Please try again.")
        setData([])
      } finally {
        setLoading(false)
      }
    },
    [pageSize, userType, userId]
  )

  useEffect(() => {
    const initialVisibility = {}
    columns?.forEach((col) => {
      initialVisibility[col.accessorKey || col.id] = true
    })
    setVisibleColumns(initialVisibility)
  }, [columns])

  useEffect(() => {
    fetchData(1, "", "", "", "", "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchRefOptions = async () => {
      try {
        if (userType === "admin" || userType === "branch") {
          const [franchiseRes, clientRes] = await Promise.all([
            axios.get("/api/franchises").catch(() => ({ data: [] })),
            axios.get("/api/clients").catch(() => ({ data: [] })),
          ])
          const franchises = (franchiseRes.data || []).map((f) => ({
            value: f.code || f.id,
            label: f.firmName || f.name,
            type: "franchise",
          }))
          const clients = (clientRes.data || []).map((c) => ({
            value: c.code || c.id,
            label: c.companyName || c.name,
            type: "client",
          }))
          setClientOptions([...franchises, ...clients])
          setShowClientFilter(true)
        } else if (userType === "franchise") {
          const clientRes = await axios.get("/api/clients", { headers: { userType, userId } })
          const clients = (clientRes.data || []).map((c) => ({
            value: c.code || c.id,
            label: c.companyName || c.name,
            type: "client",
          }))
          if (clients.length > 0) {
            setClientOptions(clients)
            setShowClientFilter(true)
          } else {
            setShowClientFilter(false)
          }
        } else if (userType === "client") {
          setShowClientFilter(false)
        }
      } catch (error) {
        console.error("Error fetching ref options:", error)
        setShowClientFilter(false)
      }
    }
    if (userType) {
      fetchRefOptions()
    }
  }, [userType, userId])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setPage(1)
      fetchData(1, value, countryFilter, clientFilter, startDate, endDate)
    }, DEBOUNCE_DELAY)
  }

  const applyFilters = () => {
    setPage(1)
    fetchData(1, searchTerm, countryFilter, clientFilter, startDate, endDate)
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setCountryFilter("")
    setClientFilter("")
    setClientNameInput("")
    setStartDate("")
    setEndDate("")
    setPage(1)
    fetchData(1, "", "", "", "", "")
  }

  const handleSelectClient = (option) => {
    setClientNameInput(option.label)
    setClientFilter(option.value)
    setShowDropdown(false)
  }

  const filteredClientOptions = clientOptions.filter((opt) =>
    opt.label.toLowerCase().includes(clientNameInput.toLowerCase())
  )

  const selectedTrackingNumbers = Object.keys(selectedAwbs).filter(
    (trackingNumber) => selectedAwbs[trackingNumber]
  )
  const visibleTrackingNumbers = data.map((row) => row.trackingNumber).filter(Boolean)
  const allVisibleSelected =
    visibleTrackingNumbers.length > 0 &&
    visibleTrackingNumbers.every((trackingNumber) => selectedAwbs[trackingNumber])
  const someVisibleSelected =
    visibleTrackingNumbers.some((trackingNumber) => selectedAwbs[trackingNumber]) && !allVisibleSelected

  const toggleAwbSelection = (trackingNumber, checked) => {
    setSelectedAwbs((prev) => {
      const next = { ...prev }
      if (checked) {
        next[trackingNumber] = true
      } else {
        delete next[trackingNumber]
      }
      return next
    })
  }

  const toggleVisibleSelection = (checked) => {
    setSelectedAwbs((prev) => {
      const next = { ...prev }
      visibleTrackingNumbers.forEach((trackingNumber) => {
        if (checked) {
          next[trackingNumber] = true
        } else {
          delete next[trackingNumber]
        }
      })
      return next
    })
  }

  const handleBulkShippingLabelPrint = () => {
    if (selectedTrackingNumbers.length === 0) return
    const params = new URLSearchParams({ trackingNumbers: selectedTrackingNumbers.join(",") })
    window.open(`/shipping-and-label/bulk?${params.toString()}`, "_blank")
  }

  const handleBulkTrackingUpdate = () => {
    if (selectedTrackingNumbers.length === 0) return
    const params = new URLSearchParams({ trackingNumbers: selectedTrackingNumbers.join(",") })
    window.open(`/awb/update-track/bulk?${params.toString()}`, "_blank")
  }

  const formatNumber = (value, decimals = 2) => {
    const number = Number.parseFloat(value)
    if (!Number.isFinite(number)) return "0.00"
    return number.toFixed(decimals)
  }

  const getAwbNumber = (awb) => awb?.awbNumber || awb?.trackingNumber || "-"

  // ✅ Resolve franchise/client name from refCode using the map
  const getFranchiseName = (awb, map) => {
    const refCode = awb?.refCode || awb?.refcode || awb?.ref_code
    if (!refCode) return "-"
    const name = map.get(String(refCode))
    return name || String(refCode)
  }

  // ✅ Build manifest rows — now includes franchiseName
  const getManifestRows = (awbs, includeCnoteDetails = false, map = new Map()) => {
    const rows = []
    awbs.forEach((awb, awbIndex) => {
      const boxes =
        Array.isArray(awb.boxes) && awb.boxes.length > 0 ? awb.boxes : [{}]
      const receiverCountry =
        awb.receiver?.country || awb.receiver?.countryName || "-"
      const shipmentType = detectShipmentType(receiverCountry)
      const service = detectService(awb.forwardingLink)
      const franchiseName = getFranchiseName(awb, map)

      boxes.forEach((box, boxIndex) => {
        rows.push({
          srNo: rows.length + 1,
          date: formatDate(awb.date),
          franchiseName: franchiseName,
          awbSrNo: awbIndex + 1,
          senderName: awb.sender?.name || "-",
          receiverName: awb.receiver?.name || "-",
          receiverCountry: receiverCountry,
          shipmentType: shipmentType,
          service: service,
          awbNo: getAwbNumber(awb),
          cNoteVendorName: includeCnoteDetails ? awb.cNoteVendorName || "-" : undefined,
          cNoteNumber: includeCnoteDetails ? awb.cNoteNumber || "-" : undefined,
          forwardingNumber: includeCnoteDetails ? awb.forwardingNumber || "-" : undefined,
          forwardingLink: includeCnoteDetails ? awb.forwardingLink || "-" : undefined,
          boxNo: `${boxIndex + 1} of ${boxes.length}`,
          actualWeight: Number.parseFloat(box.actualWeight) || 0,
          dimensions: [box.length, box.breadth, box.height]
            .map((value) => value || "0")
            .join(" x "),
          dimensionalWeight: Number.parseFloat(box.dimensionalWeight) || 0,
          chargeableWeight: Number.parseFloat(box.chargeableWeight) || 0,
        })
      })
    })
    return rows
  }

  const getManifestTotals = (awbs, rows) => ({
    totalAwbs: awbs.length,
    totalBoxes: rows.length,
    totalActualWeight: rows.reduce((sum, row) => sum + row.actualWeight, 0),
    totalChargeableWeight: rows.reduce((sum, row) => sum + row.chargeableWeight, 0),
  })

  const fetchSelectedAwbsForManifest = async () => {
    if (selectedTrackingNumbers.length === 0) return []
    const params = new URLSearchParams({
      trackingNumbers: selectedTrackingNumbers.join(","),
      fetchAll: "true",
    })
    const response = await axios.get(`/api/awb?${params.toString()}`, {
      headers: { userType, userId },
    })
    const awbs = response.data?.data || []
    const order = new Map(
      selectedTrackingNumbers.map((trackingNumber, index) => [trackingNumber, index])
    )
    return [...awbs].sort(
      (a, b) =>
        (order.get(a.trackingNumber) ?? 0) - (order.get(b.trackingNumber) ?? 0)
    )
  }

  const generateManifestPdf = (awbs, includeCnoteDetails = false, map = new Map()) => {
    const rows = getManifestRows(awbs, includeCnoteDetails, map)
    const totals = getManifestTotals(awbs, rows)
    const generatedAt = new Date()
    const fileDate = generatedAt.toISOString().slice(0, 10)
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("AWB Manifest", 40, 36)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(`Generated: ${generatedAt.toLocaleString("en-IN")}`, 40, 54)

    const head = [
      "Sr No.",
      "Date",
      "Franchise / Client",
      "Sender Name",
      "Receiver Name",
      "Receiver Country",
      "Type",
      "Service",
      "AWB No.",
      "Box No.",
      "Actual Wt",
      "Dimensions (L x B x H)",
      "Dimensional Wt",
      "Chargeable Wt",
    ]

    if (includeCnoteDetails) {
      head.push("cNote Vendor", "cNote No.", "Forwarding No.", "Forwarding Link")
    }

    autoTable(doc, {
      startY: 72,
      head: [head],
      body: rows.map((row) => {
        const bodyRow = [
          row.srNo,
          row.date,
          row.franchiseName,
          row.senderName,
          row.receiverName,
          row.receiverCountry,
          row.shipmentType,
          row.service,
          row.awbNo,
          row.boxNo,
          formatNumber(row.actualWeight),
          row.dimensions,
          formatNumber(row.dimensionalWeight, 3),
          formatNumber(row.chargeableWeight),
        ]
        if (includeCnoteDetails) {
          bodyRow.push(
            row.cNoteVendorName,
            row.cNoteNumber,
            row.forwardingNumber,
            row.forwardingLink
          )
        }
        return bodyRow
      }),
      foot: [
        [
          "Totals",
          `AWBs: ${totals.totalAwbs}`,
          "",
          "",
          "",
          "",
          "",
          "",
          `Boxes: ${totals.totalBoxes}`,
          "",
          formatNumber(totals.totalActualWeight),
          "",
          "",
          formatNumber(totals.totalChargeableWeight),
          ...(includeCnoteDetails ? ["", "", "", ""] : []),
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: { fontSize: 7, cellPadding: 3 },
      styles: { overflow: "linebreak", valign: "middle" },
      columnStyles: {
        0: { cellWidth: 26, halign: "center" },
        1: { cellWidth: 58, halign: "center" },
        2: { cellWidth: 80 },
        3: { cellWidth: 78 },
        4: { cellWidth: 78 },
        5: { cellWidth: 60, halign: "center" },
        6: { cellWidth: 52, halign: "center" },
        7: { cellWidth: 46, halign: "center" },
        8: { cellWidth: 66, halign: "center" },
        9: { cellWidth: 38, halign: "center" },
        10: { cellWidth: 44, halign: "right" },
        11: { cellWidth: 84, halign: "center" },
        12: { cellWidth: 56, halign: "right" },
        13: { cellWidth: 56, halign: "right" },
      },
      margin: { left: 16, right: 16 },
      didParseCell: (data) => {
        // Color-code Type column (index 6)
        if (data.section === "body" && data.column.index === 6) {
          if (data.cell.raw === "Domestic") {
            data.cell.styles.textColor = [21, 128, 61]
            data.cell.styles.fontStyle = "bold"
          } else if (data.cell.raw === "International") {
            data.cell.styles.textColor = [29, 78, 216]
            data.cell.styles.fontStyle = "bold"
          }
        }
        // Color-code Service column (index 7)
        if (data.section === "body" && data.column.index === 7) {
          if (data.cell.raw === "Self") {
            data.cell.styles.textColor = [107, 114, 128]
          } else {
            data.cell.styles.textColor = [124, 58, 237]
            data.cell.styles.fontStyle = "bold"
          }
        }
      },
    })

    const finalY = doc.lastAutoTable?.finalY || 72
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text(
      `Total AWBs: ${totals.totalAwbs}   Total Boxes: ${totals.totalBoxes}   Total Actual Weight: ${formatNumber(totals.totalActualWeight)}   Total Chargeable Weight: ${formatNumber(totals.totalChargeableWeight)}`,
      16,
      Math.min(finalY + 24, doc.internal.pageSize.height - 20)
    )

    doc.save(`awb-manifest-${fileDate}.pdf`)
  }

  const generateManifestExcel = (awbs, includeCnoteDetails = false, map = new Map()) => {
    const rows = getManifestRows(awbs, includeCnoteDetails, map)
    const totals = getManifestTotals(awbs, rows)
    const generatedAt = new Date()
    const fileDate = generatedAt.toISOString().slice(0, 10)

    // ─── Define headers ──────────────────────────────────────────────────────────
    const baseHeaders = [
      "Sr No.",
      "Date",
      "Franchise / Client",
      "Sender Name",
      "Receiver Name",
      "Receiver Country",
      "Type",
      "Service",
      "AWB No.",
      "Box No.",
      "Actual Weight",
      "Length",
      "Breadth",
      "Height",
      "Dimensional Weight",
      "Chargeable Weight",
    ]
    const cnoteHeaders = includeCnoteDetails
      ? ["cNote Vendor", "cNote No.", "Forwarding No.", "Forwarding Link"]
      : []
    const headers = [...baseHeaders, ...cnoteHeaders]
    const totalCols = headers.length

    // ─── Row positions ───────────────────────────────────────────────────────────
    // Row 1 : Title
    // Row 2 : Generated
    // Row 3 : Empty spacer
    // Row 4 : Headers   (HEADER_ROW)
    // Row 5+: Data      (DATA_START_ROW)
    const HEADER_ROW = 4
    const DATA_START_ROW = 5

    const worksheetData = [
      ["AWB Manifest", ...Array(totalCols - 1).fill("")],
      [`Generated: ${generatedAt.toLocaleString("en-IN")}`, ...Array(totalCols - 1).fill("")],
      Array(totalCols).fill(""),
      headers,
      ...rows.map((row) => {
        const [length, breadth, height] = row.dimensions.split(" x ")
        const result = [
          row.srNo,
          row.date,
          row.franchiseName,
          row.senderName,
          row.receiverName,
          row.receiverCountry,
          row.shipmentType,
          row.service,
          row.awbNo,
          row.boxNo,
          Number(formatNumber(row.actualWeight)),
          Number(length) || 0,
          Number(breadth) || 0,
          Number(height) || 0,
          Number(formatNumber(row.dimensionalWeight, 3)),
          Number(formatNumber(row.chargeableWeight)),
        ]
        if (includeCnoteDetails) {
          result.push(
            row.cNoteVendorName,
            row.cNoteNumber,
            row.forwardingNumber,
            row.forwardingLink
          )
        }
        return result
      }),
      Array(totalCols).fill(""),
      ["Total AWBs", totals.totalAwbs, ...Array(totalCols - 2).fill("")],
      ["Total Boxes", totals.totalBoxes, ...Array(totalCols - 2).fill("")],
      ["Total Actual Weight", Number(formatNumber(totals.totalActualWeight)), ...Array(totalCols - 2).fill("")],
      [
        "Total Chargeable Weight",
        Number(formatNumber(totals.totalChargeableWeight)),
        ...Array(totalCols - 2).fill(""),
      ],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // ─── Merges ──────────────────────────────────────────────────────────────────
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
    ]

    // ─── Column widths ───────────────────────────────────────────────────────────
    const baseColWidths = [
      { wch: 7 },   // Sr No.
      { wch: 13 },  // Date
      { wch: 26 },  // Franchise / Client
      { wch: 24 },  // Sender Name
      { wch: 24 },  // Receiver Name
      { wch: 18 },  // Receiver Country
      { wch: 14 },  // Type
      { wch: 13 },  // Service
      { wch: 17 },  // AWB No.
      { wch: 10 },  // Box No.
      { wch: 14 },  // Actual Weight
      { wch: 9 },   // Length
      { wch: 9 },   // Breadth
      { wch: 9 },   // Height
      { wch: 17 },  // Dimensional Weight
      { wch: 17 },  // Chargeable Weight
    ]
    const cnoteColWidths = includeCnoteDetails
      ? [{ wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 34 }]
      : []
    worksheet["!cols"] = [...baseColWidths, ...cnoteColWidths]

    // ─── Row heights ─────────────────────────────────────────────────────────────
    worksheet["!rows"] = [
      { hpt: 34 }, // Title
      { hpt: 18 }, // Generated
      { hpt: 6 },  // Spacer
      { hpt: 24 }, // Headers
    ]

    // ─── Border helpers ──────────────────────────────────────────────────────────
    const thinBorder = {
      top: { style: "thin", color: { rgb: "D1D5DB" } },
      bottom: { style: "thin", color: { rgb: "D1D5DB" } },
      left: { style: "thin", color: { rgb: "D1D5DB" } },
      right: { style: "thin", color: { rgb: "D1D5DB" } },
    }
    const medBorder = {
      top: { style: "medium", color: { rgb: "9CA3AF" } },
      bottom: { style: "medium", color: { rgb: "9CA3AF" } },
      left: { style: "medium", color: { rgb: "9CA3AF" } },
      right: { style: "medium", color: { rgb: "9CA3AF" } },
    }

    // ─── Title row ───────────────────────────────────────────────────────────────
    const titleStyle = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "DC2626" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: medBorder,
    }
    for (let c = 0; c < totalCols; c++) {
      const ref = `${colLetter(c)}1`
      if (!worksheet[ref]) worksheet[ref] = { v: "", t: "s" }
      worksheet[ref].s = titleStyle
    }
    worksheet["A1"].v = "AWB Manifest"

    // ─── Generated row ───────────────────────────────────────────────────────────
    const generatedStyle = {
      font: { italic: true, sz: 10, color: { rgb: "6B7280" } },
      fill: { fgColor: { rgb: "FEF2F2" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: { bottom: { style: "thin", color: { rgb: "FECACA" } } },
    }
    for (let c = 0; c < totalCols; c++) {
      const ref = `${colLetter(c)}2`
      if (!worksheet[ref]) worksheet[ref] = { v: "", t: "s" }
      worksheet[ref].s = generatedStyle
    }

    // ─── Header row ──────────────────────────────────────────────────────────────
    const headerStyle = {
      font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E3A5F" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "1E3A5F" } },
        bottom: { style: "medium", color: { rgb: "1E3A5F" } },
        left: { style: "thin", color: { rgb: "2D5A8E" } },
        right: { style: "thin", color: { rgb: "2D5A8E" } },
      },
    }
    for (let c = 0; c < totalCols; c++) {
      const ref = `${colLetter(c)}${HEADER_ROW}`
      if (!worksheet[ref]) worksheet[ref] = { v: headers[c], t: "s" }
      worksheet[ref].s = headerStyle
    }

    // ─── Data rows ───────────────────────────────────────────────────────────────
    rows.forEach((row, rowIndex) => {
      const excelRow = DATA_START_ROW + rowIndex
      const isEven = rowIndex % 2 === 0

      headers.forEach((colKey, colIndex) => {
        const ref = `${colLetter(colIndex)}${excelRow}`
        if (!worksheet[ref]) worksheet[ref] = { v: "", t: "s" }

        let baseStyle = {
          font: { sz: 9.5, color: { rgb: "111827" } },
          fill: { fgColor: { rgb: isEven ? "FFFFFF" : "F9FAFB" } },
          border: thinBorder,
          alignment: { vertical: "center" },
        }

        // Sr No.: centered + bold
        if (colKey === "Sr No.") {
          baseStyle.alignment = { horizontal: "center", vertical: "center" }
          baseStyle.font = { ...baseStyle.font, bold: true }
        }

        // Date: centered
        if (colKey === "Date") {
          baseStyle.alignment = { horizontal: "center", vertical: "center" }
        }

        // Franchise / Client: left aligned, slightly muted
        if (colKey === "Franchise / Client") {
          baseStyle.font = { ...baseStyle.font, color: { rgb: "374151" }, italic: true }
          baseStyle.alignment = { horizontal: "left", vertical: "center" }
        }

        // Receiver Country: centered
        if (colKey === "Receiver Country") {
          baseStyle.alignment = { horizontal: "center", vertical: "center" }
          baseStyle.font = { ...baseStyle.font, color: { rgb: "374151" } }
        }

        // Type: green = Domestic, blue = International
        if (colKey === "Type") {
          const isDomestic = row.shipmentType === "Domestic"
          baseStyle = {
            ...baseStyle,
            font: { sz: 9.5, bold: true, color: { rgb: isDomestic ? "065F46" : "1E40AF" } },
            fill: { fgColor: { rgb: isDomestic ? "D1FAE5" : "DBEAFE" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: thinBorder,
          }
        }

        // Service: purple = courier, grey = Self
        if (colKey === "Service") {
          const isSelf = row.service === "Self"
          baseStyle = {
            ...baseStyle,
            font: { sz: 9.5, bold: true, color: { rgb: isSelf ? "6B7280" : "7C3AED" } },
            fill: { fgColor: { rgb: isSelf ? "F3F4F6" : "EDE9FE" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: thinBorder,
          }
        }

        // AWB No.: red + bold + centered
        if (colKey === "AWB No.") {
          baseStyle.alignment = { horizontal: "center", vertical: "center" }
          baseStyle.font = { ...baseStyle.font, bold: true, color: { rgb: "DC2626" } }
        }

        // Box No.: centered
        if (colKey === "Box No.") {
          baseStyle.alignment = { horizontal: "center", vertical: "center" }
        }

        // Numeric columns: right aligned
        if (
          [
            "Actual Weight",
            "Dimensional Weight",
            "Chargeable Weight",
            "Length",
            "Breadth",
            "Height",
          ].includes(colKey)
        ) {
          baseStyle.alignment = { horizontal: "right", vertical: "center" }
          baseStyle.font = { ...baseStyle.font, color: { rgb: "374151" } }
        }

        // Chargeable Weight: amber bold
        if (colKey === "Chargeable Weight") {
          baseStyle.font = { ...baseStyle.font, bold: true, color: { rgb: "B45309" } }
        }

        worksheet[ref].s = baseStyle
      })
    })

    // ─── Totals section ──────────────────────────────────────────────────────────
    const totalLabels = [
      "Total AWBs",
      "Total Boxes",
      "Total Actual Weight",
      "Total Chargeable Weight",
    ]
    const totalsStartRow = DATA_START_ROW + rows.length + 2

    totalLabels.forEach((label, i) => {
      const excelRow = totalsStartRow + i
      const labelRef = `A${excelRow}`
      const valueRef = `B${excelRow}`

      const totalLabelStyle = {
        font: { bold: true, sz: 10, color: { rgb: "1E3A5F" } },
        fill: { fgColor: { rgb: "EFF6FF" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "BFDBFE" } },
          bottom: { style: "thin", color: { rgb: "BFDBFE" } },
          left: { style: "medium", color: { rgb: "1E3A5F" } },
          right: { style: "thin", color: { rgb: "BFDBFE" } },
        },
      }
      const totalValueStyle = {
        font: { bold: true, sz: 10, color: { rgb: "DC2626" } },
        fill: { fgColor: { rgb: "FEF2F2" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "FECACA" } },
          bottom: { style: "thin", color: { rgb: "FECACA" } },
          left: { style: "thin", color: { rgb: "FECACA" } },
          right: { style: "medium", color: { rgb: "DC2626" } },
        },
      }

      if (!worksheet[labelRef]) worksheet[labelRef] = { v: label, t: "s" }
      worksheet[labelRef].s = totalLabelStyle

      if (!worksheet[valueRef]) worksheet[valueRef] = { v: "", t: "s" }
      worksheet[valueRef].s = totalValueStyle
    })

    // ─── AutoFilter on header row ────────────────────────────────────────────────
    worksheet["!autofilter"] = {
      ref: `A${HEADER_ROW}:${colLetter(totalCols - 1)}${HEADER_ROW}`,
    }

    // ─── Freeze panes below header row ──────────────────────────────────────────
    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: HEADER_ROW,
      topLeftCell: `A${DATA_START_ROW}`,
      activeCell: `A${DATA_START_ROW}`,
      sqref: `A${DATA_START_ROW}`,
    }

    // ─── Summary sheet ───────────────────────────────────────────────────────────
    const serviceBreakdown = Object.entries(
      rows.reduce((acc, r) => {
        acc[r.service] = (acc[r.service] || 0) + 1
        return acc
      }, {})
    ).sort((a, b) => b[1] - a[1])

    const franchiseBreakdown = Object.entries(
      rows.reduce((acc, r) => {
        const name = r.franchiseName && r.franchiseName !== "-" ? r.franchiseName : "Unknown"
        acc[name] = (acc[name] || 0) + 1
        return acc
      }, {})
    ).sort((a, b) => b[1] - a[1])

    const summaryData = [
      ["AWB Manifest - Summary"],
      [`Generated: ${generatedAt.toLocaleString("en-IN")}`],
      [""],
      ["Metric", "Value"],
      ["Total AWBs", totals.totalAwbs],
      ["Total Boxes", totals.totalBoxes],
      ["Total Actual Weight (kg)", Number(formatNumber(totals.totalActualWeight))],
      ["Total Chargeable Weight (kg)", Number(formatNumber(totals.totalChargeableWeight))],
      [""],
      ["Shipment Type", "Count"],
      ["Domestic", rows.filter((r) => r.shipmentType === "Domestic").length],
      ["International", rows.filter((r) => r.shipmentType === "International").length],
      [""],
      ["Service", "Count"],
      ...serviceBreakdown,
      [""],
      ["Franchise / Client", "Count"],
      ...franchiseBreakdown,
    ]

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    summarySheet["!cols"] = [{ wch: 36 }, { wch: 18 }]
    summarySheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    ]

    // Style summary title
    if (summarySheet["A1"]) {
      summarySheet["A1"].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "DC2626" } },
        alignment: { horizontal: "center", vertical: "center" },
      }
    }
    if (summarySheet["A2"]) {
      summarySheet["A2"].s = {
        font: { italic: true, sz: 10, color: { rgb: "6B7280" } },
        fill: { fgColor: { rgb: "FEF2F2" } },
        alignment: { horizontal: "center" },
      }
    }

    // Style all section header rows in summary
    const summaryHeaderRows = ["A4", "B4", "A10", "B10", "A14", "B14"]
    const franchiseSectionRow = 14 + serviceBreakdown.length + 2
    summaryHeaderRows.push(`A${franchiseSectionRow}`, `B${franchiseSectionRow}`)

    summaryHeaderRows.forEach((ref) => {
      if (summarySheet[ref]) {
        summarySheet[ref].s = {
          font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1E3A5F" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: medBorder,
        }
      }
    })

    // ─── Write workbook ──────────────────────────────────────────────────────────
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest")
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")
    XLSX.writeFile(workbook, `awb-manifest-${fileDate}.xlsx`)
  }

  const handleGenerateManifest = async (type, includeCnoteDetails = false) => {
    if (selectedTrackingNumbers.length === 0 || manifestLoading) return
    setManifestLoading(true)
    try {
      // ✅ Fetch AWBs and ensure the map is resolved in parallel
      const [awbs, map] = await Promise.all([
        fetchSelectedAwbsForManifest(),
        getClientAndFranchiseMap().catch(() => new Map()),
      ])

      if (awbs.length === 0) {
        alert("No selected AWB details found for manifest generation.")
        return
      }

      if (type === "pdf") {
        generateManifestPdf(awbs, includeCnoteDetails, map)
      } else {
        generateManifestExcel(awbs, includeCnoteDetails, map)
      }
    } catch (error) {
      console.error("Manifest generation failed:", error)
      alert("Failed to generate manifest. Please try again.")
    } finally {
      setManifestLoading(false)
    }
  }

  const CellRenderer = ({ row, column }) => {
    if (column.cell) return column.cell({ row: { original: row } })
    const colKey = column.accessorKey || column.id
    if (colKey.includes(".")) {
      const keys = colKey.split(".")
      let value = row
      for (const key of keys) {
        value = value?.[key]
      }
      return value || "-"
    }
    return row[colKey] || "-"
  }

  return (
    <div className="w-full space-y-4">
      <div className="p-3 border bg-muted/50 rounded-lg">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="text-sm font-medium mb-1.5 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tracking #, sender, receiver..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-1.5 block">Country</label>
            <Input
              placeholder="Country code..."
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="h-9"
            />
          </div>
          {showClientFilter && (
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-1.5 block">Client / Franchise</label>
              <div className="relative" ref={dropdownRef}>
                <Input
                  placeholder="Client name..."
                  value={clientNameInput}
                  onChange={(e) => {
                    setClientNameInput(e.target.value)
                    setShowDropdown(true)
                    if (!e.target.value) setClientFilter("")
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="h-9"
                />
                {showDropdown && filteredClientOptions.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg mt-1 max-h-40 overflow-auto z-20">
                    {filteredClientOptions.map((opt, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSelectClient(opt)}
                        className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                      >
                        {opt.label}{" "}
                        <span className="text-xs text-muted-foreground">({opt.type})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm font-medium mb-1.5 block">Date Range</label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-2 py-1 border rounded-md text-sm bg-background"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-2 py-1 border rounded-md text-sm bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkShippingLabelPrint}
              disabled={selectedTrackingNumbers.length === 0}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Shipping & Label
              {selectedTrackingNumbers.length > 0 ? ` (${selectedTrackingNumbers.length})` : ""}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkTrackingUpdate}
              disabled={selectedTrackingNumbers.length === 0}
              className="gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Bulk Update Tracking
              {selectedTrackingNumbers.length > 0 ? ` (${selectedTrackingNumbers.length})` : ""}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={selectedTrackingNumbers.length === 0 || manifestLoading}
                  className="gap-2"
                >
                  {manifestLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Generate Manifest
                  {selectedTrackingNumbers.length > 0 ? ` (${selectedTrackingNumbers.length})` : ""}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleGenerateManifest("pdf", false)}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Download PDF (without cNote details)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleGenerateManifest("pdf", true)}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Download PDF (with cNote details)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleGenerateManifest("excel", false)}
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Excel (without cNote details)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleGenerateManifest("excel", true)}
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Excel (with cNote details)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={applyFilters}>
              Apply
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetFilters} title="Reset Filters">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" title="Toggle Columns">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {columns?.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.accessorKey || col.id}
                    checked={visibleColumns[col.accessorKey || col.id] ?? true}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        [col.accessorKey || col.id]: checked,
                      }))
                    }
                    className="capitalize"
                  >
                    {typeof col.header === "function" ? col.id : col.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground flex-wrap gap-2">
        <span>
          Showing {data.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, totalCount)} of {totalCount} results
        </span>
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newPageSize = Number(e.target.value)
              setPageSize(newPageSize)
              setPage(1)
              fetchData(1, searchTerm, countryFilter, clientFilter, startDate, endDate)
            }}
            className="border rounded px-2 py-1 text-sm bg-background"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false
                  }
                  onCheckedChange={(checked) => toggleVisibleSelection(checked === true)}
                  aria-label="Select visible AWBs"
                />
              </TableHead>
              {columns?.map((col) => {
                const key = col.accessorKey || col.id
                if (visibleColumns[key] === false) return null
                return (
                  <TableHead key={key} className="font-semibold">
                    {typeof col.header === "function" ? col.id : col.header}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading initial data...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center text-red-500"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((row, idx) => (
                <TableRow key={row.id || idx} className="hover:bg-muted/50">
                  <TableCell className="w-10 py-3">
                    <Checkbox
                      checked={!!selectedAwbs[row.trackingNumber]}
                      onCheckedChange={(checked) =>
                        toggleAwbSelection(row.trackingNumber, checked === true)
                      }
                      aria-label={`Select AWB ${row.trackingNumber}`}
                    />
                  </TableCell>
                  {columns?.map((col) => {
                    const key = col.accessorKey || col.id
                    if (visibleColumns[key] === false) return null
                    return (
                      <TableCell key={key} className="py-3">
                        <CellRenderer row={row} column={col} />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    (columns?.filter(
                      (c) => visibleColumns[c.accessorKey || c.id] !== false
                    ).length || 0) + 1
                  }
                  className="text-center py-8 text-muted-foreground"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </div>
                  ) : (
                    "No results found"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              fetchData(page - 1, searchTerm, countryFilter, clientFilter, startDate, endDate)
            }
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              fetchData(page + 1, searchTerm, countryFilter, clientFilter, startDate, endDate)
            }
            disabled={page === totalPages || loading}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}