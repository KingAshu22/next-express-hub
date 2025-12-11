"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Eye,
  Plus,
  Upload,
  Download,
  Users,
  Globe,
  Lock,
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  ShoppingCart,
  Link as LinkIcon,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Building2,
  FileSpreadsheet,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

// Helper to get styling for status badges
const getStatusBadge = (status) => {
  switch (status) {
    case "live":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800"
        >
          <Globe className="w-3 h-3 mr-1" />
          Live
        </Badge>
      )
    case "unlisted":
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800"
        >
          <Users className="w-3 h-3 mr-1" />
          Unlisted
        </Badge>
      )
    case "hidden":
    default:
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700"
        >
          <Lock className="w-3 h-3 mr-1" />
          Hidden
        </Badge>
      )
  }
}

// Helper to get rate category badge
const getRateCategoryBadge = (category) => {
  if (category === "purchase") {
    return (
      <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
        <Package className="w-3 h-3 mr-1" />
        Purchase
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
      <ShoppingCart className="w-3 h-3 mr-1" />
      Sales
    </Badge>
  )
}

// Helper to get rate mode badge
const getRateModeBadge = (rateMode, targetCountry) => {
  if (rateMode === "single-country-zip") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="cursor-help">
            <MapPin className="w-3 h-3 mr-1" />
            ZIP
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Single Country (ZIP-based): {targetCountry || "N/A"}</p>
        </TooltipContent>
      </Tooltip>
    )
  }
  return (
    <Badge variant="outline">
      <Globe className="w-3 h-3 mr-1" />
      Multi
    </Badge>
  )
}

// Stats Card Component
function StatsCard({ title, value, icon: Icon, description, className }) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[40px]" />
        </div>
      ))}
    </div>
  )
}

// Rate Table Component
function RateTable({ rates, onDelete, purchaseRates }) {
  if (rates.length === 0) {
    return (
      <div className="text-center py-12">
        <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">No rates found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get started by uploading your first rate sheet.
        </p>
        <Link href="/rates/upload">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add First Rate
          </Button>
        </Link>
      </div>
    )
  }

  // Helper to find linked purchase rate
  const getLinkedPurchaseRate = (purchaseRateId) => {
    return purchaseRates.find((r) => r._id === purchaseRateId)
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Original Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Linked To</TableHead>
            <TableHead>Zones</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TooltipProvider>
            {rates.map((rate) => {
              const linkedRate = rate.rateCategory === "sales" ? getLinkedPurchaseRate(rate.purchaseRateId) : null
              
              return (
                <TableRow key={rate._id}>
                  {/* Vendor */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{rate.vendorName || "—"}</span>
                    </div>
                  </TableCell>
                  
                  {/* Service */}
                  <TableCell className="font-medium">{rate.service}</TableCell>
                  
                  {/* Original Name */}
                  <TableCell>
                    <span className="text-muted-foreground">{rate.originalName}</span>
                  </TableCell>
                  
                  {/* Category */}
                  <TableCell>{getRateCategoryBadge(rate.rateCategory)}</TableCell>
                  
                  {/* Rate Mode */}
                  <TableCell>{getRateModeBadge(rate.rateMode, rate.targetCountry)}</TableCell>
                  
                  {/* Status */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(rate.status)}
                      {rate.status === "unlisted" && rate.assignedTo?.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-help">
                              {rate.assignedTo.length} assigned
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{rate.assignedTo.join(", ")}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Linked To (for sales rates) */}
                  <TableCell>
                    {rate.rateCategory === "sales" && linkedRate ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            <LinkIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                              {linkedRate.service}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-medium">Linked Purchase Rate:</p>
                            <p>{linkedRate.vendorName} - {linkedRate.service}</p>
                            <p className="text-muted-foreground">{linkedRate.originalName}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : rate.rateCategory === "sales" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-amber-600 cursor-help">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-xs">Not linked</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This sales rate is not linked to a purchase rate.</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  
                  {/* Zones */}
                  <TableCell>
                    <Badge variant="outline">
                      {rate.zones?.length || 0}
                    </Badge>
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/rates/${rate._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/rates/edit/${rate._id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            <span className="font-semibold">
                              {" "}
                              {rate.service} - {rate.originalName}{" "}
                            </span>
                            rate sheet.
                            {rate.rateCategory === "purchase" && (
                              <span className="block mt-2 text-amber-600">
                                Note: This purchase rate may be linked to sales rates which will lose their reference.
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(rate._id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )
            })}
          </TooltipProvider>
        </TableBody>
      </Table>
    </div>
  )
}

export default function RatesPage() {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [rateModeFilter, setRateModeFilter] = useState("all")

  useEffect(() => {
    fetchRates()
  }, [])

  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/rates")
      if (response.ok) {
        const data = await response.json()
        setRates(data.rates || data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch rates",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching rates:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching rates.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (rateId) => {
    try {
      const response = await fetch(`/api/rates/${rateId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Rate sheet deleted successfully.",
        })
        fetchRates()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete rate sheet.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting rate:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const downloadTemplate = () => {
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "RATES SHEET (Example)\n"
    csvContent += "kg,zone1,zone2,zone3\n0.5,1092,1085,1228\n1,1315,1296,1491\n\n"
    csvContent += "ZONES SHEET (Example)\n"
    csvContent += "zone,countries,extraChargeName,extraChargeValue\n"
    csvContent += '1,"Bangladesh,Bhutan,Maldives",Fuel,20\n'
    csvContent += '2,"Hong Kong,Malaysia,Singapore",Remote Area,15\n'

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "rates_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter rates based on tab, search, and filters
  const filteredRates = rates.filter((rate) => {
    // Tab filter
    if (activeTab === "purchase" && rate.rateCategory !== "purchase") return false
    if (activeTab === "sales" && rate.rateCategory !== "sales") return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        rate.vendorName?.toLowerCase().includes(query) ||
        rate.service?.toLowerCase().includes(query) ||
        rate.originalName?.toLowerCase().includes(query) ||
        rate.type?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== "all" && rate.status !== statusFilter) return false

    // Rate mode filter
    if (rateModeFilter !== "all" && rate.rateMode !== rateModeFilter) return false

    return true
  })

  // Get purchase rates for linking display
  const purchaseRates = rates.filter((r) => r.rateCategory === "purchase")

  // Calculate stats
  const stats = {
    total: rates.length,
    purchase: rates.filter((r) => r.rateCategory === "purchase").length,
    sales: rates.filter((r) => r.rateCategory === "sales").length,
    live: rates.filter((r) => r.status === "live").length,
    unlisted: rates.filter((r) => r.status === "unlisted").length,
    hidden: rates.filter((r) => r.status === "hidden").length,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping Rates</h1>
          <p className="text-muted-foreground">
            Manage purchase and sales rates for all your shipping services.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
          <Button variant="outline" onClick={fetchRates} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/rates/upload">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload New Rate
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total Rates"
          value={stats.total}
          icon={FileSpreadsheet}
          description={`${stats.purchase} purchase, ${stats.sales} sales`}
        />
        <StatsCard
          title="Purchase Rates"
          value={stats.purchase}
          icon={Package}
          description="Internal cost rates"
          className="border-l-4 border-l-orange-500"
        />
        <StatsCard
          title="Sales Rates"
          value={stats.sales}
          icon={ShoppingCart}
          description="Client-facing rates"
          className="border-l-4 border-l-purple-500"
        />
        <StatsCard
          title="Live Rates"
          value={stats.live}
          icon={Globe}
          description={`${stats.unlisted} unlisted, ${stats.hidden} hidden`}
          className="border-l-4 border-l-green-500"
        />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle>Rate Sheets</CardTitle>
              <CardDescription>
                View and manage all your purchase and sales rate sheets.
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>

              <Select value={rateModeFilter} onValueChange={setRateModeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Rate Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="multi-country">Multi-Country</SelectItem>
                  <SelectItem value="single-country-zip">Single Country (ZIP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                All Rates
                <Badge variant="secondary" className="ml-1">
                  {rates.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="purchase" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Purchase
                <Badge variant="secondary" className="ml-1">
                  {stats.purchase}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Sales
                <Badge variant="secondary" className="ml-1">
                  {stats.sales}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {loading ? (
                <TableSkeleton />
              ) : (
                <RateTable
                  rates={filteredRates}
                  onDelete={handleDelete}
                  purchaseRates={purchaseRates}
                />
              )}
            </TabsContent>

            <TabsContent value="purchase" className="mt-4">
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-800 dark:text-orange-300">
                          Purchase Rates
                        </h4>
                        <p className="text-sm text-orange-700 dark:text-orange-400">
                          These are your internal cost rates from vendors. They are always hidden
                          and only visible to admin users. Link them to sales rates for margin
                          tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                  <RateTable
                    rates={filteredRates}
                    onDelete={handleDelete}
                    purchaseRates={purchaseRates}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="sales" className="mt-4">
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <ShoppingCart className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-800 dark:text-purple-300">
                          Sales Rates
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-400">
                          These are client-facing rates. They can be made live for all clients,
                          unlisted for specific clients/franchises, or hidden. Each sales rate
                          should be linked to a purchase rate for cost tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                  <RateTable
                    rates={filteredRates}
                    onDelete={handleDelete}
                    purchaseRates={purchaseRates}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Results summary */}
          {!loading && filteredRates.length > 0 && filteredRates.length !== rates.length && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredRates.length} of {rates.length} rates
              {(searchQuery || statusFilter !== "all" || rateModeFilter !== "all") && (
                <Button
                  variant="link"
                  className="px-2 py-0 h-auto"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                    setRateModeFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}