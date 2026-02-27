"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Download, 
  FileText, 
  Package, 
  TrendingUp, 
  Users, 
  Search, 
  ChevronUp, 
  ChevronDown,
  Globe,
  Truck,
  DollarSign,
  Calendar,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Box,
  Weight,
  Receipt,
  CreditCard,
  MapPin,
  Plane,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  Home,
  PackageX,
  Warehouse,
  ClipboardCheck,
  Navigation,
  CircleDot,
  ExternalLink,
  Activity,
  Zap,
  TrendingDown,
  PieChart,
  LineChart,
  Target,
  Percent,
  ArrowRight,
  Sparkles,
  Radio,
  Signal,
  Wifi,
  WifiOff,
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, subMonths, differenceInDays, parseISO, isValid } from "date-fns"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import isAdminAuth from "@/lib/isAdminAuth"
import Link from "next/link"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
} from "recharts"

// ==================== COLORS ====================
const CHART_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#a855f7", "#eab308", "#22c55e", "#0ea5e9"
]

const STATUS_COLORS = {
  delivered: "#10b981",
  "in transit": "#3b82f6",
  pending: "#f59e0b",
  "out for delivery": "#8b5cf6",
  cancelled: "#ef4444",
  "on hold": "#f97316",
  unknown: "#6b7280",
}

// ==================== TRACKING HELPERS ====================

const getStatusIcon = (status) => {
  const s = (status || "").toLowerCase()

  if (s.includes("delivered")) return Home
  if (s.includes("out for delivery")) return Truck
  if (s.includes("customs") || s.includes("clearance") || s.includes("cleared") || s.includes("import") || s.includes("brokerage"))
    return ClipboardCheck
  if (s.includes("arrived") || s.includes("received") || s.includes("facility"))
    return Warehouse
  if (s.includes("departed") || s.includes("transit") || s.includes("left") || s.includes("dispatch") || s.includes("export"))
    return Navigation
  if (s.includes("flight") || s.includes("airport") || s.includes("hub"))
    return Plane
  if (s.includes("booked") || s.includes("shipment") || s.includes("created") || s.includes("label") || s.includes("entry") || s.includes("pickup"))
    return Package
  if (s.includes("unsuccessful") || s.includes("failed") || s.includes("exception") || s.includes("held") || s.includes("delay"))
    return PackageX
  if (s.includes("processing") || s.includes("scan"))
    return CircleDot

  return CheckCircle2
}

const parseTime12Hour = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 }
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!match) return { hours: 0, minutes: 0 }
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3]?.toUpperCase()
  if (period === "PM" && hours !== 12) hours += 12
  else if (period === "AM" && hours === 12) hours = 0
  return { hours, minutes }
}

const parseOrdinalDate = (dateStr) => {
  if (!dateStr) return null
  const cleanedDate = dateStr.replace(/(\d+)(st|nd|rd|th)/i, "$1")
  const parsed = new Date(cleanedDate)
  if (!isNaN(parsed.getTime())) return parsed
  return null
}

const parseInternalDate = (dateInput) => {
  if (!dateInput) return 0
  const directDate = new Date(dateInput)
  if (!isNaN(directDate.getTime())) return directDate.getTime()

  const parts = String(dateInput).match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/)

  if (parts) {
    let day, month, year
    if (parts[1].length === 4) {
      year = parseInt(parts[1], 10)
      month = parseInt(parts[2], 10) - 1
      day = parseInt(parts[3], 10)
    } else {
      day = parseInt(parts[1], 10)
      month = parseInt(parts[2], 10) - 1
      year = parseInt(parts[3], 10)
    }
    const hour = parts[4] ? parseInt(parts[4], 10) : 0
    const min = parts[5] ? parseInt(parts[5], 10) : 0
    const sec = parts[6] ? parseInt(parts[6], 10) : 0
    return new Date(year, month, day, hour, min, sec).getTime()
  }
  return 0
}

const parseParcelsAppDate = (dateStr, timeStr) => {
  if (!dateStr) return 0

  try {
    const dateParts = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
    
    if (dateParts) {
      const day = parseInt(dateParts[1], 10)
      const monthStr = dateParts[2]
      const year = parseInt(dateParts[3], 10)
      
      const months = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      }
      
      const month = months[monthStr.toLowerCase().substring(0, 3)]
      
      let hours = 0
      let minutes = 0
      
      if (timeStr) {
        const timeParts = timeStr.match(/(\d{1,2}):(\d{2})/)
        if (timeParts) {
          hours = parseInt(timeParts[1], 10)
          minutes = parseInt(timeParts[2], 10)
        }
      }
      
      const dateObj = new Date(year, month, day, hours, minutes)
      return dateObj.getTime()
    }
  } catch (e) {
    console.error("ParcelsApp date parsing error:", e)
  }
  
  return 0
}

const parseEventTimestamp = (event, softwareType) => {
  try {
    if (softwareType === "xpression" || softwareType === "itd") {
      const dateStr = event.EventDate1 || event.EventDate
      const timeStr = event.EventTime1 || event.EventTime || "12:00 AM"
      let parsedDate = parseOrdinalDate(dateStr)
      if (!parsedDate) {
        parsedDate = new Date(parseInternalDate(dateStr))
      }
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        const { hours, minutes } = parseTime12Hour(timeStr)
        parsedDate.setHours(hours, minutes, 0, 0)
        return parsedDate.getTime()
      }
      return 0
    }
    return parseInternalDate(event.timestamp)
  } catch (error) {
    return 0
  }
}

const detectCarrierFromLink = (link) => {
  if (!link) return null
  const lowerLink = link.toLowerCase()

  if (lowerLink.includes("ups.com")) return "ups"
  if (lowerLink.includes("dhl.com")) return "dhl"
  if (lowerLink.includes("fedex.com")) return "fedex"
  if (lowerLink.includes("usps.com")) return "usps"
  if (lowerLink.includes("bluedart.com")) return "bluedart"
  if (lowerLink.includes("aramex.com")) return "aramex"

  return null
}

const normalizeStatus = (status) => {
  const s = (status || "").toLowerCase().trim()
  
  if (s.includes("delivered") || s.includes("completed")) return "delivered"
  if (s.includes("out for delivery") || s.includes("out_for_delivery")) return "out for delivery"
  if (s.includes("transit") || s.includes("shipped") || s.includes("departed") || s.includes("arrived") || s.includes("customs") || s.includes("clearance")) return "in transit"
  if (s.includes("pending") || s.includes("booked") || s.includes("created") || s.includes("pickup") || s.includes("label")) return "pending"
  if (s.includes("cancel") || s.includes("return")) return "cancelled"
  if (s.includes("hold") || s.includes("exception") || s.includes("failed") || s.includes("delay")) return "on hold"
  
  return s || "unknown"
}

// Status configuration
const STATUS_CONFIG = {
  delivered: { 
    color: "bg-green-100 text-green-800 border-green-200", 
    icon: CheckCircle2, 
    bgColor: "bg-green-500",
    dotColor: "bg-green-500",
    gradient: "from-green-500 to-emerald-600"
  },
  "in transit": { 
    color: "bg-blue-100 text-blue-800 border-blue-200", 
    icon: Truck, 
    bgColor: "bg-blue-500",
    dotColor: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-600"
  },
  pending: { 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    icon: Clock, 
    bgColor: "bg-yellow-500",
    dotColor: "bg-yellow-500",
    gradient: "from-yellow-500 to-amber-600"
  },
  "out for delivery": { 
    color: "bg-purple-100 text-purple-800 border-purple-200", 
    icon: Package, 
    bgColor: "bg-purple-500",
    dotColor: "bg-purple-500",
    gradient: "from-purple-500 to-violet-600"
  },
  cancelled: { 
    color: "bg-red-100 text-red-800 border-red-200", 
    icon: XCircle, 
    bgColor: "bg-red-500",
    dotColor: "bg-red-500",
    gradient: "from-red-500 to-rose-600"
  },
  "on hold": { 
    color: "bg-orange-100 text-orange-800 border-orange-200", 
    icon: AlertCircle, 
    bgColor: "bg-orange-500",
    dotColor: "bg-orange-500",
    gradient: "from-orange-500 to-amber-600"
  },
  unknown: { 
    color: "bg-gray-100 text-gray-800 border-gray-200", 
    icon: Package, 
    bgColor: "bg-gray-500",
    dotColor: "bg-gray-500",
    gradient: "from-gray-500 to-slate-600"
  },
  default: { 
    color: "bg-gray-100 text-gray-800 border-gray-200", 
    icon: Package, 
    bgColor: "bg-gray-500",
    dotColor: "bg-gray-500",
    gradient: "from-gray-500 to-slate-600"
  },
}

// Date presets
const DATE_PRESETS = [
  { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "Yesterday", getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: "Last 7 days", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Last 30 days", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "This Month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last Month", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "All Time", getValue: () => ({ from: null, to: null }) },
]

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ==================== MAIN COMPONENT ====================

function AllAWBsMISPage() {
  // Data states
  const [awbs, setAwbs] = useState([])
  const [clients, setClients] = useState([])
  const [franchises, setFranchises] = useState([])
  const [clientOptions, setClientOptions] = useState([])
  
  // Live tracking states
  const [liveTrackingData, setLiveTrackingData] = useState({})
  const [isTrackingAll, setIsTrackingAll] = useState(false)
  const [trackingProgress, setTrackingProgress] = useState(0)
  const [trackingComplete, setTrackingComplete] = useState(false)
  const [trackingErrors, setTrackingErrors] = useState([])
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [parcelTypeFilter, setParcelTypeFilter] = useState("all")
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortColumn, setSortColumn] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [activeTab, setActiveTab] = useState("overview")
  const [showFilters, setShowFilters] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedAwbs, setSelectedAwbs] = useState([])
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Fetch initial data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsRefreshing(true)
      const [awbResponse, clientsResponse, franchisesResponse] = await Promise.all([
        fetch("/api/awb"),
        fetch("/api/clients"),
        fetch("/api/franchises"),
      ])

      if (!awbResponse.ok) throw new Error("Failed to fetch AWB data")
      if (!clientsResponse.ok) throw new Error("Failed to fetch client data")
      if (!franchisesResponse.ok) throw new Error("Failed to fetch franchise data")

      const awbData = await awbResponse.json()
      const clientsData = await clientsResponse.json()
      const franchisesData = await franchisesResponse.json()

      const awbsList = awbData.data || []
      setAwbs(awbsList)
      setClients(clientsData || [])
      setFranchises(franchisesData || [])

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
      setLoading(false)
      setIsRefreshing(false)

      // Auto-start live tracking after data loads
      if (awbsList.length > 0) {
        fetchAllLiveTracking(awbsList)
      }
    } catch (err) {
      setError("Failed to load data")
      setLoading(false)
      setIsRefreshing(false)
      console.error(err)
    }
  }

  // Fetch live tracking for all AWBs
  const fetchAllLiveTracking = async (awbsList = awbs) => {
    setIsTrackingAll(true)
    setTrackingProgress(0)
    setTrackingComplete(false)
    setTrackingErrors([])

    const trackableAwbs = awbsList.filter(awb => {
      const hasVendorIntegration = awb?.cNoteNumber && awb?.cNoteVendorName
      const forwardingNumber = awb?.forwardingNumber
      const forwardingLink = awb?.forwardingLink || ""
      const forwardingCarrier = detectCarrierFromLink(forwardingLink)
      const isDHLForwarding = forwardingNumber && forwardingLink.includes("dhl") && forwardingCarrier === "dhl"
      const isUPSForwarding = forwardingNumber && forwardingLink && !isDHLForwarding
      
      return hasVendorIntegration || isDHLForwarding || isUPSForwarding
    })

    const totalTrackable = trackableAwbs.length
    let completed = 0
    const newTrackingData = {}
    const errors = []

    // Process in batches to avoid overwhelming the server
    const batchSize = 5
    for (let i = 0; i < trackableAwbs.length; i += batchSize) {
      const batch = trackableAwbs.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (awb) => {
        try {
          const result = await fetchSingleTracking(awb)
          if (result) {
            newTrackingData[awb._id] = result
          }
        } catch (err) {
          console.error(`Error tracking ${awb.trackingNumber}:`, err)
          errors.push({ awbId: awb._id, trackingNumber: awb.trackingNumber, error: err.message })
        } finally {
          completed++
          setTrackingProgress(Math.round((completed / totalTrackable) * 100))
        }
      }))

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < trackableAwbs.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    setLiveTrackingData(newTrackingData)
    setTrackingErrors(errors)
    setIsTrackingAll(false)
    setTrackingComplete(true)
  }

  // Fetch tracking for a single AWB
  const fetchSingleTracking = async (awb) => {
    const hasVendorIntegration = awb?.cNoteNumber && awb?.cNoteVendorName
    const forwardingNumber = awb?.forwardingNumber
    const forwardingLink = awb?.forwardingLink || ""
    const forwardingCarrier = detectCarrierFromLink(forwardingLink)
    const isDHLForwarding = forwardingNumber && forwardingLink.includes("dhl") && forwardingCarrier === "dhl"
    const isUPSForwarding = forwardingNumber && forwardingLink && !isDHLForwarding

    const shouldTrack = (hasVendorIntegration || isDHLForwarding) && !isUPSForwarding
    const shouldTrackForwarding = !isDHLForwarding && isUPSForwarding && forwardingNumber

    try {
      // Try vendor tracking first
      if (shouldTrack) {
        let payload = {}

        if (isDHLForwarding) {
          payload = {
            awbNumber: forwardingNumber,
            forceSoftwareType: "dhl",
          }
        } else {
          payload = {
            awbNumber: awb?.cNoteNumber,
            vendorId: awb?.integratedVendorId,
            vendorName: awb?.cNoteVendorName,
          }
        }

        const response = await fetch("/api/vendor-integrations/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const result = await response.json()

        if (result.success && result.events && result.events.length > 0) {
          const latestEvent = result.events[0]
          const timestamp = parseEventTimestamp(latestEvent, result.softwareType)
          return {
            status: latestEvent.Status?.trim() || latestEvent.status?.trim() || "Update",
            location: latestEvent.Location?.trim() || latestEvent.location?.trim() || "",
            timestamp,
            source: "vendor",
            rawEvents: result.events,
          }
        }
      }

      // Try forwarding tracking
      if (shouldTrackForwarding) {
        const response = await fetch("/api/vendor-integrations/tracking/forwarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingNumber: forwardingNumber,
          }),
        })

        const result = await response.json()

        if (result.success && result.events && result.events.length > 0) {
          const latestEvent = result.events[0]
          const timestamp = parseParcelsAppDate(latestEvent.date, latestEvent.time)
          return {
            status: latestEvent.status?.trim() || "Update",
            location: latestEvent.location?.trim() || "",
            timestamp,
            source: "forwarding",
            rawEvents: result.events,
            estimatedDelivery: result.estimatedDelivery,
            daysInTransit: result.daysInTransit,
          }
        }
      }

      return null
    } catch (error) {
      console.error("Tracking error:", error)
      return null
    }
  }

  // Get effective status (live or database)
  const getEffectiveStatus = useCallback((awb) => {
    const liveData = liveTrackingData[awb._id]
    
    if (liveData && liveData.status) {
      return {
        status: liveData.status,
        location: liveData.location,
        timestamp: liveData.timestamp,
        isLive: true,
        normalizedStatus: normalizeStatus(liveData.status),
      }
    }

    const dbStatus = awb.parcelStatus?.[awb.parcelStatus.length - 1]
    return {
      status: dbStatus?.status || "Unknown",
      location: dbStatus?.location || "",
      timestamp: dbStatus?.timestamp ? new Date(dbStatus.timestamp).getTime() : 0,
      isLive: false,
      normalizedStatus: normalizeStatus(dbStatus?.status),
    }
  }, [liveTrackingData])

  // Helper functions
  const getClientName = useCallback((refCode) => {
    const client = clients.find((c) => c.code === refCode)
    if (client) return client.name
    const franchise = franchises.find((f) => f.code === refCode)
    if (franchise) return franchise.name
    return refCode || "Unknown"
  }, [clients, franchises])

  const getClientType = useCallback((refCode) => {
    const client = clients.find((c) => c.code === refCode)
    if (client) return "client"
    const franchise = franchises.find((f) => f.code === refCode)
    if (franchise) return "franchise"
    return null
  }, [clients, franchises])

  const calculateDimensionalWeight = (length, breadth, height) => {
    if (!length || !breadth || !height) return 0
    return (length * breadth * height) / 5000
  }

  const calculateChargeableWeight = (actualWeight, dimensionalWeight) => {
    return Math.max(actualWeight || 0, dimensionalWeight || 0)
  }

  const calculateTotalWeight = (boxes) => {
    if (!boxes || !Array.isArray(boxes)) return 0
    return boxes.reduce((total, box) => {
      const dimensionalWeight = calculateDimensionalWeight(box.length, box.breadth, box.height)
      const chargeableWeight = calculateChargeableWeight(box.actualWeight, dimensionalWeight)
      return total + chargeableWeight
    }, 0)
  }

  const calculateTotalActualWeight = (boxes) => {
    if (!boxes || !Array.isArray(boxes)) return 0
    return boxes.reduce((total, box) => total + (parseFloat(box.actualWeight) || 0), 0)
  }

  const getLatestStatus = (parcelStatus) => {
    if (!parcelStatus || !Array.isArray(parcelStatus) || parcelStatus.length === 0) return null
    return parcelStatus[parcelStatus.length - 1]
  }

  const getDeliveredDate = (parcelStatus) => {
    if (!parcelStatus || !Array.isArray(parcelStatus)) return null
    const deliveredStatus = parcelStatus.find((status) => status.status?.toLowerCase() === "delivered")
    return deliveredStatus ? deliveredStatus.timestamp : null
  }

  const getStatusConfig = (status) => {
    const key = normalizeStatus(status)
    return STATUS_CONFIG[key] || STATUS_CONFIG.default
  }

  const calculateNetProfit = (awb) => {
    if (awb.financials?.netProfit) return awb.financials.netProfit
    const salesTotal = awb.financials?.sales?.grandTotal || parseFloat(awb.rateInfo?.totalWithGST) || 0
    const purchaseTotal = awb.financials?.purchase?.grandTotal || 0
    return salesTotal - purchaseTotal
  }

  const getTotalPayments = (payments) => {
    if (!payments || !Array.isArray(payments)) return 0
    return payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
  }

  const getPaymentStatus = (awb) => {
    const total = parseFloat(awb.rateInfo?.totalWithGST) || awb.financials?.sales?.grandTotal || 0
    const paid = getTotalPayments(awb.financials?.payments)
    if (paid >= total) return { status: "paid", percentage: 100 }
    if (paid > 0) return { status: "partial", percentage: (paid / total) * 100 }
    return { status: "unpaid", percentage: 0 }
  }

  // Sorting
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
      return <ChevronUp className="h-3 w-3 text-gray-300 ml-1" />
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary ml-1" />
    )
  }

  // Filtering with live status
  const filteredAwbs = useMemo(() => {
    let filtered = [...awbs]

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter((awb) =>
        awb.trackingNumber?.toLowerCase().includes(search) ||
        awb.invoiceNumber?.toLowerCase().includes(search) ||
        awb.cNoteNumber?.toLowerCase().includes(search) ||
        awb.awbNumber?.toLowerCase().includes(search) ||
        awb.forwardingNumber?.toLowerCase().includes(search) ||
        awb.receiver?.name?.toLowerCase().includes(search) ||
        awb.receiver?.country?.toLowerCase().includes(search) ||
        awb.sender?.name?.toLowerCase().includes(search) ||
        awb.refCode?.toLowerCase().includes(search) ||
        getClientName(awb.refCode)?.toLowerCase().includes(search)
      )
    }

    if (clientFilter !== "all") {
      filtered = filtered.filter((awb) => awb.refCode === clientFilter)
    }

    // Use effective status for filtering
    if (statusFilter !== "all") {
      filtered = filtered.filter((awb) => {
        const effectiveStatus = getEffectiveStatus(awb)
        return effectiveStatus.normalizedStatus === statusFilter
      })
    }

    if (serviceFilter !== "all") {
      filtered = filtered.filter((awb) => awb.rateInfo?.courier === serviceFilter)
    }

    if (countryFilter !== "all") {
      filtered = filtered.filter((awb) => awb.receiver?.country === countryFilter)
    }

    if (parcelTypeFilter !== "all") {
      filtered = filtered.filter((awb) => awb.parcelType?.toLowerCase() === parcelTypeFilter.toLowerCase())
    }

    if (fromDate) {
      filtered = filtered.filter((awb) => new Date(awb.date) >= new Date(fromDate))
    }
    if (toDate) {
      const endDate = new Date(toDate)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((awb) => new Date(awb.date) <= endDate)
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
          aValue = a.rateInfo?.courier?.toLowerCase() || ""
          bValue = b.rateInfo?.courier?.toLowerCase() || ""
          break
        case "status":
          aValue = getEffectiveStatus(a).normalizedStatus
          bValue = getEffectiveStatus(b).normalizedStatus
          break
        case "value":
          aValue = parseFloat(a.rateInfo?.totalWithGST) || 0
          bValue = parseFloat(b.rateInfo?.totalWithGST) || 0
          break
        case "weight":
          aValue = calculateTotalWeight(a.boxes)
          bValue = calculateTotalWeight(b.boxes)
          break
        case "profit":
          aValue = calculateNetProfit(a)
          bValue = calculateNetProfit(b)
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
  }, [awbs, searchTerm, clientFilter, statusFilter, serviceFilter, countryFilter, parcelTypeFilter, fromDate, toDate, sortColumn, sortOrder, getClientName, getEffectiveStatus])

  // Pagination
  const paginatedAwbs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAwbs.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAwbs, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAwbs.length / itemsPerPage)

  // Unique values for filters
  const getUniqueValues = useCallback((key, nested = null) => {
    const values = awbs.map((awb) => {
      if (nested) {
        return awb[key]?.[nested]
      }
      return awb[key]
    }).filter(Boolean)
    return [...new Set(values)]
  }, [awbs])

  const uniqueCountries = useMemo(() => getUniqueValues("receiver", "country"), [getUniqueValues])
  const uniqueServices = useMemo(() => awbs.map(awb => awb.rateInfo?.courier).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i), [awbs])
  const uniqueParcelTypes = useMemo(() => getUniqueValues("parcelType"), [getUniqueValues])

  // Get unique statuses based on live data
  const uniqueStatuses = useMemo(() => {
    const statuses = awbs.map((awb) => getEffectiveStatus(awb).normalizedStatus)
    return [...new Set(statuses)].filter(Boolean)
  }, [awbs, getEffectiveStatus])

  // Statistics with live data
  const stats = useMemo(() => {
    const data = filteredAwbs
    
    const totalShipments = data.length
    const totalValue = data.reduce((sum, awb) => sum + (parseFloat(awb.rateInfo?.totalWithGST) || awb.financials?.sales?.grandTotal || 0), 0)
    const totalBoxes = data.reduce((sum, awb) => sum + (awb.boxes?.length || 0), 0)
    const totalWeight = data.reduce((sum, awb) => sum + calculateTotalWeight(awb.boxes), 0)
    const totalActualWeight = data.reduce((sum, awb) => sum + calculateTotalActualWeight(awb.boxes), 0)
    const uniqueCountriesCount = [...new Set(data.map((awb) => awb.receiver?.country).filter(Boolean))].length
    const uniqueClientsCount = [...new Set(data.map((awb) => awb.refCode).filter(Boolean))].length
    
    // Status counts based on live data
    const statusCounts = {}
    const liveStatusCounts = { live: 0, database: 0 }
    
    data.forEach((awb) => {
      const effectiveStatus = getEffectiveStatus(awb)
      const status = effectiveStatus.normalizedStatus || "unknown"
      statusCounts[status] = (statusCounts[status] || 0) + 1
      
      if (effectiveStatus.isLive) {
        liveStatusCounts.live++
      } else {
        liveStatusCounts.database++
      }
    })

    const totalProfit = data.reduce((sum, awb) => sum + calculateNetProfit(awb), 0)
    const totalPurchase = data.reduce((sum, awb) => sum + (awb.financials?.purchase?.grandTotal || 0), 0)
    const totalPaymentsReceived = data.reduce((sum, awb) => sum + getTotalPayments(awb.financials?.payments), 0)
    const outstandingAmount = totalValue - totalPaymentsReceived

    const avgShipmentValue = totalShipments > 0 ? totalValue / totalShipments : 0
    const avgWeight = totalShipments > 0 ? totalWeight / totalShipments : 0
    const avgProfit = totalShipments > 0 ? totalProfit / totalShipments : 0
    const profitMargin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0

    // Service distribution
    const serviceDistribution = {}
    data.forEach((awb) => {
      const service = awb.rateInfo?.courier || "Unknown"
      if (!serviceDistribution[service]) {
        serviceDistribution[service] = { count: 0, value: 0, weight: 0 }
      }
      serviceDistribution[service].count++
      serviceDistribution[service].value += parseFloat(awb.rateInfo?.totalWithGST) || 0
      serviceDistribution[service].weight += calculateTotalWeight(awb.boxes)
    })

    // Country distribution
    const countryDistribution = {}
    data.forEach((awb) => {
      const country = awb.receiver?.country || "Unknown"
      if (!countryDistribution[country]) {
        countryDistribution[country] = { count: 0, value: 0, weight: 0 }
      }
      countryDistribution[country].count++
      countryDistribution[country].value += parseFloat(awb.rateInfo?.totalWithGST) || 0
      countryDistribution[country].weight += calculateTotalWeight(awb.boxes)
    })

    // Client distribution
    const clientDistribution = {}
    data.forEach((awb) => {
      const clientName = getClientName(awb.refCode)
      if (!clientDistribution[clientName]) {
        clientDistribution[clientName] = { count: 0, value: 0, weight: 0, profit: 0 }
      }
      clientDistribution[clientName].count++
      clientDistribution[clientName].value += parseFloat(awb.rateInfo?.totalWithGST) || 0
      clientDistribution[clientName].weight += calculateTotalWeight(awb.boxes)
      clientDistribution[clientName].profit += calculateNetProfit(awb)
    })

    // Daily trend (last 30 days)
    const dailyTrend = {}
    const last30Days = subDays(new Date(), 30)
    data.forEach((awb) => {
      if (awb.date) {
        const awbDate = new Date(awb.date)
        if (awbDate >= last30Days) {
          const dateKey = format(awbDate, "yyyy-MM-dd")
          if (!dailyTrend[dateKey]) {
            dailyTrend[dateKey] = { date: dateKey, count: 0, value: 0, profit: 0 }
          }
          dailyTrend[dateKey].count++
          dailyTrend[dateKey].value += parseFloat(awb.rateInfo?.totalWithGST) || 0
          dailyTrend[dateKey].profit += calculateNetProfit(awb)
        }
      }
    })

    // Monthly trend
    const monthlyTrend = {}
    data.forEach((awb) => {
      if (awb.date) {
        const month = format(new Date(awb.date), "MMM yyyy")
        if (!monthlyTrend[month]) {
          monthlyTrend[month] = { month, count: 0, value: 0, profit: 0, weight: 0 }
        }
        monthlyTrend[month].count++
        monthlyTrend[month].value += parseFloat(awb.rateInfo?.totalWithGST) || 0
        monthlyTrend[month].profit += calculateNetProfit(awb)
        monthlyTrend[month].weight += calculateTotalWeight(awb.boxes)
      }
    })

    // Delivery performance
    const deliveryPerformance = {
      delivered: statusCounts.delivered || 0,
      inTransit: statusCounts["in transit"] || 0,
      pending: statusCounts.pending || 0,
      onHold: statusCounts["on hold"] || 0,
      cancelled: statusCounts.cancelled || 0,
      outForDelivery: statusCounts["out for delivery"] || 0,
    }

    const deliveryRate = totalShipments > 0 
      ? ((deliveryPerformance.delivered / totalShipments) * 100).toFixed(1)
      : 0

    return {
      totalShipments,
      totalValue,
      totalBoxes,
      totalWeight,
      totalActualWeight,
      uniqueCountries: uniqueCountriesCount,
      uniqueClients: uniqueClientsCount,
      statusCounts,
      liveStatusCounts,
      totalProfit,
      totalPurchase,
      totalPayments: totalPaymentsReceived,
      outstandingAmount,
      avgShipmentValue,
      avgWeight,
      avgProfit,
      profitMargin,
      serviceDistribution,
      countryDistribution,
      clientDistribution,
      dailyTrend,
      monthlyTrend,
      deliveryPerformance,
      deliveryRate,
    }
  }, [filteredAwbs, getEffectiveStatus, getClientName])

  // Chart data preparations
  const statusChartData = useMemo(() => {
    return Object.entries(stats.statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      fill: STATUS_COLORS[status] || STATUS_COLORS.unknown,
    }))
  }, [stats.statusCounts])

  const serviceChartData = useMemo(() => {
    return Object.entries(stats.serviceDistribution)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([service, data], index) => ({
        name: service,
        shipments: data.count,
        value: data.value,
        weight: data.weight,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
  }, [stats.serviceDistribution])

  const countryChartData = useMemo(() => {
    return Object.entries(stats.countryDistribution)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([country, data], index) => ({
        name: country,
        shipments: data.count,
        value: data.value,
        weight: data.weight,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
  }, [stats.countryDistribution])

  const clientChartData = useMemo(() => {
    return Object.entries(stats.clientDistribution)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 10)
      .map(([client, data], index) => ({
        name: client.length > 15 ? client.substring(0, 15) + "..." : client,
        fullName: client,
        shipments: data.count,
        value: data.value,
        profit: data.profit,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
  }, [stats.clientDistribution])

  const dailyTrendData = useMemo(() => {
    return Object.values(stats.dailyTrend)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        displayDate: format(new Date(item.date), "dd MMM"),
      }))
  }, [stats.dailyTrend])

  const monthlyTrendData = useMemo(() => {
    return Object.values(stats.monthlyTrend)
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
  }, [stats.monthlyTrend])

  // Date preset handler
  const handleDatePreset = (preset) => {
    const { from, to } = preset.getValue()
    setFromDate(from ? format(from, "yyyy-MM-dd") : null)
    setToDate(to ? format(to, "yyyy-MM-dd") : null)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setClientFilter("all")
    setStatusFilter("all")
    setServiceFilter("all")
    setCountryFilter("all")
    setParcelTypeFilter("all")
    setFromDate(null)
    setToDate(null)
    setCurrentPage(1)
  }

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedAwbs.length === paginatedAwbs.length) {
      setSelectedAwbs([])
    } else {
      setSelectedAwbs(paginatedAwbs.map((awb) => awb._id))
    }
  }

  const toggleSelectAwb = (id) => {
    if (selectedAwbs.includes(id)) {
      setSelectedAwbs(selectedAwbs.filter((awbId) => awbId !== id))
    } else {
      setSelectedAwbs([...selectedAwbs, id])
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    try {
      const csvData = []
      const currentDate = format(new Date(), "dd/MM/yyyy HH:mm")

      csvData.push(["SunEx Services Private Limited"])
      csvData.push(["AWB Management Information System (MIS) Report - LIVE DATA"])
      csvData.push([`Generated: ${currentDate}`])
      csvData.push([`Live Tracking: ${stats.liveStatusCounts.live} of ${stats.totalShipments} shipments`])
      csvData.push([])

      csvData.push(["SUMMARY"])
      csvData.push([
        `Total Shipments: ${stats.totalShipments}`,
        `Total Value: ₹${stats.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Total Weight: ${stats.totalWeight.toFixed(2)} kg`,
        `Net Profit: ₹${stats.totalProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `Delivery Rate: ${stats.deliveryRate}%`,
      ])
      csvData.push([])

      const headers = [
        "Date",
        "Client Code",
        "Client Name",
        "Tracking Number",
        "C-Note Number",
        "Forwarding Number",
        "Sender",
        "Receiver",
        "Country",
        "Service",
        "Boxes",
        "Weight (kg)",
        "Database Status",
        "Live Status",
        "Live Location",
        "Is Live Data",
        "Rate (₹)",
        "Total (₹)",
        "Net Profit (₹)",
        "Payment Status",
      ]
      csvData.push(headers)

      filteredAwbs.forEach((awb) => {
        const effectiveStatus = getEffectiveStatus(awb)
        const dbStatus = getLatestStatus(awb.parcelStatus)
        const totalWeight = calculateTotalWeight(awb.boxes)
        const netProfit = calculateNetProfit(awb)
        const paymentStatus = getPaymentStatus(awb)

        const row = [
          awb.date ? format(new Date(awb.date), "dd/MM/yyyy") : "",
          awb.refCode || "",
          getClientName(awb.refCode),
          awb.trackingNumber || "",
          awb.cNoteNumber || "",
          awb.forwardingNumber || "",
          awb.sender?.name || "",
          awb.receiver?.name || "",
          awb.receiver?.country || "",
          awb.rateInfo?.courier || "",
          awb.boxes?.length || 0,
          totalWeight.toFixed(2),
          dbStatus?.status || "",
          effectiveStatus.status || "",
          effectiveStatus.location || "",
          effectiveStatus.isLive ? "Yes" : "No",
          parseFloat(awb.rateInfo?.rate || 0).toFixed(2),
          parseFloat(awb.rateInfo?.totalWithGST || 0).toFixed(2),
          netProfit.toFixed(2),
          paymentStatus.status,
        ]
        csvData.push(row)
      })

      const csvContent = csvData
        .map((row) =>
          row.map((field) => {
            const fieldStr = String(field ?? "")
            if (fieldStr.includes(",") || fieldStr.includes('"') || fieldStr.includes("\n")) {
              return `"${fieldStr.replace(/"/g, '""')}"`
            }
            return fieldStr
          }).join(",")
        )
        .join("\r\n")

      const BOM = "\uFEFF"
      const finalContent = BOM + csvContent

      const dateRange = fromDate && toDate 
        ? `_${format(new Date(fromDate), "yyyyMMdd")}_to_${format(new Date(toDate), "yyyyMMdd")}`
        : `_${format(new Date(), "yyyyMMdd")}`

      const blob = new Blob([finalContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `SunEx_AWB_MIS_Live${dateRange}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting CSV:", error)
      setError("Failed to export CSV")
    }
  }

  // Export to PDF
  const exportToPDF = () => {
    try {
      const currentDate = format(new Date(), "dd/MM/yyyy HH:mm")

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>SunEx AWB MIS Report - Live Data</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1f2937; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; color: #1e40af; letter-spacing: 1px; }
            .report-title { font-size: 18px; color: #6b7280; margin-top: 5px; }
            .live-badge { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .stat-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
            .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; text-transform: uppercase; }
            .section-title { font-size: 16px; font-weight: 600; color: #374151; margin: 25px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
            table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 15px; }
            th { background: #1e40af; color: white; padding: 8px 4px; text-align: left; font-weight: 600; }
            td { padding: 6px 4px; border-bottom: 1px solid #e5e7eb; }
            tr:nth-child(even) { background: #f8fafc; }
            .status-live { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 8px; }
            .status-db { background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-size: 8px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 600; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; }
            @media print { body { padding: 10px; } .page-break { page-break-before: always; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">SunEx Services Private Limited</div>
            <div class="report-title">AWB Management Information System Report</div>
            <div class="live-badge">🔴 LIVE DATA - ${stats.liveStatusCounts.live} of ${stats.totalShipments} tracked in real-time</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 10px;">Generated: ${currentDate}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${stats.totalShipments.toLocaleString()}</div>
              <div class="stat-label">Total Shipments</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">₹${(stats.totalValue / 100000).toFixed(2)}L</div>
              <div class="stat-label">Total Value</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.deliveryRate}%</div>
              <div class="stat-label">Delivery Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">₹${(stats.totalProfit / 1000).toFixed(1)}K</div>
              <div class="stat-label">Net Profit</div>
            </div>
          </div>

          <div class="section-title">Live Status Distribution</div>
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px;">
            ${Object.entries(stats.statusCounts).map(([status, count]) => `
              <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid ${STATUS_COLORS[status] || '#6b7280'};">
                <div style="font-size: 20px; font-weight: bold; color: ${STATUS_COLORS[status] || '#6b7280'};">${count}</div>
                <div style="font-size: 10px; color: #64748b; text-transform: capitalize;">${status}</div>
              </div>
            `).join("")}
          </div>

          <div class="page-break"></div>
          <div class="section-title">Shipment Details (${filteredAwbs.length > 50 ? 'First 50 of ' + filteredAwbs.length : filteredAwbs.length} records)</div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Tracking</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Country</th>
                <th>Service</th>
                <th class="text-center">Wt</th>
                <th>Live Status</th>
                <th>Location</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAwbs.slice(0, 50).map((awb) => {
                const effectiveStatus = getEffectiveStatus(awb)
                const totalWeight = calculateTotalWeight(awb.boxes)
                return `
                  <tr>
                    <td>${awb.date ? format(new Date(awb.date), "dd/MM/yy") : "-"}</td>
                    <td class="font-bold">${getClientName(awb.refCode)}</td>
                    <td>${awb.trackingNumber || "-"}</td>
                    <td>${awb.sender?.name || "-"}</td>
                    <td>${awb.receiver?.name || "-"}</td>
                    <td>${awb.receiver?.country || "-"}</td>
                    <td>${awb.rateInfo?.courier || "-"}</td>
                    <td class="text-center">${totalWeight.toFixed(1)}</td>
                    <td><span class="${effectiveStatus.isLive ? 'status-live' : 'status-db'}">${effectiveStatus.status}</span></td>
                    <td>${effectiveStatus.location || "-"}</td>
                    <td class="text-right font-bold">₹${(parseFloat(awb.rateInfo?.totalWithGST) || 0).toFixed(0)}</td>
                  </tr>
                `
              }).join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>🔴 Live tracking data fetched in real-time from vendor systems</p>
            <p style="margin-top: 5px;">© ${new Date().getFullYear()} SunEx Services Private Limited</p>
          </div>
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
          }, 500)
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      setError("Failed to generate PDF")
    }
  }

  const filteredClientOptions = useMemo(() => {
    if (!clientSearchTerm) return clientOptions
    return clientOptions.filter((option) => 
      option.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      option.code.toLowerCase().includes(clientSearchTerm.toLowerCase())
    )
  }, [clientOptions, clientSearchTerm])

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Data</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              AWB Management Information System
              {isTrackingAll && (
                <Badge className="bg-blue-500 animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Tracking Live...
                </Badge>
              )}
              {trackingComplete && !isTrackingAll && (
                <Badge className="bg-green-500">
                  <Radio className="h-3 w-3 mr-1" />
                  Live Data
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time tracking and comprehensive analytics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Tracking Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border shadow-sm">
              {isTrackingAll ? (
                <>
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  <span className="text-sm font-medium">{trackingProgress}%</span>
                  <Progress value={trackingProgress} className="w-20 h-2" />
                </>
              ) : trackingComplete ? (
                <>
                  <Signal className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    {stats.liveStatusCounts.live} Live
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Offline</span>
                </>
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => fetchAllLiveTracking()}
                  disabled={isTrackingAll}
                  className="bg-white"
                >
                  <RefreshCw className={`h-4 w-4 ${isTrackingAll ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh Live Tracking</TooltipContent>
            </Tooltip>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Live Tracking Progress Banner */}
        {isTrackingAll && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Radio className="h-6 w-6 text-blue-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Fetching Live Tracking Data</h3>
                  <p className="text-sm text-blue-700">
                    Connecting to vendor systems to get real-time status updates...
                  </p>
                  <Progress value={trackingProgress} className="mt-2 h-2" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{trackingProgress}%</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/20">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-100">Total Shipments</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{stats.totalShipments.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-blue-100">
                <Box className="h-3 w-3 mr-1" />
                {stats.totalBoxes} boxes
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-100">Total Value</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">
                    ₹{(stats.totalValue / 100000).toFixed(2)}L
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-emerald-100">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Avg: ₹{stats.avgShipmentValue.toFixed(0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg shadow-green-500/20">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-100">Delivery Rate</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{stats.deliveryRate}%</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-green-100">
                <Target className="h-3 w-3 mr-1" />
                {stats.deliveryPerformance.delivered} delivered
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg shadow-amber-500/20">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-100">Net Profit</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">
                    ₹{(stats.totalProfit / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-amber-100">
                <Percent className="h-3 w-3 mr-1" />
                {stats.profitMargin.toFixed(1)}% margin
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0 shadow-lg shadow-cyan-500/20">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-cyan-100">Countries</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{stats.uniqueCountries}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Globe className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-cyan-100">
                destinations served
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0 shadow-lg shadow-violet-500/20">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-violet-100">Live Tracked</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{stats.liveStatusCounts.live}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-violet-100">
                <Signal className="h-3 w-3 mr-1" />
                real-time data
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Status Overview */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Radio className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Live Status Overview</h3>
                  <p className="text-sm text-gray-500">Real-time tracking from vendor systems</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Updated: {format(new Date(), "dd MMM yyyy, HH:mm")}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(stats.statusCounts).map(([status, count]) => {
                const config = getStatusConfig(status)
                const Icon = config.icon
                const percentage = ((count / stats.totalShipments) * 100).toFixed(1)
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status === statusFilter ? "all" : status)}
                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg transform hover:-translate-y-1 ${
                      statusFilter === status 
                        ? "border-blue-500 bg-blue-50 shadow-md" 
                        : "border-transparent bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{count}</span>
                    </div>
                    <p className="text-xs text-gray-600 capitalize font-medium">{status}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={parseFloat(percentage)} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-gray-500 font-medium">{percentage}%</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-white border shadow-sm p-1 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                <PieChart className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="shipments" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                <Package className="h-4 w-4 mr-2" />
                Shipments
              </TabsTrigger>
              <TabsTrigger value="financials" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                <Receipt className="h-4 w-4 mr-2" />
                Financials
              </TabsTrigger>
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search AWB, tracking, client, sender, receiver..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Client</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="All Clients" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Search..."
                            value={clientSearchTerm}
                            onChange={(e) => setClientSearchTerm(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <SelectItem value="all">All Clients</SelectItem>
                        {filteredClientOptions.map((option) => (
                          <SelectItem key={`${option.type}-${option.code}`} value={option.code}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1">
                                {option.type === "franchise" ? "F" : "C"}
                              </Badge>
                              {option.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Live Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {uniqueStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full`} style={{ backgroundColor: STATUS_COLORS[status] || STATUS_COLORS.unknown }} />
                              <span className="capitalize">{status}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Country</Label>
                    <Select value={countryFilter} onValueChange={setCountryFilter}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="All Countries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {uniqueCountries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Service</Label>
                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="All Services" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Services</SelectItem>
                        {uniqueServices.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 block">From Date</Label>
                    <Input
                      type="date"
                      value={fromDate || ""}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 mb-1.5 block">To Date</Label>
                    <Input
                      type="date"
                      value={toDate || ""}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                  <span className="text-xs text-gray-500 mr-2">Quick:</span>
                  {DATE_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDatePreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Shipment Trend */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-500" />
                    Daily Shipment Trend
                  </CardTitle>
                  <CardDescription>Last 30 days performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyTrendData}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="count" name="Shipments" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                        <Area yAxisId="right" type="monotone" dataKey="value" name="Value (₹)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution Pie */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-500" />
                    Live Status Distribution
                  </CardTitle>
                  <CardDescription>Current shipment status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Service Distribution */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Truck className="h-5 w-5 text-orange-500" />
                    Service Distribution
                  </CardTitle>
                  <CardDescription>Shipments by courier service</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={serviceChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} stroke="#94a3b8" />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="shipments" name="Shipments" radius={[0, 4, 4, 0]}>
                          {serviceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Country Distribution */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Globe className="h-5 w-5 text-cyan-500" />
                    Top Destinations
                  </CardTitle>
                  <CardDescription>Shipments by country</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={countryChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="shipments" name="Shipments" radius={[4, 4, 0, 0]}>
                          {countryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Summary Cards */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-green-500" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-blue-700">Total Sales</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      ₹{stats.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Avg: ₹{stats.avgShipmentValue.toFixed(0)}/shipment
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center">
                        <TrendingDown className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-red-700">Total Purchase</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900">
                      ₹{stats.totalPurchase.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Cost of services
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-green-700">Net Profit</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      ₹{stats.totalProfit.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {stats.profitMargin.toFixed(1)}% margin
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-orange-700">Outstanding</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      ₹{stats.outstandingAmount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Pending collection
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue & Profit Trend */}
              <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    Monthly Revenue & Profit Trend
                  </CardTitle>
                  <CardDescription>Revenue and profit comparison over months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="value" name="Revenue (₹)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="profit" name="Profit (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="count" name="Shipments" stroke="#f59e0b" strokeWidth={3} dot={{ fill: "#f59e0b", strokeWidth: 2 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Clients by Value */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-rose-500" />
                    Top Clients by Value
                  </CardTitle>
                  <CardDescription>Revenue contribution by client</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={clientChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} stroke="#94a3b8" />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Revenue (₹)" radius={[0, 4, 4, 0]}>
                          {clientChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Weight Distribution by Service */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Weight className="h-5 w-5 text-amber-500" />
                    Weight by Service
                  </CardTitle>
                  <CardDescription>Total weight handled per service</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={serviceChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="weight"
                          label={({ name, weight }) => `${name}: ${weight.toFixed(1)}kg`}
                          labelLine={true}
                        >
                          {serviceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* KPI Cards */}
              <Card className="border-0 shadow-lg bg-white lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-cyan-500" />
                    Key Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-bold text-gray-900">{stats.deliveryRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">Delivery Rate</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-bold text-gray-900">₹{stats.avgShipmentValue.toFixed(0)}</p>
                      <p className="text-xs text-gray-500 mt-1">Avg Shipment Value</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-bold text-gray-900">{stats.avgWeight.toFixed(1)}kg</p>
                      <p className="text-xs text-gray-500 mt-1">Avg Weight</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-bold text-gray-900">₹{stats.avgProfit.toFixed(0)}</p>
                      <p className="text-xs text-gray-500 mt-1">Avg Profit</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-bold text-gray-900">{stats.profitMargin.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">Profit Margin</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-bold text-gray-900">{stats.liveStatusCounts.live}</p>
                      <p className="text-xs text-gray-500 mt-1">Live Tracked</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-500" />
                      Shipment Details
                      {trackingComplete && (
                        <Badge className="bg-green-100 text-green-700 ml-2">
                          <Signal className="h-3 w-3 mr-1" />
                          Live Data
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Showing {paginatedAwbs.length} of {filteredAwbs.length} shipments
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-500">per page</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="w-full">
                  <div className="min-w-[1400px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selectedAwbs.length === paginatedAwbs.length && paginatedAwbs.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort("date")}
                              className="flex items-center font-semibold text-xs hover:text-blue-600"
                            >
                              Date
                              {getSortIcon("date")}
                            </button>
                          </TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort("refCode")}
                              className="flex items-center font-semibold text-xs hover:text-blue-600"
                            >
                              Client
                              {getSortIcon("refCode")}
                            </button>
                          </TableHead>
                          <TableHead className="font-semibold text-xs">AWB / Tracking</TableHead>
                          <TableHead className="font-semibold text-xs">C-Note</TableHead>
                          <TableHead className="font-semibold text-xs">Forwarding</TableHead>
                          <TableHead className="font-semibold text-xs">Sender</TableHead>
                          <TableHead className="font-semibold text-xs">Receiver</TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort("country")}
                              className="flex items-center font-semibold text-xs hover:text-blue-600"
                            >
                              Country
                              {getSortIcon("country")}
                            </button>
                          </TableHead>
                          <TableHead className="font-semibold text-xs">Service</TableHead>
                          <TableHead className="text-center font-semibold text-xs">Boxes</TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort("weight")}
                              className="flex items-center font-semibold text-xs hover:text-blue-600"
                            >
                              Weight
                              {getSortIcon("weight")}
                            </button>
                          </TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort("status")}
                              className="flex items-center font-semibold text-xs hover:text-blue-600"
                            >
                              <Activity className="h-3 w-3 mr-1 text-green-500" />
                              Live Status
                              {getSortIcon("status")}
                            </button>
                          </TableHead>
                          <TableHead className="font-semibold text-xs">Location</TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort("value")}
                              className="flex items-center font-semibold text-xs hover:text-blue-600"
                            >
                              Total
                              {getSortIcon("value")}
                            </button>
                          </TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAwbs.map((awb) => {
                          const effectiveStatus = getEffectiveStatus(awb)
                          const statusConfig = getStatusConfig(effectiveStatus.status)
                          const StatusIcon = statusConfig.icon
                          const totalWeight = calculateTotalWeight(awb.boxes)
                          const paymentStatus = getPaymentStatus(awb)

                          return (
                            <TableRow 
                              key={awb._id}
                              className={`hover:bg-blue-50/50 ${selectedAwbs.includes(awb._id) ? "bg-blue-50" : ""}`}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedAwbs.includes(awb._id)}
                                  onCheckedChange={() => toggleSelectAwb(awb._id)}
                                />
                              </TableCell>
                              <TableCell className="text-xs text-gray-600">
                                {awb.date ? format(new Date(awb.date), "dd/MM/yy") : "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] px-1.5 bg-blue-50 text-blue-700 border-blue-200">
                                    {awb.refCode || "-"}
                                  </Badge>
                                  <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
                                    {getClientName(awb.refCode)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <Link 
                                    href={`/awb/${awb.trackingNumber}`}
                                    className="text-xs font-semibold text-blue-600 hover:underline block"
                                  >
                                    {awb.trackingNumber || "-"}
                                  </Link>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <span className="text-xs text-gray-700">{awb.cNoteNumber || "-"}</span>
                                  {awb.cNoteVendorName && (
                                    <span className="text-[10px] text-gray-400 block">{awb.cNoteVendorName}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {awb.forwardingNumber ? (
                                  <Link 
                                    href={awb.forwardingLink || `/track/${awb.trackingNumber}`}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    target={awb.forwardingLink ? "_blank" : undefined}
                                  >
                                    {awb.forwardingNumber}
                                    {awb.forwardingLink && <ExternalLink className="h-3 w-3" />}
                                  </Link>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-gray-700 max-w-[80px] truncate">
                                {awb.sender?.name || "-"}
                              </TableCell>
                              <TableCell className="text-xs text-gray-700 max-w-[80px] truncate">
                                {awb.receiver?.name || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] px-1.5">
                                  {awb.receiver?.country || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="text-[10px] px-1.5 bg-gray-100 text-gray-700 hover:bg-gray-100">
                                  {awb.rateInfo?.courier || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="text-[10px] px-1.5">
                                  {awb.boxes?.length || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs font-medium text-gray-700">
                                {totalWeight.toFixed(2)} kg
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-[10px] px-2 py-0.5 ${statusConfig.color}`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {effectiveStatus.status}
                                  </Badge>
                                  {effectiveStatus.isLive && (
                                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" title="Live Data" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-gray-600 max-w-[100px] truncate">
                                {effectiveStatus.location || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-gray-900 block">
                                    ₹{(parseFloat(awb.rateInfo?.totalWithGST) || 0).toFixed(2)}
                                  </span>
                                  {paymentStatus.status !== "paid" && (
                                    <Progress 
                                      value={paymentStatus.percentage} 
                                      className="h-1 w-12"
                                    />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/awb/${awb.trackingNumber}`}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/shipping-invoice/${awb.trackingNumber}`}>
                                        <Receipt className="h-4 w-4 mr-2" />
                                        View Invoice
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/track/${awb.trackingNumber}`}>
                                        <MapPin className="h-4 w-4 mr-2" />
                                        Track Shipment
                                      </Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {paginatedAwbs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={16} className="h-32 text-center">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <Package className="h-10 w-10 mb-2 text-gray-300" />
                                <p className="font-medium">No shipments found</p>
                                <p className="text-sm">Try adjusting your filters</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-xs text-gray-500">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAwbs.length)} of {filteredAwbs.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronLeft className="h-4 w-4 -ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="icon"
                              className="h-8 w-8 text-xs"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <ChevronRight className="h-4 w-4 -ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                      <TrendingUp className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-100">Total Sales</p>
                      <p className="text-3xl font-bold">
                        ₹{(stats.totalValue / 100000).toFixed(2)}L
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                      <TrendingDown className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm text-red-100">Total Purchase</p>
                      <p className="text-3xl font-bold">
                        ₹{(stats.totalPurchase / 100000).toFixed(2)}L
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                      <DollarSign className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm text-green-100">Net Profit</p>
                      <p className="text-3xl font-bold">
                        ₹{(stats.totalProfit / 100000).toFixed(2)}L
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                      <CreditCard className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-100">Outstanding</p>
                      <p className="text-3xl font-bold">
                        ₹{(stats.outstandingAmount / 100000).toFixed(2)}L
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Details Table */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-purple-500" />
                  Financial Details
                </CardTitle>
                <CardDescription>Breakdown of sales, purchase, and profit per shipment</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="w-full">
                  <div className="min-w-[1000px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80">
                          <TableHead className="font-semibold text-xs">Date</TableHead>
                          <TableHead className="font-semibold text-xs">AWB</TableHead>
                          <TableHead className="font-semibold text-xs">Client</TableHead>
                          <TableHead className="font-semibold text-xs">Live Status</TableHead>
                          <TableHead className="text-right font-semibold text-xs">Sales</TableHead>
                          <TableHead className="text-right font-semibold text-xs">Purchase</TableHead>
                          <TableHead className="text-right font-semibold text-xs">Profit</TableHead>
                          <TableHead className="text-right font-semibold text-xs">Margin</TableHead>
                          <TableHead className="text-right font-semibold text-xs">Paid</TableHead>
                          <TableHead className="font-semibold text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAwbs.slice(0, 25).map((awb) => {
                          const effectiveStatus = getEffectiveStatus(awb)
                          const sales = parseFloat(awb.rateInfo?.totalWithGST) || awb.financials?.sales?.grandTotal || 0
                          const purchase = awb.financials?.purchase?.grandTotal || 0
                          const profit = calculateNetProfit(awb)
                          const margin = sales > 0 ? ((profit / sales) * 100) : 0
                          const paid = getTotalPayments(awb.financials?.payments)
                          const paymentStatus = getPaymentStatus(awb)

                          return (
                            <TableRow key={awb._id} className="hover:bg-gray-50">
                              <TableCell className="text-xs text-gray-600">
                                {awb.date ? format(new Date(awb.date), "dd/MM/yy") : "-"}
                              </TableCell>
                              <TableCell>
                                <Link 
                                  href={`/awb/${awb.trackingNumber}`}
                                  className="text-xs font-medium text-blue-600 hover:underline"
                                >
                                  {awb.trackingNumber || "-"}
                                </Link>
                              </TableCell>
                              <TableCell className="text-xs text-gray-700">
                                {getClientName(awb.refCode)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-[10px]">
                                    {effectiveStatus.normalizedStatus}
                                  </Badge>
                                  {effectiveStatus.isLive && (
                                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-xs font-medium text-gray-900">
                                ₹{sales.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-xs font-medium text-red-600">
                                ₹{purchase.toFixed(2)}
                              </TableCell>
                              <TableCell className={`text-right text-xs font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                ₹{profit.toFixed(2)}
                              </TableCell>
                              <TableCell className={`text-right text-xs ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {margin.toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-right text-xs font-medium text-gray-700">
                                ₹{paid.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={`text-[10px] ${
                                    paymentStatus.status === "paid" 
                                      ? "bg-green-100 text-green-700" 
                                      : paymentStatus.status === "partial"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {paymentStatus.status === "paid" ? "Paid" : paymentStatus.status === "partial" ? `${paymentStatus.percentage.toFixed(0)}%` : "Unpaid"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}

export default isAdminAuth(AllAWBsMISPage)