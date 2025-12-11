"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Download,
  X,
  Plus,
  Edit,
  Globe,
  Package,
  LinkIcon,
  AlertCircle,
  Info,
  RefreshCw,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

function TagInput({ value, onChange, placeholder = "Enter a value and press Enter" }) {
  const [inputValue, setInputValue] = useState("")

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    }
  }

  const addTag = () => {
    const newTag = inputValue.trim()
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag])
    }
    setInputValue("")
  }

  const removeTag = (tagToRemove) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <Button type="button" variant="secondary" onClick={addTag}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

function PurchaseRateSelector({ vendorName, selectedRateId, onSelect, purchaseRates }) {
  const filteredRates = vendorName
    ? purchaseRates.filter((rate) => rate.vendorName?.toLowerCase() === vendorName.toLowerCase())
    : purchaseRates

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-muted-foreground" />
        <Label className="text-base font-semibold">Link to Purchase Rate *</Label>
      </div>

      {vendorName && filteredRates.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No purchase rates found for vendor "{vendorName}". Please create a purchase rate first or check the vendor
            name.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Select value={selectedRateId} onValueChange={onSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a purchase rate to link" />
            </SelectTrigger>
            <SelectContent>
              {filteredRates.map((rate) => (
                <SelectItem key={rate._id} value={rate._id}>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>
                      {rate.vendorName} - {rate.service}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {rate.originalName}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedRateId && (
            <div className="bg-muted/50 rounded-lg p-3 border">
              <p className="text-sm font-medium mb-1">Linked Purchase Rate:</p>
              {(() => {
                const selectedRate = purchaseRates.find((r) => r._id === selectedRateId)
                if (!selectedRate) return null
                return (
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>Vendor:</strong> {selectedRate.vendorName}
                    </p>
                    <p>
                      <strong>Service:</strong> {selectedRate.service}
                    </p>
                    <p>
                      <strong>Original Name:</strong> {selectedRate.originalName}
                    </p>
                    <p>
                      <strong>Rate Mode:</strong> {selectedRate.rateMode}
                    </p>
                    {selectedRate.targetCountry && (
                      <p>
                        <strong>Target Country:</strong> {selectedRate.targetCountry}
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Sales rates must be linked to a purchase rate for cost tracking and margin calculation.
      </p>
    </div>
  )
}

export default function EditRatePage() {
  const router = useRouter()
  const params = useParams()
  const rateId = params.id

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [rateMode, setRateMode] = useState("")
  const [purchaseRates, setPurchaseRates] = useState([])

  // Common rate data
  const [rateData, setRateData] = useState({
    vendorName: "",
    rateCategory: "purchase",
    purchaseRateId: "",
    type: "",
    service: "",
    originalName: "",
    charges: [],
    status: "hidden",
    assignedTo: [],
    rateType: "base",
    targetCountry: "",
  })

  // Multi-country state
  const [multiCountryData, setMultiCountryData] = useState({
    rates: [],
    zones: [],
    postalZones: [],
  })

  // Single-country state
  const [singleCountryData, setSingleCountryData] = useState({
    targetCountry: "",
    rates: [],
    zones: [],
    postalZones: [],
  })

  // Manual entry state
  const [manualData, setManualData] = useState({
    rates: [],
    zones: [],
  })

  // File upload states
  const [ratesFile, setRatesFile] = useState(null)
  const [zonesFile, setZonesFile] = useState(null)
  const [ratesValidation, setRatesValidation] = useState(null)
  const [zonesValidation, setZonesValidation] = useState(null)
  const [zipZonesValidation, setZipZonesValidation] = useState(null)

  useEffect(() => {
    const fetchRateData = async () => {
      try {
        const response = await fetch(`/api/rates/${rateId}`)
        if (response.ok) {
          const data = await response.json()
          setRateData({
            vendorName: data.vendorName,
            rateCategory: data.rateCategory || "purchase",
            purchaseRateId: data.purchaseRateId || "",
            type: data.type,
            service: data.service,
            originalName: data.originalName,
            charges: data.charges || [],
            status: data.status || "hidden",
            assignedTo: data.assignedTo || [],
            rateType: data.rateType || "base",
            targetCountry: data.targetCountry || "",
          })

          setRateMode(data.rateMode || "multi-country")

          // Populate data based on rate mode
          if (data.rateMode === "multi-country") {
            setMultiCountryData({
              rates: data.rates || [],
              zones: data.zones || [],
              postalZones: data.postalZones || [],
            })
          } else if (data.rateMode === "single-country-zip") {
            setSingleCountryData({
              targetCountry: data.targetCountry || "",
              rates: data.rates || [],
              zones: data.zones || [],
              postalZones: data.postalZones || [],
            })
          } else if (data.rateMode === "manual") {
            setManualData({
              rates: data.rates || [],
              zones: data.zones || [],
            })
          }

          // Fetch purchase rates if sales rate
          if (data.rateCategory === "sales") {
            await fetchPurchaseRates()
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to load rate data",
            variant: "destructive",
          })
          router.push("/rates")
        }
      } catch (error) {
        console.error("Error fetching rate:", error)
        toast({
          title: "Error",
          description: "Failed to load rate data",
          variant: "destructive",
        })
        router.push("/rates")
      } finally {
        setLoading(false)
      }
    }

    if (rateId) {
      fetchRateData()
    }
  }, [rateId, router])

  const fetchPurchaseRates = async () => {
    try {
      const response = await fetch("/api/rates?rateCategory=purchase")
      if (response.ok) {
        const data = await response.json()
        setPurchaseRates(data.rates || [])
      }
    } catch (error) {
      console.error("Error fetching purchase rates:", error)
    }
  }

  const downloadMultiCountryRatesTemplate = () => {
    const wb = XLSX.utils.book_new()
    const wsData = [
      ["kg", "Zone1", "Zone2", "Zone3"],
      [0.5, 25, 30, 35],
      [1, 45, 55, 65],
      [1.5, 63, 78, 93],
      [2, 80, 100, 120],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Rates")
    XLSX.writeFile(wb, "multi_country_rates_template.xlsx")
  }

  const downloadMultiCountryZonesTemplate = () => {
    const wb = XLSX.utils.book_new()
    const wsData = [
      ["Zone", "Countries", "Charge Name", "Charge Value"],
      ["Zone1", "USA,Canada,Mexico", "Fuel Surcharge", 5],
      ["Zone2", "UK,France,Germany", "Remote Area", 10],
      ["Zone3", "Australia,New Zealand", "", ""],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Zones")
    XLSX.writeFile(wb, "multi_country_zones_template.xlsx")
  }

  const downloadCurrentMultiCountryData = () => {
    if (multiCountryData.rates.length === 0) {
      toast({
        title: "Error",
        description: "No rate data to download",
        variant: "destructive",
      })
      return
    }

    const wb = XLSX.utils.book_new()

    // Rates sheet
    const ratesData = [["kg", ...multiCountryData.zones.map((z) => z.zone)]]
    multiCountryData.rates.forEach((rate) => {
      const row = [rate.kg, ...multiCountryData.zones.map((z) => rate[z.zone] || 0)]
      ratesData.push(row)
    })
    const wsRates = XLSX.utils.aoa_to_sheet(ratesData)
    XLSX.utils.book_append_sheet(wb, wsRates, "Rates")

    // Zones sheet
    const zonesData = [["Zone", "Countries", "Charge Name", "Charge Value"]]
    multiCountryData.zones.forEach((zone) => {
      const charges = zone.extraCharges || {}
      if (Object.keys(charges).length === 0) {
        zonesData.push([zone.zone, zone.countries?.join(",") || "", "", ""])
      } else {
        Object.entries(charges).forEach((entry, idx) => {
          if (idx === 0) {
            zonesData.push([zone.zone, zone.countries?.join(",") || "", entry[0], entry[1]])
          } else {
            zonesData.push(["", "", entry[0], entry[1]])
          }
        })
      }
    })
    const wsZones = XLSX.utils.aoa_to_sheet(zonesData)
    XLSX.utils.book_append_sheet(wb, wsZones, "Zones")

    // Postal Zones sheet (if exists)
    if (multiCountryData.postalZones && multiCountryData.postalZones.length > 0) {
      const postalData = [["Country", "Zone", "Zip From", "Zip To", "Charge Name", "Charge Value"]]
      multiCountryData.postalZones.forEach((pz) => {
        const charges = pz.extraCharges || {}
        if (Object.keys(charges).length === 0) {
          postalData.push([pz.country || "", pz.zone || "", pz.zipFrom || "", pz.zipTo || "", "", ""])
        } else {
          Object.entries(charges).forEach((entry, idx) => {
            if (idx === 0) {
              postalData.push([pz.country || "", pz.zone || "", pz.zipFrom || "", pz.zipTo || "", entry[0], entry[1]])
            } else {
              postalData.push(["", "", "", "", entry[0], entry[1]])
            }
          })
        }
      })
      const wsPostal = XLSX.utils.aoa_to_sheet(postalData)
      XLSX.utils.book_append_sheet(wb, wsPostal, "Postal Zones")
    }

    XLSX.writeFile(wb, `${rateData.originalName}_multi_country_data.xlsx`)
  }

  const downloadCurrentSingleCountryData = () => {
    if (singleCountryData.rates.length === 0) {
      toast({
        title: "Error",
        description: "No rate data to download",
        variant: "destructive",
      })
      return
    }

    const wb = XLSX.utils.book_new()

    // Rates sheet
    const ratesData = [["kg", ...singleCountryData.zones.map((z) => z.zone)]]
    singleCountryData.rates.forEach((rate) => {
      const row = [rate.kg, ...singleCountryData.zones.map((z) => rate[z.zone] || 0)]
      ratesData.push(row)
    })
    const wsRates = XLSX.utils.aoa_to_sheet(ratesData)
    XLSX.utils.book_append_sheet(wb, wsRates, "Rates")

    // Zip Zones sheet
    const zipData = [["Zone", "Type", "Value", "Charge Name", "Charge Value"]]
    const zoneMap = {}
    singleCountryData.postalZones.forEach((pz) => {
      if (!zoneMap[pz.zone]) zoneMap[pz.zone] = []
      zoneMap[pz.zone].push(pz)
    })

    Object.entries(zoneMap).forEach(([zone, entries]) => {
      entries.forEach((pz, idx) => {
        const charges = pz.extraCharges || {}
        const value = pz.zipCode || `${pz.zipFrom}-${pz.zipTo}`
        const type = pz.zipCode ? "individual" : "range"

        if (Object.keys(charges).length === 0) {
          if (idx === 0) {
            zipData.push([zone, type, value, "", ""])
          } else {
            zipData.push(["", type, value, "", ""])
          }
        } else {
          Object.entries(charges).forEach((entry, chargeIdx) => {
            if (idx === 0 && chargeIdx === 0) {
              zipData.push([zone, type, value, entry[0], entry[1]])
            } else {
              zipData.push(["", type, value, entry[0], entry[1]])
            }
          })
        }
      })
    })

    const wsZip = XLSX.utils.aoa_to_sheet(zipData)
    XLSX.utils.book_append_sheet(wb, wsZip, "Zip Zones")

    XLSX.writeFile(wb, `${rateData.originalName}_single_country_data.xlsx`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!rateData.vendorName || !rateData.service || !rateData.originalName) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)

    const payload = {
      vendorName: rateData.vendorName,
      rateCategory: rateData.rateCategory,
      purchaseRateId: rateData.rateCategory === "sales" ? rateData.purchaseRateId : null,
      type: rateData.type,
      service: rateData.service,
      originalName: rateData.originalName,
      charges: rateData.charges,
      status: rateData.rateCategory === "purchase" ? "hidden" : rateData.status,
      assignedTo: rateData.status === "unlisted" ? rateData.assignedTo : [],
      rateMode: rateMode,
    }

    if (rateMode === "multi-country") {
      payload.rates = multiCountryData.rates
      payload.zones = multiCountryData.zones
      payload.postalZones = multiCountryData.postalZones
    } else if (rateMode === "single-country-zip") {
      payload.targetCountry = singleCountryData.targetCountry
      payload.rates = singleCountryData.rates
      payload.zones = singleCountryData.zones
      payload.postalZones = singleCountryData.postalZones
    } else if (rateMode === "manual") {
      payload.rates = manualData.rates
      payload.zones = manualData.zones
    }

    try {
      const response = await fetch(`/api/rates/${rateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Rate updated successfully",
        })
        router.push("/rates")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to update rate",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating rate:", error)
      toast({
        title: "Error",
        description: "Failed to update rate",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading rate data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/rates">
          <Button type="button" variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Rate</h1>
          <p className="text-muted-foreground">
            Mode:{" "}
            <Badge>
              {rateMode === "multi-country"
                ? "Multi-Country"
                : rateMode === "single-country-zip"
                  ? "Single Country"
                  : "Manual"}
            </Badge>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name *</Label>
                <Input
                  id="vendorName"
                  value={rateData.vendorName}
                  onChange={(e) => setRateData({ ...rateData, vendorName: e.target.value })}
                  placeholder="e.g., FedEx, DHL"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Input
                  id="service"
                  value={rateData.service}
                  onChange={(e) => setRateData({ ...rateData, service: e.target.value })}
                  placeholder="e.g., Express, Standard"
                  disabled
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalName">Original Name *</Label>
              <Input
                id="originalName"
                value={rateData.originalName}
                onChange={(e) => setRateData({ ...rateData, originalName: e.target.value })}
                placeholder="e.g., FedEx Express USA"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={rateData.type}
                onChange={(e) => setRateData({ ...rateData, type: e.target.value })}
                placeholder="e.g., Courier, Parcel"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rate Mode Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Rate Configuration
            </CardTitle>
            <CardDescription>
              Current rate mode:{" "}
              {rateMode === "multi-country"
                ? "Multi-Country"
                : rateMode === "single-country-zip"
                  ? "Single Country (ZIP)"
                  : "Manual"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rateMode === "multi-country" && (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This is a multi-country rate. You can download the current data, update it, and upload it again.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={downloadMultiCountryRatesTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Rates Template
                  </Button>
                  <Button type="button" variant="outline" onClick={downloadMultiCountryZonesTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Zones Template
                  </Button>
                  <Button type="button" variant="outline" onClick={downloadCurrentMultiCountryData}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Current Data
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Current Zones ({multiCountryData.zones.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {multiCountryData.zones.map((zone, idx) => (
                      <Badge key={idx}>{zone.zone}</Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Current Rates ({multiCountryData.rates.length})</h4>
                  <p className="text-sm text-muted-foreground">
                    {multiCountryData.rates.length > 0
                      ? `Rates range from ${multiCountryData.rates[0].kg}kg to ${multiCountryData.rates[multiCountryData.rates.length - 1].kg}kg`
                      : "No rates configured"}
                  </p>
                </div>
              </div>
            )}

            {rateMode === "single-country-zip" && (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This is a single-country rate for {singleCountryData.targetCountry}. Download and update the data as
                    needed.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={downloadCurrentSingleCountryData}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Current Data
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Country: {singleCountryData.targetCountry}</h4>
                  <p className="text-sm text-muted-foreground">
                    {singleCountryData.zones.length} zones configured with {singleCountryData.rates.length} rate entries
                  </p>
                </div>
              </div>
            )}

            {rateMode === "manual" && (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This is a manually configured rate. Rates are shown below for reference.
                  </AlertDescription>
                </Alert>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Manual Rate Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    {manualData.rates.length} weight entries with {manualData.zones.length} zones
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/rates">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updating}>
            {updating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Updating...
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Update Rate
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
