"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, Package, TrendingUp, Users, Search, ChevronUp, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import isAdminAuth from "@/lib/isAdminAuth"

function AllAWBsMISPage() {
  const [awbs, setAwbs] = useState([])
  const [clients, setClients] = useState([])
  const [franchises, setFranchises] = useState([])
  const [clientOptions, setClientOptions] = useState([])
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Date range states
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)

  // Sorting states
  const [sortColumn, setSortColumn] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch all AWBs
      const awbResponse = await fetch("/api/awb")
      if (!awbResponse.ok) throw new Error("Failed to fetch AWB data")
      const awbData = await awbResponse.json()

      // Fetch clients and franchises
      const [clientsResponse, franchisesResponse] = await Promise.all([fetch("/api/clients"), fetch("/api/franchises")])

      if (!clientsResponse.ok) throw new Error("Failed to fetch client data")
      if (!franchisesResponse.ok) throw new Error("Failed to fetch franchise data")

      const clientsData = await clientsResponse.json()
      const franchisesData = await franchisesResponse.json()

      setAwbs(awbData)
      setClients(clientsData)
      setFranchises(franchisesData)

      const combinedOptions = [
        ...clientsData.map((client) => ({
          code: client.code,
          name: client.name,
          type: "client",
        })),
        ...franchisesData.map((franchise) => ({
          code: franchise.code,
          name: franchise.name,
          type: "franchise",
        })),
      ]
      setClientOptions(combinedOptions)

      // Set default date range based on AWB data
      if (awbData.length > 0) {
        const dates = awbData.map((awb) => new Date(awb.date)).sort((a, b) => a.getTime() - b.getTime())
        setFromDate(dates[0])
        setToDate(dates[dates.length - 1])
      }

      setLoading(false)
    } catch (err) {
      setError("Failed to load data")
      setLoading(false)
      console.error(err)
    }
  }

  const getClientName = (refCode) => {
    const client = clients.find((c) => c.code === refCode)
    if (client) return client.name

    const franchise = franchises.find((f) => f.code === refCode)
    if (franchise) return franchise.name

    return refCode || "Unknown"
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

  // Create expanded rows for each box
  const createExpandedRows = (awbs) => {
    const expandedRows = []

    awbs.forEach((awb) => {
      if (!awb.boxes || awb.boxes.length === 0) {
        expandedRows.push({
          ...awb,
          boxIndex: null,
          box: null,
          isFirstRow: true,
          totalBoxes: 0,
        })
      } else {
        awb.boxes.forEach((box, index) => {
          const dimensionalWeight = calculateDimensionalWeight(box.length, box.breadth, box.height)
          const chargeableWeight = calculateChargeableWeight(box.actualWeight, dimensionalWeight)

          expandedRows.push({
            ...awb,
            boxIndex: index,
            box: {
              ...box,
              dimensionalWeight,
              chargeableWeight,
            },
            isFirstRow: index === 0,
            totalBoxes: awb.boxes.length,
          })
        })
      }
    })

    return expandedRows
  }

  const filteredAwbs = useMemo(() => {
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
          awb.forwardingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          awb.refCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getClientName(awb.refCode)?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Client filter
    if (clientFilter !== "all") {
      filtered = filtered.filter((awb) => awb.refCode === clientFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((awb) => {
        const latestStatus = awb.parcelStatus?.[awb.parcelStatus.length - 1]?.status
        return latestStatus?.toLowerCase() === statusFilter.toLowerCase()
      })
    }

    // Service filter
    if (serviceFilter !== "all") {
      filtered = filtered.filter((awb) => awb?.rateInfo?.courier === serviceFilter)
    }

    // Country filter
    if (countryFilter !== "all") {
      filtered = filtered.filter((awb) => awb.receiver?.country === countryFilter)
    }

    // Date range filter
    if (fromDate) {
      filtered = filtered.filter((awb) => new Date(awb.date) >= fromDate)
    }
    if (toDate) {
      filtered = filtered.filter((awb) => new Date(awb.date) <= toDate)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortColumn) {
        case "date":
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case "refCode":
          aValue = getClientName(a.refCode)?.toLowerCase() || ""
          bValue = getClientName(b.refCode)?.toLowerCase() || ""
          break
        case "sender":
          aValue = a.sender?.name?.toLowerCase() || ""
          bValue = b.sender?.name?.toLowerCase() || ""
          break
        case "receiver":
          aValue = a.receiver?.name?.toLowerCase() || ""
          bValue = b.receiver?.name?.toLowerCase() || ""
          break
        case "country":
          aValue = a.receiver?.country?.toLowerCase() || ""
          bValue = b.receiver?.country?.toLowerCase() || ""
          break
        case "service":
          aValue = a?.rateInfo?.courier?.toLowerCase() || ""
          bValue = b?.rateInfo?.courier?.toLowerCase() || ""
          break
        case "status":
          aValue = a.parcelStatus?.[a.parcelStatus.length - 1]?.status?.toLowerCase() || ""
          bValue = b.parcelStatus?.[b.parcelStatus.length - 1]?.status?.toLowerCase() || ""
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

    return filtered
  }, [
    awbs,
    searchTerm,
    clientFilter,
    statusFilter,
    serviceFilter,
    countryFilter,
    fromDate,
    toDate,
    sortColumn,
    sortOrder,
    clients,
    franchises,
  ])

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
    const uniqueCountries = getUniqueCountries().length
    const uniqueClients = [...new Set(filteredAwbs.map((awb) => awb.refCode))].length
    const deliveredCount = filteredAwbs.filter((awb) => {
      const latestStatus = awb.parcelStatus?.[awb.parcelStatus.length - 1]?.status
      return latestStatus?.toLowerCase() === "delivered"
    }).length

    return { totalShipments, totalValue, totalBoxes, totalWeight, uniqueCountries, uniqueClients, deliveredCount }
  }

  const exportToCSV = () => {
    try {
      const stats = calculateStats()
      const expandedRows = createExpandedRows(filteredAwbs)
      const currentDate = new Date().toLocaleDateString()

      const csvData = []

      // Add letterhead information
      csvData.push(["Kargo Onee"])
      csvData.push(["All AWBs Management Information System (MIS) Report"])
      csvData.push([])
      csvData.push(["Report Generated:", currentDate])
      csvData.push([])

      // Summary statistics in one line
      csvData.push(["SUMMARY STATISTICS"])
      csvData.push([
        `Total Shipments: ${stats.totalShipments} | Total Value: Rs. ${stats.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Total Boxes: ${stats.totalBoxes} | Total Weight: ${stats.totalWeight.toFixed(2)} kg | Countries Served: ${stats.uniqueCountries} | Active Clients: ${stats.uniqueClients}`,
      ])
      csvData.push([])
      csvData.push(["DETAILED SHIPMENT DATA"])
      csvData.push([])

      // Headers
      const headers = [
        "Date",
        "Client Code",
        "Client Name",
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
            actualWeight: (Number.parseFloat(row.box.actualWeight?.toString()) || 0).toFixed(3),
            length: row.box.length?.toString() || "0",
            breadth: row.box.breadth?.toString() || "0",
            height: row.box.height?.toString() || "0",
            dimensionalWeight: dimensionalWeight.toFixed(2),
            chargeableWeight: chargeableWeight.toFixed(2),
          }
        }

        const dataRow = [
          new Date(row.date).toLocaleDateString(),
          row.refCode || "",
          getClientName(row.refCode),
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

      // Convert to CSV string
      const csvContent = csvData
        .map((row) =>
          row
            .map((field) => {
              const fieldStr = String(field || "")
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

      const BOM = "\uFEFF"
      const finalContent = BOM + csvContent

      const dateRangeText =
        fromDate && toDate ? `_${format(fromDate, "yyyy-MM-dd")}_to_${format(toDate, "yyyy-MM-dd")}` : ""

      const blob = new Blob([finalContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Express_Hub_All_AWBs_MIS${dateRangeText}.csv`
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

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Kargo Onee All AWBs MIS Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            .letterhead { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .report-title { font-size: 18px; color: #374151; margin-bottom: 20px; }
            .info-section { margin-bottom: 20px; }
            .info-title { font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
            .summary-label { font-size: 12px; color: #6b7280; margin-bottom: 5px; }
            .summary-value { font-size: 18px; font-weight: bold; color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 9px; }
            th, td { border: 1px solid #e5e7eb; padding: 4px; text-align: left; }
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
            <div class="company-name">Kargo Onee</div>
            <div class="report-title">All AWBs Management Information System (MIS) Report</div>
            <div>Report Generated: ${currentDate}</div>
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
                <div class="summary-label">Total Weight</div>
                <div class="summary-value">${stats.totalWeight.toFixed(2)} kg</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Countries Served</div>
                <div class="summary-value">${stats.uniqueCountries}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Active Clients</div>
                <div class="summary-value">${stats.uniqueClients}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Boxes</div>
                <div class="summary-value">${stats.totalBoxes}</div>
              </div>
            </div>
          </div>

          <div class="page-break"></div>
          <div class="info-title">DETAILED SHIPMENT DATA</div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Tracking No</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Country</th>
                <th>Service</th>
                <th>Box</th>
                <th>Wt</th>
                <th>Status</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${expandedRows
                .slice(0, 100)
                .map((row) => {
                  const latestStatus = row.parcelStatus?.[row.parcelStatus.length - 1]?.status || ""
                  const totalWeight = calculateTotalWeight(row.boxes)

                  return `
                  <tr>
                    <td>${new Date(row.date).toLocaleDateString()}</td>
                    <td>${getClientName(row.refCode)}</td>
                    <td class="font-bold">${row.trackingNumber || "N/A"}</td>
                    <td>${row.sender?.name || "N/A"}</td>
                    <td>${row.receiver?.name || "N/A"}</td>
                    <td>${row.receiver?.country || "N/A"}</td>
                    <td>${row?.rateInfo?.courier || ""}</td>
                    <td class="text-center">${row.box ? row.boxIndex + 1 : ""}</td>
                    <td class="text-center">${totalWeight.toFixed(2)}</td>
                    <td>${latestStatus}</td>
                    <td class="text-center font-bold">₹${(Number.parseFloat(row?.rateInfo?.totalWithGST) || 0).toFixed(2)}</td>
                  </tr>
                `
                })
                .join("")}
            </tbody>
          </table>
          ${expandedRows.length > 100 ? `<p style="margin-top: 20px; font-style: italic;">Showing first 100 records. Total records: ${expandedRows.length}</p>` : ""}
        </body>
        </html>
      `

      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
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

  const filteredClientOptions = useMemo(() => {
    if (!clientSearchTerm) return clientOptions
    return clientOptions.filter((option) => option.name.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  }, [clientOptions, clientSearchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading AWB data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All AWBs - Management Information System</h1>
          <p className="text-muted-foreground">Comprehensive overview of all Air Waybills</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2 bg-transparent">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateStats().totalShipments}</div>
            <p className="text-xs text-muted-foreground">Active shipments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{calculateStats().totalValue.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">Including GST</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateStats().totalWeight.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Chargeable weight</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateStats().uniqueCountries}</div>
            <p className="text-xs text-muted-foreground">Destinations served</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
          <CardDescription>Filter and search through your AWB data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search AWBs, clients, tracking numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-filter">Filter by Client</Label>
              <div className="relative">
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client or franchise" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search clients/franchises..."
                          value={clientSearchTerm}
                          onChange={(e) => setClientSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <SelectItem value="all">All Clients</SelectItem>
                    {filteredClientOptions.map((option) => (
                      <SelectItem key={`${option.type}-${option.code}`} value={option.code}>
                        {option.name} ({option.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
                onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
                onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="detailed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="detailed">Detailed Table</TabsTrigger>
        </TabsList>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AWB Details
              </CardTitle>
              <CardDescription>Complete view of all AWBs - Each box shown as separate row</CardDescription>
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
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                          onClick={() => handleSort("refCode")}
                        >
                          Client
                          {getSortIcon("refCode")}
                        </Button>
                      </TableHead>
                      <TableHead>AWB No</TableHead>
                      <TableHead>CNote No</TableHead>
                      <TableHead>CNote Vendor</TableHead>
                      <TableHead>Fwd No</TableHead>
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
                      <TableHead>Box</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead className="whitespace-nowrap">Act Wt</TableHead>
                      <TableHead className="whitespace-nowrap">Dim Wt</TableHead>
                      <TableHead className="whitespace-nowrap">Chrg Wt</TableHead>
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
                    {createExpandedRows(filteredAwbs)
                      .slice(0, 100)
                      .map((row, index) => {
                        const latestStatus = row.parcelStatus?.[row.parcelStatus.length - 1]
                        const totalWeight = calculateTotalWeight(row.boxes)

                        const isFirstRow = row.isFirstRow
                        const rowSpan = row.totalBoxes || 1

                        return (
                          <TableRow
                            key={`${row._id}-${row.boxIndex || 0}`}
                            className={row.boxIndex !== null && row.boxIndex > 0 ? "border-t-0" : ""}
                          >
                            {isFirstRow && (
                              <>
                                <TableCell rowSpan={rowSpan}>{new Date(row.date).toLocaleDateString("en-IN")}</TableCell>
                                <TableCell rowSpan={rowSpan} className="font-medium text-blue-600">
                                  {getClientName(row.refCode)}
                                </TableCell>
                                <TableCell rowSpan={rowSpan} className="font-medium">
                                  <a href={`/awb/${row.trackingNumber}`}>{row.trackingNumber || "N/A"}</a>
                                </TableCell>
                                <TableCell rowSpan={rowSpan} className="font-medium">
                                  <a href={`/shipping-invoice/${row?.trackingNumber}`}>{row?.cNoteNumber || "N/A"}</a>
                                </TableCell>
                                <TableCell rowSpan={rowSpan} className="font-medium">
                                  {row?.cNoteVendorName || "N/A"}
                                </TableCell>
                                <TableCell rowSpan={rowSpan} className="font-medium">
                                  <a href={`/track/${row?.trackingNumber}`}>{row?.forwardingNumber || "N/A"}</a>
                                </TableCell>
                                <TableCell rowSpan={rowSpan}>{row.sender?.name || "N/A"}</TableCell>
                                <TableCell rowSpan={rowSpan}>{row.receiver?.name || "N/A"}</TableCell>
                                <TableCell rowSpan={rowSpan}>{row.receiver?.country || "N/A"}</TableCell>
                                <TableCell rowSpan={rowSpan} className="uppercase">
                                  {row?.rateInfo?.courier}
                                </TableCell>
                              </>
                            )}

                            <TableCell className="text-center">
                              {row.box ? (
                                <Badge variant="outline">{row.boxIndex + 1}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {row.box
                                ? `${row.box.length || 0}x${row.box.breadth || 0}x${row.box.height || 0}`
                                : totalWeight.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {row.box
                                ? (Number.parseFloat(row.box.actualWeight?.toString()) || 0).toFixed(2)
                                : totalWeight.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {row.box
                                ? (Number.parseFloat(row.box.dimensionalWeight?.toString()) || 0).toFixed(2)
                                : totalWeight.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {row.box
                                ? (Number.parseFloat(row.box.chargeableWeight?.toString()) || 0).toFixed(2)
                                : totalWeight.toFixed(2)}
                            </TableCell>

                            {isFirstRow && (
                              <>
                                <TableCell rowSpan={rowSpan}>
                                  <Badge variant={getStatusBadgeVariant(latestStatus?.status || "")}>
                                    {latestStatus?.status || "Unknown"}
                                  </Badge>
                                </TableCell>
                                <TableCell rowSpan={rowSpan} className="text-center font-medium">
                                  ₹{(Number.parseFloat(row?.rateInfo?.totalWithGST) || 0).toFixed(2)}
                                </TableCell>
                                <TableCell rowSpan={rowSpan}>
                                  <Button variant="outline" size="sm">
                                    View
                                  </Button>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default isAdminAuth(AllAWBsMISPage)