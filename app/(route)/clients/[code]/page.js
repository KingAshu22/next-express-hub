"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  Package,
  TrendingUp,
  Search,
  Download,
  Eye,
  ChevronUp,
  ChevronDown,
  CalendarIcon,
  ExternalLink,
  FileText,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ClientMISPage() {
  const params = useParams()
  const code = params.code

  const [client, setClient] = useState(null)
  const [awbs, setAwbs] = useState([])
  const [filteredAwbs, setFilteredAwbs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCountry, setFilterCountry] = useState("all")
  const [filterService, setFilterService] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Date range states
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)
  const [datePickerOpen, setDatePickerOpen] = useState({ from: false, to: false })

  // Sort states
  const [sortColumn, setSortColumn] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")

  useEffect(() => {
    if (code) {
      fetchClientData()
      fetchAwbData()
    }
  }, [code])

  useEffect(() => {
    applyFiltersAndSort()
  }, [awbs, searchTerm, filterCountry, filterService, filterStatus, fromDate, toDate, sortColumn, sortOrder])

  const fetchClientData = async () => {
    try {
      const response = await fetch(`/api/clients/${code}`)
      if (!response.ok) throw new Error("Failed to fetch client data")
      const clientData = await response.json()
      setClient(clientData)
    } catch (err) {
      setError("Failed to load client data")
      console.error(err)
    }
  }

  const fetchAwbData = async () => {
    try {
      const response = await fetch(`/api/awb/refCode/${code}`)
      if (!response.ok) throw new Error("Failed to fetch AWB data")
      const awbData = await response.json()
      setAwbs(awbData)

      // Set default date range based on AWB data
      if (awbData.length > 0) {
        const dates = awbData.map((awb) => new Date(awb.date)).sort((a, b) => a.getTime() - b.getTime())
        setFromDate(dates[0]) // Earliest date
        setToDate(dates[dates.length - 1]) // Latest date
      }

      setLoading(false)
    } catch (err) {
      setError("Failed to load AWB data")
      setLoading(false)
      console.error(err)
    }
  }

  // Calculate dimensional weight (L x B x H / 5000)
  const calculateDimensionalWeight = (length, breadth, height) => {
    if (!length || !breadth || !height) return 0
    return (length * breadth * height) / 5000
  }

  // Calculate chargeable weight (max of actual weight or dimensional weight)
  const calculateChargeableWeight = (actualWeight, dimensionalWeight) => {
    return Math.max(actualWeight || 0, dimensionalWeight || 0)
  }

  // Calculate total weight for all boxes
  const calculateTotalWeight = (boxes) => {
    if (!boxes || !Array.isArray(boxes)) return 0
    return boxes.reduce((total, box) => {
      const dimensionalWeight = calculateDimensionalWeight(box.length, box.breadth, box.height)
      const chargeableWeight = calculateChargeableWeight(box.actualWeight, dimensionalWeight)
      return total + chargeableWeight
    }, 0)
  }

  // Get delivered date if status is delivered
  const getDeliveredDate = (parcelStatus) => {
    if (!parcelStatus || !Array.isArray(parcelStatus)) return null
    const deliveredStatus = parcelStatus.find((status) => status.status?.toLowerCase() === "delivered")
    return deliveredStatus ? deliveredStatus.timestamp : null
  }

  // Create expanded rows for each box
  const createExpandedRows = (awbs) => {
    const expandedRows = []

    awbs.forEach((awb) => {
      if (!awb.boxes || awb.boxes.length === 0) {
        // If no boxes, create one row with empty box data
        expandedRows.push({
          ...awb,
          boxIndex: null,
          box: null,
          isFirstRow: true,
          totalBoxes: 0,
        })
      } else {
        // Create a row for each box
        awb.boxes.forEach((box, index) => {
          expandedRows.push({
            ...awb,
            boxIndex: index,
            box: box,
            isFirstRow: index === 0,
            totalBoxes: awb.boxes.length,
          })
        })
      }
    })

    return expandedRows
  }

  const applyFiltersAndSort = () => {
    let filtered = [...awbs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (awb) =>
          awb.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          awb.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          awb.receiver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          awb.receiver?.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          awb.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          awb.forwardingNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Country filter
    if (filterCountry !== "all") {
      filtered = filtered.filter((awb) => awb.receiver?.country === filterCountry)
    }

    // Service filter
    if (filterService !== "all") {
      filtered = filtered.filter((awb) => awb?.rateInfo?.courier === filterService)
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((awb) => {
        const latestStatus = awb.parcelStatus?.[awb.parcelStatus.length - 1]?.status
        return latestStatus === filterStatus
      })
    }

    // Custom date range filter
    if (fromDate && toDate) {
      filtered = filtered.filter((awb) => {
        const awbDate = new Date(awb.date)
        const from = new Date(fromDate)
        const to = new Date(toDate)
        from.setHours(0, 0, 0, 0)
        to.setHours(23, 59, 59, 999)
        return awbDate >= from && awbDate <= to
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortColumn) {
        case "date":
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case "trackingNumber":
          aValue = a.trackingNumber || ""
          bValue = b.trackingNumber || ""
          break
        case "forwardingNumber":
          aValue = a.forwardingNumber || ""
          bValue = b.forwardingNumber || ""
          break
        case "sender":
          aValue = a.sender?.name || ""
          bValue = b.sender?.name || ""
          break
        case "receiver":
          aValue = a.receiver?.name || ""
          bValue = b.receiver?.name || ""
          break
        case "country":
          aValue = a.receiver?.country || ""
          bValue = b.receiver?.country || ""
          break
        case "service":
          aValue = a?.rateInfo?.courier || ""
          bValue = b?.rateInfo?.courier || ""
          break
        case "boxes":
          aValue = a.boxes?.length || 0
          bValue = b.boxes?.length || 0
          break
        case "totalWeight":
          aValue = calculateTotalWeight(a.boxes)
          bValue = calculateTotalWeight(b.boxes)
          break
        case "status":
          aValue = a.parcelStatus?.[a.parcelStatus.length - 1]?.status || ""
          bValue = b.parcelStatus?.[b.parcelStatus.length - 1]?.status || ""
          break
        case "value":
          aValue = Number.parseFloat(a?.rateInfo?.totalWithGST) || 0
          bValue = Number.parseFloat(b?.rateInfo?.totalWithGST) || 0
          break
        default:
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredAwbs(filtered)
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    )
  }

  const getUniqueCountries = () => {
    const countries = awbs.map((awb) => awb.receiver?.country).filter(Boolean)
    return [...new Set(countries)]
  }

  const getUniqueServices = () => {
    const services = awbs.map((awb) => awb?.rateInfo?.courier).filter(Boolean)
    return [...new Set(services)]
  }

  const getUniqueStatuses = () => {
    const statuses = awbs
      .map((awb) => {
        const latestStatus = awb.parcelStatus?.[awb.parcelStatus.length - 1]?.status
        return latestStatus
      })
      .filter(Boolean)
    return [...new Set(statuses)]
  }

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "default"
      case "in transit":
        return "secondary"
      case "pending":
        return "outline"
      default:
        return "outline"
    }
  }

  const calculateStats = () => {
    const totalShipments = filteredAwbs.length
    const totalValue = filteredAwbs.reduce((sum, awb) => sum + (Number.parseFloat(awb?.rateInfo?.totalWithGST) || 0), 0)
    const totalBoxes = filteredAwbs.reduce((sum, awb) => sum + (awb.boxes?.length || 0), 0)
    const totalWeight = filteredAwbs.reduce((sum, awb) => sum + calculateTotalWeight(awb.boxes), 0)
    const deliveredCount = filteredAwbs.filter((awb) => {
      const latestStatus = awb.parcelStatus?.[awb.parcelStatus.length - 1]?.status
      return latestStatus?.toLowerCase() === "delivered"
    }).length

    return { totalShipments, totalValue, totalBoxes, totalWeight, deliveredCount }
  }

  const exportToCSV = () => {
    try {
      const stats = calculateStats()
      const expandedRows = createExpandedRows(filteredAwbs)
      const currentDate = new Date().toLocaleDateString()

      // Create CSV data array
      const csvData = []

      // Add letterhead information
      csvData.push(["Kargo One"])
      csvData.push(["Management Information System (MIS) Report"])
      csvData.push([])
      csvData.push(["Report Generated:", currentDate])
      csvData.push([])

      // Client information
      csvData.push(["CLIENT INFORMATION"])
      csvData.push([
        "Client Code",
        code,
        "",
        "",
        "Client Name",
        client?.name || "N/A",
        "",
        "",
        "Client Email",
        client?.email || "N/A",
      ])
      csvData.push([])

      // Report period
      csvData.push(["REPORT PERIOD"])
      csvData.push([
        "Start Date",
        fromDate ? format(fromDate, "PPP") : "All Time",
        "",
        "",
        "End Date",
        toDate ? format(toDate, "PPP") : "All Time",
      ])
      csvData.push([])

      // Summary statistics
      csvData.push(["SUMMARY STATISTICS"])
      csvData.push([
        "Total Shipments",
        stats.totalShipments.toString(),
        "",
        "",
        "Total Value",
        `Rs. ${stats.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        "",
        "",
        "Total Boxes",
        stats.totalBoxes.toString(),
        "",
        "",
        "Total Weight",
        `${stats.totalWeight.toFixed(2)} kg`,
      ])
      csvData.push([])
      csvData.push(["DETAILED SHIPMENT DATA"])
      csvData.push([])

      // Add headers as separate array elements
      const headers = [
        "Date",
        "Tracking Number",
        "Forwarding Number",
        "Sender",
        "Receiver",
        "Country",
        "Service",
        "Box Number",
        "Actual Weight (kg)",
        "Length (cm)",
        "Breadth (cm)",
        "Height (cm)",
        "Dimensional Weight (kg)",
        "Chargeable Weight (kg)",
        "Total Weight (kg)",
        "Status",
        "Delivered Date",
        "Rate (Rs.)",
        "SubTotal (Rs.)",
        "GST (Rs.)",
        "Total (Rs.)",
      ]

      csvData.push(headers)

      // Add data rows
      expandedRows.forEach((row) => {
        const latestStatus = row.parcelStatus?.[row.parcelStatus.length - 1]?.status || ""
        const deliveredDate = getDeliveredDate(row.parcelStatus)
        const totalWeight = calculateTotalWeight(row.boxes)

        let boxData = {
          number: "",
          actualWeight: "0.000",
          length: "0",
          breadth: "0",
          height: "0",
          dimensionalWeight: "0.00",
          chargeableWeight: "0.00",
        }

        if (row.box) {
          const dimensionalWeight = calculateDimensionalWeight(row.box.length, row.box.breadth, row.box.height)
          const chargeableWeight = calculateChargeableWeight(row.box.actualWeight, dimensionalWeight)
          boxData = {
            number: `Box ${row.boxIndex + 1}`,
            actualWeight: (Number.parseFloat(row.box.actualWeight.toString()) || 0).toFixed(3),
            length: row.box.length?.toString() || "0",
            breadth: row.box.breadth?.toString() || "0",
            height: row.box.height?.toString() || "0",
            dimensionalWeight: dimensionalWeight.toFixed(2),
            chargeableWeight: chargeableWeight.toFixed(2),
          }
        }

        const dataRow = [
          new Date(row.date).toLocaleDateString(),
          row.trackingNumber || "",
          row.forwardingNumber || "",
          row.sender?.name || "",
          row.receiver?.name || "",
          row.receiver?.country || "",
          row?.rateInfo?.courier || "",
          boxData.number,
          boxData.actualWeight,
          boxData.length,
          boxData.breadth,
          boxData.height,
          boxData.dimensionalWeight,
          boxData.chargeableWeight,
          totalWeight.toFixed(2),
          latestStatus,
          deliveredDate ? new Date(deliveredDate).toLocaleDateString() : "",
          (Number.parseFloat(row?.rateInfo?.rate) || 0).toFixed(2),
          (Number.parseFloat(row?.rateInfo?.baseCharge) || 0).toFixed(2),
          (Number.parseFloat(row?.rateInfo?.GST) || 0).toFixed(2),
          (Number.parseFloat(row?.rateInfo?.totalWithGST) || 0).toFixed(2),
        ]

        csvData.push(dataRow)
      })

      // Convert to CSV string with proper escaping
      const csvContent = csvData
        .map((row) =>
          row
            .map((field) => {
              const fieldStr = String(field || "")
              // Escape fields that contain commas, quotes, or newlines
              if (
                fieldStr.includes(",") ||
                fieldStr.includes('"') ||
                fieldStr.includes("\n") ||
                fieldStr.includes("\r")
              ) {
                return `"${fieldStr.replace(/"/g, '""')}"`
              }
              return fieldStr
            })
            .join(","),
        )
        .join("\r\n")

      // Add UTF-8 BOM for proper Excel encoding
      const BOM = "\uFEFF"
      const finalContent = BOM + csvContent

      // Create and download file
      const dateRangeText =
        fromDate && toDate ? `_${format(fromDate, "yyyy-MM-dd")}_to_${format(toDate, "yyyy-MM-dd")}` : ""

      const blob = new Blob([finalContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Express_Hub_MIS_${(client?.name || code).replace(/[^a-zA-Z0-9]/g, "_")}${dateRangeText}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting CSV:", error)
      setError("Failed to export CSV file")
    }
  }

  const exportToPDF = async () => {
    try {
      const stats = calculateStats()
      const expandedRows = createExpandedRows(filteredAwbs)
      const currentDate = new Date().toLocaleDateString()

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Kargo One MIS Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            .letterhead { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .report-title { font-size: 18px; color: #374151; margin-bottom: 20px; }
            .info-section { margin-bottom: 20px; }
            .info-title { font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .info-row { display: flex; margin-bottom: 5px; }
            .info-label { font-weight: bold; width: 150px; }
            .info-value { flex: 1; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
            .summary-label { font-size: 12px; color: #6b7280; margin-bottom: 5px; }
            .summary-value { font-size: 18px; font-weight: bold; color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
            th, td { border: 1px solid #e5e7eb; padding: 6px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-blue { color: #1e40af; }
            .text-green { color: #059669; }
            @media print {
              body { margin: 0; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="company-name">Kargo One</div>
            <div class="report-title">Management Information System (MIS) Report</div>
            <div>Report Generated: ${currentDate}</div>
          </div>

          <div class="info-section">
            <div class="info-title">CLIENT INFORMATION</div>
            <div class="info-row">
              <div class="info-label">Client Code:</div>
              <div class="info-value">${code}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Client Name:</div>
              <div class="info-value">${client?.name || "N/A"}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Client Email:</div>
              <div class="info-value">${client?.email || "N/A"}</div>
            </div>
          </div>

          <div class="info-section">
            <div class="info-title">REPORT PERIOD</div>
            <div class="info-row">
              <div class="info-label">Start Date:</div>
              <div class="info-value">${fromDate ? format(fromDate, "PPP") : "All Time"}</div>
            </div>
            <div class="info-row">
              <div class="info-label">End Date:</div>
              <div class="info-value">${toDate ? format(toDate, "PPP") : "All Time"}</div>
            </div>
          </div>

          <div class="info-section">
            <div class="info-title">SUMMARY STATISTICS</div>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-label">Total Shipments</div>
                <div class="summary-value">${stats.totalShipments}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Value</div>
                <div class="summary-value">₹${stats.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Boxes</div>
                <div class="summary-value">${stats.totalBoxes}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Weight</div>
                <div class="summary-value">${stats.totalWeight.toFixed(2)} kg</div>
              </div>
            </div>
          </div>

          <div class="page-break"></div>
          <div class="info-title">DETAILED SHIPMENT DATA</div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Tracking No</th>
                <th>Forwarding No</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Country</th>
                <th>Service</th>
                <th>Box No</th>
                <th>Act Wt (kg)</th>
                <th>L (cm)</th>
                <th>B (cm)</th>
                <th>H (cm)</th>
                <th>Dim Wt (kg)</th>
                <th>Chg Wt (kg)</th>
                <th>Tot Wt (kg)</th>
                <th>Status</th>
                <th>Delivery Date</th>
                <th>Rate (₹)</th>
                <th>SubTotal (₹)</th>
                <th>GST (₹)</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${expandedRows
                .map((row) => {
                  const latestStatus = row.parcelStatus?.[row.parcelStatus.length - 1]?.status || ""
                  const deliveredDate = getDeliveredDate(row.parcelStatus)
                  const totalWeight = calculateTotalWeight(row.boxes)

                  let boxData = {
                    number: "",
                    actualWeight: "",
                    length: "",
                    breadth: "",
                    height: "",
                    dimensionalWeight: "",
                    chargeableWeight: "",
                  }

                  if (row.box) {
                    const dimensionalWeight = calculateDimensionalWeight(
                      row.box.length,
                      row.box.breadth,
                      row.box.height,
                    )
                    const chargeableWeight = calculateChargeableWeight(row.box.actualWeight, dimensionalWeight)
                    boxData = {
                      number: (row.boxIndex + 1).toString(),
                      actualWeight: (Number.parseFloat(row.box.actualWeight.toString()) || 0).toFixed(3),
                      length: row.box.length?.toString() || "0",
                      breadth: row.box.breadth?.toString() || "0",
                      height: row.box.height?.toString() || "0",
                      dimensionalWeight: dimensionalWeight.toFixed(2),
                      chargeableWeight: chargeableWeight.toFixed(2),
                    }
                  }

                  return `
                  <tr>
                    <td>${new Date(row.date).toLocaleDateString()}</td>
                    <td class="font-bold">${row.trackingNumber || "N/A"}</td>
                    <td>${row.forwardingNumber || "N/A"}</td>
                    <td>${row.sender?.name || "N/A"}</td>
                    <td>${row.receiver?.name || "N/A"}</td>
                    <td>${row.receiver?.country || "N/A"}</td>
                    <td>${row?.rateInfo?.courier || ""}</td>
                    <td class="text-center text-blue">${boxData.number}</td>
                    <td class="text-center">${boxData.actualWeight}</td>
                    <td class="text-center">${boxData.length}</td>
                    <td class="text-center">${boxData.breadth}</td>
                    <td class="text-center">${boxData.height}</td>
                    <td class="text-center">${boxData.dimensionalWeight}</td>
                    <td class="text-center text-green font-bold">${boxData.chargeableWeight}</td>
                    <td class="text-center font-bold">${totalWeight.toFixed(2)}</td>
                    <td>${latestStatus}</td>
                    <td>${deliveredDate ? new Date(deliveredDate).toLocaleDateString() : ""}</td>
                    <td class="text-center">₹${(Number.parseFloat(row?.rateInfo?.rate) || 0).toFixed(2)}</td>
                    <td class="text-center">₹${(Number.parseFloat(row?.rateInfo?.baseCharge) || 0).toFixed(2)}</td>
                    <td class="text-center">₹${(Number.parseFloat(row?.rateInfo?.GST) || 0).toFixed(2)}</td>
                    <td class="text-center font-bold">₹${(Number.parseFloat(row?.rateInfo?.totalWithGST) || 0).toFixed(2)}</td>
                  </tr>
                `
                })
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `

      // Create a new window and print
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()

        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 500)
        }
      }
    } catch (error) {
      console.error("Error exporting PDF:", error)
      setError("Failed to export PDF file")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading client data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription className="text-red-500">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const stats = calculateStats()
  const expandedRows = createExpandedRows(filteredAwbs)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{client?.name || "Client"} - MIS Dashboard</h1>
          <p className="text-muted-foreground">
            Client Code: {code} | Email: {client?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} className="w-fit">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="w-fit bg-white text-black">
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Selection */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <CalendarIcon className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
          <CardDescription className="text-blue-700">Select custom date range for filtering shipments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="from-date" className="text-sm font-medium text-blue-900">
                From Date
              </Label>
              <Popover
                open={datePickerOpen.from}
                onOpenChange={(open) => setDatePickerOpen((prev) => ({ ...prev, from: open }))}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-blue-200 hover:border-blue-300 bg-white text-black"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                    {fromDate ? format(fromDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate || undefined}
                    onSelect={(date) => {
                      setFromDate(date || null)
                      setDatePickerOpen((prev) => ({ ...prev, from: false }))
                    }}
                    disabled={(date) => (toDate ? date > toDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="to-date" className="text-sm font-medium text-blue-900">
                To Date
              </Label>
              <Popover
                open={datePickerOpen.to}
                onOpenChange={(open) => setDatePickerOpen((prev) => ({ ...prev, to: open }))}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-blue-200 hover:border-blue-300 bg-white text-black"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                    {toDate ? format(toDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate || undefined}
                    onSelect={(date) => {
                      setToDate(date || null)
                      setDatePickerOpen((prev) => ({ ...prev, to: false }))
                    }}
                    disabled={(date) => (fromDate ? date < fromDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (awbs.length > 0) {
                    const dates = awbs.map((awb) => new Date(awb.date)).sort((a, b) => a.getTime() - b.getTime())
                    setFromDate(dates[0])
                    setToDate(dates[dates.length - 1])
                  }
                }}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-white"
              >
                Reset to All
              </Button>
              <Button
                onClick={() => {
                  const today = new Date()
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(today.getDate() - 30)
                  setFromDate(thirtyDaysAgo)
                  setToDate(today)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Last 30 Days
              </Button>
            </div>
          </div>

          {fromDate && toDate && (
            <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Selected Range:</strong> {format(fromDate, "PPP")} to {format(toDate, "PPP")}
                <span className="ml-2 text-blue-600">({filteredAwbs.length} shipments)</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShipments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹
              {stats.totalValue.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Boxes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBoxes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWeight.toFixed(2)} kg</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search tracking, forwarding, receiver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {getUniqueCountries().map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="service">Service</Label>
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {getUniqueServices().map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {getUniqueStatuses().map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AWB Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Shipments ({filteredAwbs.length} shipments, {expandedRows.length} rows)
          </CardTitle>
          <CardDescription>All shipments for {client?.name} - Each box shown as separate row</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("date")}
                    >
                      Date
                      {getSortIcon("date")}
                    </Button>
                  </TableHead>
                  <TableHead>Trk No</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleSort("forwardingNumber")}
                    >
                      For No
                      {getSortIcon("forwardingNumber")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("sender")}
                    >
                      Sender
                      {getSortIcon("sender")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("receiver")}
                    >
                      Receiver
                      {getSortIcon("receiver")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("country")}
                    >
                      Country
                      {getSortIcon("country")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("service")}
                    >
                      Service
                      {getSortIcon("service")}
                    </Button>
                  </TableHead>
                  <TableHead>Box No</TableHead>
                  <TableHead className="whitespace-nowrap">Act Wt</TableHead>
                  <TableHead>L</TableHead>
                  <TableHead>B</TableHead>
                  <TableHead>H</TableHead>
                  <TableHead className="whitespace-nowrap">Dim Wt</TableHead>
                  <TableHead className="whitespace-nowrap">Chg Wt</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("totalWeight")}
                    >
                      Tot Wt
                      {getSortIcon("totalWeight")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("status")}
                    >
                      Status
                      {getSortIcon("status")}
                    </Button>
                  </TableHead>
                  <TableHead>Delivery Dt</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>SubTotal</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("value")}
                    >
                      Total
                      {getSortIcon("value")}
                    </Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expandedRows.map((row, index) => {
                  const latestStatus = row.parcelStatus?.[row.parcelStatus.length - 1]
                  const deliveredDate = getDeliveredDate(row.parcelStatus)
                  const totalWeight = calculateTotalWeight(row.boxes)

                  let boxData = {
                    number: "",
                    actualWeight: "",
                    length: "",
                    breadth: "",
                    height: "",
                    dimensionalWeight: "",
                    chargeableWeight: "",
                  }

                  if (row.box) {
                    const dimensionalWeight = calculateDimensionalWeight(
                      row.box.length,
                      row.box.breadth,
                      row.box.height,
                    )
                    const chargeableWeight = calculateChargeableWeight(row.box.actualWeight, dimensionalWeight)
                    boxData = {
                      number: (row.boxIndex + 1).toString(),
                      actualWeight: (Number.parseFloat(row.box.actualWeight.toString()) || 0).toFixed(3),
                      length: row.box.length?.toString() || "0",
                      breadth: row.box.breadth?.toString() || "0",
                      height: row.box.height?.toString() || "0",
                      dimensionalWeight: dimensionalWeight.toFixed(2),
                      chargeableWeight: chargeableWeight.toFixed(2),
                    }
                  }

                  const isFirstRow = row.isFirstRow
                  const rowSpan = row.totalBoxes || 1

                  return (
                    <TableRow
                      key={`${row._id}-${row.boxIndex || 0}`}
                      className={row.boxIndex !== null && row.boxIndex > 0 ? "border-t-0" : ""}
                    >
                      {/* Show shipment data only in first row */}
                      {isFirstRow && (
                        <>
                          <TableCell rowSpan={rowSpan}>{new Date(row.date).toLocaleDateString()}</TableCell>
                          <TableCell rowSpan={rowSpan} className="font-medium">
                            {row.trackingNumber || "N/A"}
                          </TableCell>
                          <TableCell rowSpan={rowSpan}>
                            {row.forwardingNumber && row.forwardingLink ? (
                              <a
                                href={row.forwardingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                              >
                                {row.forwardingNumber}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              row.forwardingNumber || "N/A"
                            )}
                          </TableCell>
                          <TableCell rowSpan={rowSpan}>{row.sender?.name || "N/A"}</TableCell>
                          <TableCell rowSpan={rowSpan}>{row.receiver?.name || "N/A"}</TableCell>
                          <TableCell rowSpan={rowSpan}>{row.receiver?.country || "N/A"}</TableCell>
                          <TableCell rowSpan={rowSpan} className="uppercase">
                            {row?.rateInfo?.courier}
                          </TableCell>
                        </>
                      )}

                      {/* Box data - shown in every row */}
                      <TableCell className="font-medium text-blue-600">{boxData.number}</TableCell>
                      <TableCell className="text-center">{boxData.actualWeight}</TableCell>
                      <TableCell className="text-center">{boxData.length}</TableCell>
                      <TableCell className="text-center">{boxData.breadth}</TableCell>
                      <TableCell className="text-center">{boxData.height}</TableCell>
                      <TableCell className="text-center">{boxData.dimensionalWeight}</TableCell>
                      <TableCell className="text-center font-medium text-green-600">
                        {boxData.chargeableWeight}
                      </TableCell>

                      {/* Show total data only in first row */}
                      {isFirstRow && (
                        <>
                          <TableCell rowSpan={rowSpan} className="font-bold">
                            {totalWeight.toFixed(2)}
                          </TableCell>
                          <TableCell rowSpan={rowSpan}>
                            <Badge variant={getStatusBadgeVariant(latestStatus?.status || "")}>
                              {latestStatus?.status || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell rowSpan={rowSpan}>
                            {deliveredDate ? new Date(deliveredDate).toLocaleDateString() : ""}
                          </TableCell>
                          <TableCell rowSpan={rowSpan}>
                            ₹
                            {(Number.parseFloat(row?.rateInfo?.rate) || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell rowSpan={rowSpan}>
                            ₹
                            {(Number.parseFloat(row?.rateInfo?.baseCharge) || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell rowSpan={rowSpan}>
                            ₹
                            {(Number.parseFloat(row?.rateInfo?.GST) || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell rowSpan={rowSpan} className="font-bold">
                            ₹
                            {(Number.parseFloat(row?.rateInfo?.totalWithGST) || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell rowSpan={rowSpan}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => navigator.clipboard.writeText(row.trackingNumber || "")}
                                >
                                  Copy tracking number
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>View details</DropdownMenuItem>
                                <DropdownMenuItem>Track shipment</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {expandedRows.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No shipments found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
