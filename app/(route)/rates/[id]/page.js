"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ArrowLeft,
  Edit,
  Users,
  Globe,
  Lock,
  Info,
  Package,
  ShoppingCart,
  Link as LinkIcon,
  MapPin,
  Building2,
  Calendar,
  Hash,
  FileSpreadsheet,
  DollarSign,
  Percent,
  Weight,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

// Format charge value based on type
const formatChargeValue = (charge) => {
  switch (charge.chargeType) {
    case "percentage":
      return `${charge.chargeValue}%`
    case "perKg":
      return `₹${charge.chargeValue} / kg`
    case "oneTime":
      return `₹${charge.chargeValue}`
    default:
      return charge.chargeValue
  }
}

// Get charge type icon
const getChargeTypeIcon = (chargeType) => {
  switch (chargeType) {
    case "percentage":
      return <Percent className="w-3 h-3" />
    case "perKg":
      return <Weight className="w-3 h-3" />
    case "oneTime":
      return <DollarSign className="w-3 h-3" />
    default:
      return null
  }
}

// Helper to get zone keys from rate entry (filtering out non-zone fields)
const getZoneKeys = (rates) => {
  if (!rates || rates.length === 0) return []
  
  const firstRate = rates[0]
  const excludeKeys = [
    'kg', 
    '_id', 
    'id', 
    '__v', 
    'createdAt', 
    'updatedAt',
    '$__',
    '$isNew',
    '_doc'
  ]
  
  return Object.keys(firstRate).filter((key) => {
    // Exclude known non-zone keys
    if (excludeKeys.includes(key)) return false
    
    // Exclude keys that start with $ (MongoDB internal)
    if (key.startsWith('$')) return false
    
    // Exclude keys that look like MongoDB ObjectIds (24 char hex)
    if (/^[a-f0-9]{24}$/i.test(key)) return false
    
    return true
  }).sort((a, b) => {
    // Sort numerically if both are numbers, otherwise alphabetically
    const numA = parseInt(a)
    const numB = parseInt(b)
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }
    return a.localeCompare(b)
  })
}

// Helper to get styling for status badges
const getStatusBadge = (status, size = "default") => {
  const sizeClass = size === "large" ? "text-base px-3 py-1" : ""
  
  switch (status) {
    case "live":
      return (
        <Badge
          variant="outline"
          className={`bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 ${sizeClass}`}
        >
          <Globe className={size === "large" ? "w-4 h-4 mr-2" : "w-3 h-3 mr-1"} />
          Live
        </Badge>
      )
    case "unlisted":
      return (
        <Badge
          variant="outline"
          className={`bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 ${sizeClass}`}
        >
          <Users className={size === "large" ? "w-4 h-4 mr-2" : "w-3 h-3 mr-1"} />
          Unlisted
        </Badge>
      )
    case "hidden":
    default:
      return (
        <Badge
          variant="outline"
          className={`bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700 ${sizeClass}`}
        >
          <Lock className={size === "large" ? "w-4 h-4 mr-2" : "w-3 h-3 mr-1"} />
          Hidden
        </Badge>
      )
  }
}

// Rate category badge
const getRateCategoryBadge = (category, size = "default") => {
  const sizeClass = size === "large" ? "text-base px-3 py-1" : ""
  
  if (category === "purchase") {
    return (
      <Badge
        variant="secondary"
        className={`bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800 ${sizeClass}`}
      >
        <Package className={size === "large" ? "w-4 h-4 mr-2" : "w-3 h-3 mr-1"} />
        Purchase Rate
      </Badge>
    )
  }
  return (
    <Badge
      variant="secondary"
      className={`bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800 ${sizeClass}`}
    >
      <ShoppingCart className={size === "large" ? "w-4 h-4 mr-2" : "w-3 h-3 mr-1"} />
      Sales Rate
    </Badge>
  )
}

// Rate mode badge
const getRateModeBadge = (rateMode, targetCountry) => {
  if (rateMode === "single-country-zip") {
    return (
      <Badge variant="outline">
        <MapPin className="w-3 h-3 mr-1" />
        Single Country (ZIP) - {targetCountry || "N/A"}
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <Globe className="w-3 h-3 mr-1" />
      Multi-Country
    </Badge>
  )
}

// Loading Skeleton
function DetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-9 w-9 rounded" />
        <div className="flex-1">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Info Row Component
function InfoRow({ label, value, icon: Icon, className = "" }) {
  return (
    <div className={`flex justify-between items-center py-2 ${className}`}>
      <span className="text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

// Linked Rate Card Component
function LinkedRateCard({ linkedRate }) {
  const [copied, setCopied] = useState(false)

  const copyId = () => {
    if (linkedRate?._id) {
      navigator.clipboard.writeText(linkedRate._id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!linkedRate) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">No Linked Purchase Rate</span>
        </div>
        <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
          This sales rate is not linked to a purchase rate. Cost tracking and margin
          calculations will not be available.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Linked Purchase Rate</span>
        </div>
        <Link href={`/rates/${linkedRate._id}`}>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-3 h-3 mr-1" />
            View
          </Button>
        </Link>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Vendor:</span>
          <span className="font-medium">{linkedRate.vendorName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service:</span>
          <span className="font-medium">{linkedRate.service}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Original Name:</span>
          <span className="font-medium">{linkedRate.originalName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">ID:</span>
          <div className="flex items-center gap-1">
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {linkedRate._id.slice(-8)}
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={copyId}
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Format zone header based on rate mode
const formatZoneHeader = (zoneKey, rateMode) => {
  // If it's already prefixed with "Zone", just return it
  if (zoneKey.toLowerCase().startsWith('zone')) {
    return zoneKey
  }
  
  // For multi-country mode with numeric zones, add "Zone " prefix
  if (rateMode === 'multi-country' && !isNaN(parseInt(zoneKey))) {
    return `Zone ${zoneKey}`
  }
  
  // For single-country-zip mode or named zones, return as-is
  return zoneKey
}

export default function RateDetailPage({ params }) {
  const router = useRouter()
  const { id } = use(params)
  const [rate, setRate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchRate()
    }
  }, [id])

  const fetchRate = async () => {
    try {
      const response = await fetch(`/api/rates/${id}`)
      if (response.ok) {
        const data = await response.json()
        setRate(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch rate details",
          variant: "destructive",
        })
        router.push("/rates")
      }
    } catch (error) {
      console.error("Error fetching rate:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching rate details.",
        variant: "destructive",
      })
      router.push("/rates")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DetailsSkeleton />
  }

  if (!rate) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Rate Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The rate you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/rates">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Rates
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get zone keys from rates (properly filtered)
  const zoneKeys = getZoneKeys(rate.rates)

  // Check if we have postal zones
  const hasPostalZones = rate.postalZones && rate.postalZones.length > 0

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-start gap-4">
          <Link href="/rates">
            <Button variant="outline" size="icon" className="h-9 w-9 mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">{rate.service}</h1>
              {getRateCategoryBadge(rate.rateCategory, "large")}
              {getStatusBadge(rate.status, "large")}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{rate.vendorName || "Unknown Vendor"}</span>
              <span>•</span>
              <span>{rate.originalName}</span>
            </div>
          </div>
        </div>
        <Link href={`/rates/edit/${rate._id}`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Rate
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Info Cards */}
        <div className="space-y-6">
          {/* Basic Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                label="Vendor"
                value={rate.vendorName || "—"}
                icon={Building2}
              />
              <Separator />
              <InfoRow
                label="Category"
                value={getRateCategoryBadge(rate.rateCategory)}
              />
              <Separator />
              <InfoRow label="Service" value={rate.service} />
              <Separator />
              <InfoRow label="Original Name" value={rate.originalName} />
              {rate.type && (
                <>
                  <Separator />
                  <InfoRow label="Type" value={rate.type} />
                </>
              )}
              {rate.refCode && (
                <>
                  <Separator />
                  <InfoRow label="Ref Code" value={rate.refCode} icon={Hash} />
                </>
              )}
              <Separator />
              <InfoRow
                label="Rate Mode"
                value={getRateModeBadge(rate.rateMode, rate.targetCountry)}
              />
              {rate.rateMode === "single-country-zip" && rate.targetCountry && (
                <>
                  <Separator />
                  <InfoRow
                    label="Target Country"
                    value={rate.targetCountry}
                    icon={MapPin}
                  />
                </>
              )}
              <Separator />
              <InfoRow
                label="Created"
                value={new Date(rate.createdAt).toLocaleDateString()}
                icon={Calendar}
              />
              <InfoRow
                label="Updated"
                value={new Date(rate.updatedAt).toLocaleDateString()}
                icon={Calendar}
              />
            </CardContent>
          </Card>

          {/* Charges Card */}
          {rate.charges && rate.charges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Dynamic Charges
                </CardTitle>
                <CardDescription>
                  Additional charges applied to all shipments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rate.charges.map((charge, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {getChargeTypeIcon(charge.chargeType)}
                        <span className="font-medium">{charge.chargeName}</span>
                      </div>
                      <Badge variant="secondary">
                        {formatChargeValue(charge)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Purchase Rate (for sales rates) */}
          {rate.rateCategory === "sales" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Purchase Rate Link
                </CardTitle>
                <CardDescription>
                  The cost rate linked to this sales rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LinkedRateCard linkedRate={rate.linkedPurchaseRate} />
              </CardContent>
            </Card>
          )}

          {/* Assignments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Visibility & Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(rate.status)}
                </div>

                {rate.rateCategory === "purchase" ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Purchase rates are always hidden and only visible to admin
                      users for internal cost tracking.
                    </p>
                  </div>
                ) : rate.status === "unlisted" ? (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Assigned To:</p>
                      {rate.assignedTo && rate.assignedTo.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {rate.assignedTo.map((client) => (
                            <Badge key={client} variant="secondary">
                              {client}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Not assigned to any clients yet.
                        </p>
                      )}
                    </div>
                  </>
                ) : rate.status === "live" ? (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      This rate is live and visible to all clients.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      This rate is hidden and not visible to any clients.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Rate Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rate Sheet Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Rate Sheet
              </CardTitle>
              <CardDescription>
                {rate.rates?.length || 0} weight entries × {zoneKeys.length} zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rate.rates && rate.rates.length > 0 && zoneKeys.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10">
                          Weight (kg)
                        </TableHead>
                        {zoneKeys.map((zone) => (
                          <TableHead key={zone} className="text-center min-w-[80px]">
                            {formatZoneHeader(zone, rate.rateMode)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rate.rates.slice(0, 50).map((rateEntry, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium sticky left-0 bg-background z-10">
                            {rateEntry.kg}
                          </TableCell>
                          {zoneKeys.map((zone) => (
                            <TableCell key={zone} className="text-center">
                              {rateEntry[zone] !== undefined && rateEntry[zone] !== null ? (
                                `₹${rateEntry[zone]}`
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No rate data available.
                </div>
              )}
              {rate.rates && rate.rates.length > 50 && (
                <p className="text-sm text-muted-foreground mt-3">
                  Showing first 50 of {rate.rates.length} weight entries.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Zones Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Zone Configuration
              </CardTitle>
              <CardDescription>
                {rate.rateMode === "single-country-zip"
                  ? "ZIP/Postal code based zones"
                  : "Country-based zone mapping"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={hasPostalZones ? "postal" : "country"}>
                <TabsList className="mb-4">
                  <TabsTrigger value="country" disabled={!rate.zones?.length}>
                    <Globe className="w-4 h-4 mr-2" />
                    Country Zones ({rate.zones?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="postal" disabled={!hasPostalZones}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Postal Zones ({rate.postalZones?.length || 0})
                  </TabsTrigger>
                </TabsList>

                {/* Country Zones Tab */}
                <TabsContent value="country">
                  {rate.zones && rate.zones.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Zone</TableHead>
                            <TableHead>Countries</TableHead>
                            <TableHead className="w-[200px]">Extra Charges</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rate.zones.map((zone, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Badge variant="outline">Zone {zone.zone}</Badge>
                              </TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="max-w-md truncate cursor-help">
                                        {zone.countries?.slice(0, 5).join(", ")}
                                        {zone.countries?.length > 5 && (
                                          <span className="text-muted-foreground">
                                            {" "}+{zone.countries.length - 5} more
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">
                                      <p>{zone.countries?.join(", ")}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                {zone.extraCharges &&
                                Object.keys(zone.extraCharges).length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(zone.extraCharges).map(
                                      ([key, value]) => (
                                        <Badge
                                          key={key}
                                          variant="secondary"
                                          className="font-normal"
                                        >
                                          {key}: ₹{value}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    None
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No country zone data available.
                    </div>
                  )}
                </TabsContent>

                {/* Postal Zones Tab */}
                <TabsContent value="postal">
                  {hasPostalZones ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Country</TableHead>
                            <TableHead>Zone</TableHead>
                            <TableHead>ZIP Code / Range</TableHead>
                            <TableHead>Extra Charges</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rate.postalZones.slice(0, 50).map((pz, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {pz.country}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{pz.zone}</Badge>
                              </TableCell>
                              <TableCell>
                                {pz.zipCode ? (
                                  <code className="text-sm bg-muted px-2 py-0.5 rounded">
                                    {pz.zipCode}
                                  </code>
                                ) : (
                                  <span className="text-sm">
                                    <code className="bg-muted px-2 py-0.5 rounded">
                                      {pz.zipFrom}
                                    </code>
                                    <span className="mx-2 text-muted-foreground">
                                      to
                                    </span>
                                    <code className="bg-muted px-2 py-0.5 rounded">
                                      {pz.zipTo}
                                    </code>
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {pz.extraCharges &&
                                Object.keys(pz.extraCharges).length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(pz.extraCharges).map(
                                      ([key, value]) => (
                                        <Badge
                                          key={key}
                                          variant="secondary"
                                          className="font-normal text-xs"
                                        >
                                          {key}: ₹{value}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No postal zone data available.
                    </div>
                  )}
                  {rate.postalZones && rate.postalZones.length > 50 && (
                    <p className="text-sm text-muted-foreground mt-3">
                      Showing first 50 of {rate.postalZones.length} postal zone
                      entries.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{rate.rates?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Weight Entries</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{zoneKeys.length}</p>
                  <p className="text-sm text-muted-foreground">Rate Zones</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{rate.zones?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Country Zones</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {rate.postalZones?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Postal Zones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}