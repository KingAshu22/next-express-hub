// rates/upload/page.js
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Upload,
  Download,
  Check,
  X,
  Calculator,
  Plus,
  FileUp,
  Edit,
  Globe,
  MapPin,
  Trash2,
  Copy,
  ShoppingCart,
  Package,
  Link as LinkIcon,
  AlertCircle,
  Info,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import DynamicChargesManager from "@/app/_components/DynamicChargesManager"
import ManualRateForm from "@/app/_components/ManualRateForm"

// Reusable TagInput component
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

// Purchase Rate Selector Component
function PurchaseRateSelector({ vendorName, selectedRateId, onSelect, purchaseRates }) {
  const filteredRates = vendorName 
    ? purchaseRates.filter(rate => 
        rate.vendorName?.toLowerCase() === vendorName.toLowerCase()
      )
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
            No purchase rates found for vendor "{vendorName}". 
            Please create a purchase rate first or check the vendor name.
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
                    <span>{rate.vendorName} - {rate.service}</span>
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
                const selectedRate = purchaseRates.find(r => r._id === selectedRateId)
                if (!selectedRate) return null
                return (
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Vendor:</strong> {selectedRate.vendorName}</p>
                    <p><strong>Service:</strong> {selectedRate.service}</p>
                    <p><strong>Original Name:</strong> {selectedRate.originalName}</p>
                    <p><strong>Rate Mode:</strong> {selectedRate.rateMode}</p>
                    {selectedRate.targetCountry && (
                      <p><strong>Target Country:</strong> {selectedRate.targetCountry}</p>
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

// Manual Single Country Rate Form Component
function ManualSingleCountryForm({ onDataGenerated }) {
  const [targetCountry, setTargetCountry] = useState("")
  const [zones, setZones] = useState([
    {
      zoneName: "Zone1",
      zipType: "individual",
      zipCodes: [],
      zipRanges: [],
      extraCharges: {},
    },
  ])
  const [rates, setRates] = useState([{ kg: 0.5 }])
  const [rateType, setRateType] = useState("base")

  const addZone = () => {
    const newZoneNumber = zones.length + 1
    setZones([
      ...zones,
      {
        zoneName: `Zone${newZoneNumber}`,
        zipType: "individual",
        zipCodes: [],
        zipRanges: [],
        extraCharges: {},
      },
    ])
    setRates(rates.map((rate) => ({ ...rate, [`Zone${newZoneNumber}`]: 0 })))
  }

  const removeZone = (index) => {
    if (zones.length <= 1) return
    const zoneToRemove = zones[index].zoneName
    setZones(zones.filter((_, i) => i !== index))
    setRates(
      rates.map((rate) => {
        const newRate = { ...rate }
        delete newRate[zoneToRemove]
        return newRate
      })
    )
  }

  const updateZone = (index, field, value) => {
    const newZones = [...zones]
    newZones[index][field] = value
    setZones(newZones)
  }

  const addZipRange = (zoneIndex) => {
    const newZones = [...zones]
    newZones[zoneIndex].zipRanges.push({ from: "", to: "" })
    setZones(newZones)
  }

  const updateZipRange = (zoneIndex, rangeIndex, field, value) => {
    const newZones = [...zones]
    newZones[zoneIndex].zipRanges[rangeIndex][field] = value
    setZones(newZones)
  }

  const removeZipRange = (zoneIndex, rangeIndex) => {
    const newZones = [...zones]
    newZones[zoneIndex].zipRanges.splice(rangeIndex, 1)
    setZones(newZones)
  }

  const addExtraCharge = (zoneIndex) => {
    const chargeName = prompt("Enter charge name:")
    if (chargeName) {
      const chargeValue = parseFloat(prompt("Enter charge value:") || "0")
      const newZones = [...zones]
      newZones[zoneIndex].extraCharges[chargeName] = chargeValue
      setZones(newZones)
    }
  }

  const removeExtraCharge = (zoneIndex, chargeName) => {
    const newZones = [...zones]
    delete newZones[zoneIndex].extraCharges[chargeName]
    setZones(newZones)
  }

  const addRate = () => {
    const lastKg = rates.length > 0 ? rates[rates.length - 1].kg : 0
    const newRate = { kg: lastKg + 0.5 }
    zones.forEach((zone) => {
      newRate[zone.zoneName] = 0
    })
    setRates([...rates, newRate])
  }

  const removeRate = (index) => {
    if (rates.length <= 1) return
    setRates(rates.filter((_, i) => i !== index))
  }

  const updateRate = (index, field, value) => {
    const newRates = [...rates]
    newRates[index][field] = parseFloat(value) || 0
    setRates(newRates)
  }

  const generateBulkRates = () => {
    const startKg = parseFloat(prompt("Start weight (kg):", "0.5") || "0.5")
    const endKg = parseFloat(prompt("End weight (kg):", "30") || "30")
    const increment = parseFloat(prompt("Increment (kg):", "0.5") || "0.5")

    if (startKg >= endKg || increment <= 0) {
      toast({ title: "Invalid range", variant: "destructive" })
      return
    }

    const newRates = []
    for (let kg = startKg; kg <= endKg; kg += increment) {
      const rate = { kg: parseFloat(kg.toFixed(2)) }
      zones.forEach((zone) => {
        rate[zone.zoneName] = 0
      })
      newRates.push(rate)
    }
    setRates(newRates)
  }

  const handleGenerate = () => {
    if (!targetCountry) {
      toast({ title: "Error", description: "Please enter the target country.", variant: "destructive" })
      return
    }

    for (const zone of zones) {
      if (zone.zipCodes.length === 0 && zone.zipRanges.length === 0) {
        toast({
          title: "Error",
          description: `Zone "${zone.zoneName}" has no ZIP codes defined.`,
          variant: "destructive",
        })
        return
      }
    }

    const processedRates = rates.map((rate) => {
      const processed = { kg: rate.kg }
      zones.forEach((zone) => {
        let rateValue = rate[zone.zoneName] || 0
        if (rateType === "perKg") {
          rateValue = rateValue * rate.kg
        }
        processed[zone.zoneName] = parseFloat(rateValue.toFixed(2))
      })
      return processed
    })

    const postalZones = []
    zones.forEach((zone) => {
      zone.zipCodes.forEach((zip) => {
        postalZones.push({
          country: targetCountry,
          zone: zone.zoneName,
          zipCode: zip,
          zipFrom: null,
          zipTo: null,
          extraCharges: zone.extraCharges,
        })
      })

      zone.zipRanges.forEach((range) => {
        if (range.from && range.to) {
          postalZones.push({
            country: targetCountry,
            zone: zone.zoneName,
            zipCode: null,
            zipFrom: range.from,
            zipTo: range.to,
            extraCharges: zone.extraCharges,
          })
        }
      })
    })

    onDataGenerated({
      targetCountry,
      rates: processedRates,
      postalZones,
      zones: zones.map((z) => ({
        zone: z.zoneName,
        countries: [targetCountry],
        extraCharges: z.extraCharges,
      })),
    })

    toast({ title: "Success", description: "Rate data generated successfully!" })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="manualTargetCountry">Target Country *</Label>
        <Input
          id="manualTargetCountry"
          value={targetCountry}
          onChange={(e) => setTargetCountry(e.target.value)}
          placeholder="e.g., Australia"
        />
      </div>

      <div className="border rounded-lg p-4">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Rate Input Type
        </Label>
        <RadioGroup value={rateType} onValueChange={setRateType} className="mt-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="base" id="manual-base" />
            <Label htmlFor="manual-base" className="font-normal">
              Base Rate (Final amounts for each weight)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="perKg" id="manual-perKg" />
            <Label htmlFor="manual-perKg" className="font-normal">
              Rate per Kg (Will be multiplied by weight)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Zones & ZIP Codes</Label>
          <Button type="button" variant="outline" size="sm" onClick={addZone}>
            <Plus className="w-4 h-4 mr-2" />
            Add Zone
          </Button>
        </div>

        <div className="space-y-4">
          {zones.map((zone, zoneIndex) => (
            <Card key={zoneIndex}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      value={zone.zoneName}
                      onChange={(e) => updateZone(zoneIndex, "zoneName", e.target.value)}
                      className="w-32 h-8"
                    />
                    <Select
                      value={zone.zipType}
                      onValueChange={(value) => updateZone(zoneIndex, "zipType", value)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual ZIPs</SelectItem>
                        <SelectItem value="range">ZIP Ranges</SelectItem>
                        <SelectItem value="mixed">Mixed (Both)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {zones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeZone(zoneIndex)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-3 space-y-4">
                {(zone.zipType === "individual" || zone.zipType === "mixed") && (
                  <div className="space-y-2">
                    <Label className="text-sm">Individual ZIP Codes</Label>
                    <TagInput
                      value={zone.zipCodes}
                      onChange={(newCodes) => updateZone(zoneIndex, "zipCodes", newCodes)}
                      placeholder="Enter ZIP code and press Enter"
                    />
                    <p className="text-xs text-muted-foreground">
                      You can also paste multiple codes separated by commas
                    </p>
                  </div>
                )}

                {(zone.zipType === "range" || zone.zipType === "mixed") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">ZIP Code Ranges</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addZipRange(zoneIndex)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Range
                      </Button>
                    </div>
                    {zone.zipRanges.map((range, rangeIndex) => (
                      <div key={rangeIndex} className="flex items-center gap-2">
                        <Input
                          value={range.from}
                          onChange={(e) =>
                            updateZipRange(zoneIndex, rangeIndex, "from", e.target.value)
                          }
                          placeholder="From"
                          className="w-24"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          value={range.to}
                          onChange={(e) =>
                            updateZipRange(zoneIndex, rangeIndex, "to", e.target.value)
                          }
                          placeholder="To"
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeZipRange(zoneIndex, rangeIndex)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Zone Extra Charges</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addExtraCharge(zoneIndex)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Charge
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(zone.extraCharges).map(([name, value]) => (
                      <Badge key={name} variant="outline">
                        {name}: {value}
                        <button
                          type="button"
                          className="ml-1"
                          onClick={() => removeExtraCharge(zoneIndex, name)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Rates Table {rateType === "perKg" && "(Per Kg Values)"}
          </Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={generateBulkRates}>
              Generate Bulk
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addRate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Weight (kg)</TableHead>
                {zones.map((zone) => (
                  <TableHead key={zone.zoneName} className="w-24">
                    {zone.zoneName}
                  </TableHead>
                ))}
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate, rateIndex) => (
                <TableRow key={rateIndex}>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={rate.kg}
                      onChange={(e) => updateRate(rateIndex, "kg", e.target.value)}
                      className="w-20 h-8"
                    />
                  </TableCell>
                  {zones.map((zone) => (
                    <TableCell key={zone.zoneName}>
                      <Input
                        type="number"
                        step="0.01"
                        value={rate[zone.zoneName] || 0}
                        onChange={(e) => updateRate(rateIndex, zone.zoneName, e.target.value)}
                        className="w-24 h-8"
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRate(rateIndex)}
                      disabled={rates.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Button type="button" onClick={handleGenerate} className="w-full">
        <Check className="w-4 h-4 mr-2" />
        Generate Rate Data
      </Button>
    </div>
  )
}

export default function UploadRatePage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [entryMethod, setEntryMethod] = useState("file")
  const [singleCountryMethod, setSingleCountryMethod] = useState("file")
  const [zoneUploadMode, setZoneUploadMode] = useState("countries")
  
  // Purchase rates for linking (when creating sales rates)
  const [purchaseRates, setPurchaseRates] = useState([])
  const [loadingPurchaseRates, setLoadingPurchaseRates] = useState(false)

  // Common state for the rate sheet
  const [rateData, setRateData] = useState({
    vendorName: "",
    rateCategory: "purchase", // 'purchase' or 'sales'
    purchaseRateId: "", // For sales rates - linked purchase rate
    type: "",
    service: "",
    originalName: "",
    charges: [],
    status: "hidden",
    assignedTo: [],
    rateType: "base",
    rateMode: "multi-country",
    targetCountry: "",
  })

  // State for File Upload method (Multi-country)
  const [ratesFile, setRatesFile] = useState(null)
  const [zonesFile, setZonesFile] = useState(null)
  const [zipZonesFile, setZipZonesFile] = useState(null)
  const [ratesValidation, setRatesValidation] = useState(null)
  const [zonesValidation, setZonesValidation] = useState(null)
  const [zipZonesValidation, setZipZonesValidation] = useState(null)

  // State for Single Country ZIP mode (File)
  const [singleCountryRatesFile, setSingleCountryRatesFile] = useState(null)
  const [singleCountryZipZonesFile, setSingleCountryZipZonesFile] = useState(null)
  const [singleCountryRatesValidation, setSingleCountryRatesValidation] = useState(null)
  const [singleCountryZipZonesValidation, setSingleCountryZipZonesValidation] = useState(null)

  // State for Single Country ZIP mode (Manual)
  const [singleCountryManualData, setSingleCountryManualData] = useState(null)

  // State for Manual Entry method (Multi-country)
  const [manualData, setManualData] = useState({ rates: [], zones: [] })

  // Fetch purchase rates when rate category is 'sales'
  useEffect(() => {
    if (rateData.rateCategory === "sales") {
      fetchPurchaseRates()
    }
  }, [rateData.rateCategory])

  const fetchPurchaseRates = async () => {
    setLoadingPurchaseRates(true)
    try {
      const response = await fetch("/api/rates?rateCategory=purchase")
      if (response.ok) {
        const data = await response.json()
        setPurchaseRates(data.rates || data)
      }
    } catch (error) {
      console.error("Error fetching purchase rates:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase rates.",
        variant: "destructive",
      })
    } finally {
      setLoadingPurchaseRates(false)
    }
  }

  // Handle rate category change
  const handleRateCategoryChange = (value) => {
    setRateData({
      ...rateData,
      rateCategory: value,
      // Reset status for purchase rates (always hidden)
      status: value === "purchase" ? "hidden" : rateData.status,
      // Reset purchase rate link when switching to purchase
      purchaseRateId: value === "purchase" ? "" : rateData.purchaseRateId,
      // Clear assignedTo for purchase rates
      assignedTo: value === "purchase" ? [] : rateData.assignedTo,
    })
  }

  const handleRatesFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setRatesFile(selectedFile)
      processRatesFile(selectedFile, rateData.rateType)
    }
  }

  const handleZonesFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setZonesFile(selectedFile)
      processZonesFile(selectedFile)
    }
  }

  const handleZipZonesFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setZipZonesFile(selectedFile)
      processZipZonesFile(selectedFile)
    }
  }

  const handleSingleCountryRatesFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setSingleCountryRatesFile(selectedFile)
      processSingleCountryRatesFile(selectedFile, rateData.rateType)
    }
  }

  const handleSingleCountryZipZonesFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setSingleCountryZipZonesFile(selectedFile)
      processSingleCountryZipZonesFile(selectedFile)
    }
  }

  const handleRateTypeChange = (value) => {
    setRateData({ ...rateData, rateType: value })
    if (ratesFile) {
      processRatesFile(ratesFile, value)
    }
    if (singleCountryRatesFile) {
      processSingleCountryRatesFile(singleCountryRatesFile, value)
    }
  }

  const processRatesFile = async (file, rateType = "base") => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      const ratesSection = []
      const accepted = []
      const rejected = []

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length === 0) continue

        const kg = Number.parseFloat(row[0])
        if (isNaN(kg) || kg <= 0) {
          rejected.push({ row: i + 1, data: row, reason: "Invalid or missing weight" })
          continue
        }

        const rateEntry = { kg }
        let hasValidRates = false

        for (let j = 1; j < row.length; j++) {
          let rate = Number.parseFloat(row[j])
          if (!isNaN(rate) && rate > 0) {
            if (rateType === "perKg") {
              rate = rate * kg
            }
            rateEntry[j.toString()] = Number(rate.toFixed(2))
            hasValidRates = true
          }
        }

        if (hasValidRates) {
          ratesSection.push(rateEntry)
          accepted.push({ row: i + 1, kg, zones: Object.keys(rateEntry).length - 1 })
        } else {
          rejected.push({ row: i + 1, data: row, reason: "No valid zone rates found" })
        }
      }

      setRatesValidation({
        rates: ratesSection,
        accepted,
        rejected,
        headers: jsonData[0] || [],
        rateType,
      })
    } catch (error) {
      console.error("Error processing rates file:", error)
      toast({ title: "Error", description: "Failed to process the rates file.", variant: "destructive" })
    }
  }

  const processZonesFile = async (file) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      const zonesSection = []
      const accepted = []
      const rejected = []

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length === 0) continue

        const zone = row[0]?.toString()
        const countriesStr = row[1]?.toString()

        if (!zone || !countriesStr) {
          rejected.push({ row: i + 1, data: row, reason: "Missing zone or countries" })
          continue
        }

        const countries = countriesStr
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
        if (countries.length === 0) {
          rejected.push({ row: i + 1, data: row, reason: "No valid countries found" })
          continue
        }

        const zoneEntry = { zone, countries, extraCharges: {} }

        for (let j = 2; j < row.length; j += 2) {
          const chargeName = row[j]?.toString()
          const chargeValue = Number.parseFloat(row[j + 1])
          if (chargeName && !isNaN(chargeValue)) {
            zoneEntry.extraCharges[chargeName] = chargeValue
          }
        }

        zonesSection.push(zoneEntry)
        accepted.push({
          row: i + 1,
          zone,
          countries: countries.length,
          charges: Object.keys(zoneEntry.extraCharges).length,
        })
      }

      setZonesValidation({ zones: zonesSection, accepted, rejected, headers: jsonData[0] || [] })
    } catch (error) {
      console.error("Error processing zones file:", error)
      toast({ title: "Error", description: "Failed to process the zones file.", variant: "destructive" })
    }
  }

  const processZipZonesFile = async (file) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      const postalZonesSection = []
      const accepted = []
      const rejected = []

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length === 0) continue

        const country = row[0]?.toString().trim()
        const zone = row[1]?.toString().trim()
        const zipFrom = row[2]?.toString().trim()
        const zipTo = row[3]?.toString().trim()

        if (!country || !zone || !zipFrom || !zipTo) {
          rejected.push({
            row: i + 1,
            data: row,
            reason: "Missing country, zone, or zip range",
          })
          continue
        }

        const postalZoneEntry = {
          country,
          zone,
          zipCode: null,
          zipFrom,
          zipTo,
          extraCharges: {},
        }

        for (let j = 4; j < row.length; j += 2) {
          const chargeName = row[j]?.toString()
          const chargeValue = Number.parseFloat(row[j + 1])
          if (chargeName && !isNaN(chargeValue)) {
            postalZoneEntry.extraCharges[chargeName] = chargeValue
          }
        }

        postalZonesSection.push(postalZoneEntry)
        accepted.push({
          row: i + 1,
          country,
          zone,
          zipFrom,
          zipTo,
          charges: Object.keys(postalZoneEntry.extraCharges).length,
        })
      }

      setZipZonesValidation({
        postalZones: postalZonesSection,
        accepted,
        rejected,
        headers: jsonData[0] || [],
      })
    } catch (error) {
      console.error("Error processing ZIP zones file:", error)
      toast({
        title: "Error",
        description: "Failed to process the ZIP zones file.",
        variant: "destructive",
      })
    }
  }

  const processSingleCountryRatesFile = async (file, rateType = "base") => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      const ratesSection = []
      const accepted = []
      const rejected = []
      const headers = jsonData[0] || []
      const zoneHeaders = headers.slice(1).map((h) => h?.toString().trim())

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length === 0) continue

        const kg = Number.parseFloat(row[0])
        if (isNaN(kg) || kg <= 0) {
          rejected.push({ row: i + 1, data: row, reason: "Invalid or missing weight" })
          continue
        }

        const rateEntry = { kg }
        let hasValidRates = false

        for (let j = 1; j < row.length; j++) {
          let rate = Number.parseFloat(row[j])
          if (!isNaN(rate) && rate > 0) {
            if (rateType === "perKg") {
              rate = rate * kg
            }
            const zoneKey = zoneHeaders[j - 1] || j.toString()
            rateEntry[zoneKey] = Number(rate.toFixed(2))
            hasValidRates = true
          }
        }

        if (hasValidRates) {
          ratesSection.push(rateEntry)
          accepted.push({ row: i + 1, kg, zones: Object.keys(rateEntry).length - 1 })
        } else {
          rejected.push({ row: i + 1, data: row, reason: "No valid zone rates found" })
        }
      }

      setSingleCountryRatesValidation({
        rates: ratesSection,
        accepted,
        rejected,
        headers,
        zoneHeaders,
        rateType,
      })
    } catch (error) {
      console.error("Error processing single country rates file:", error)
      toast({
        title: "Error",
        description: "Failed to process the rates file.",
        variant: "destructive",
      })
    }
  }

  const processSingleCountryZipZonesFile = async (file) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      const zipZonesSection = []
      const accepted = []
      const rejected = []
      const headers = jsonData[0] || []

      const headerLower = headers.map((h) => h?.toString().toLowerCase().trim())
      const hasZipFrom = headerLower.includes("zip from") || headerLower.includes("zipfrom")
      const hasZipTo = headerLower.includes("zip to") || headerLower.includes("zipto")
      const hasZipCodes =
        headerLower.includes("zip codes") ||
        headerLower.includes("zipcodes") ||
        headerLower.includes("zip code")
      const hasType = headerLower.includes("type")

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length === 0) continue

        const zone = row[0]?.toString().trim()
        if (!zone) {
          rejected.push({ row: i + 1, data: row, reason: "Missing zone" })
          continue
        }

        let zipZoneEntries = []

        if (hasType) {
          const type = row[1]?.toString().toLowerCase().trim()

          if (type === "range") {
            const zipFrom = row[2]?.toString().trim()
            const zipTo = row[3]?.toString().trim()
            if (zipFrom && zipTo) {
              const entry = { zone, zipCode: null, zipFrom, zipTo, extraCharges: {} }
              for (let j = 4; j < row.length; j += 2) {
                const chargeName = row[j]?.toString()
                const chargeValue = Number.parseFloat(row[j + 1])
                if (chargeName && !isNaN(chargeValue)) {
                  entry.extraCharges[chargeName] = chargeValue
                }
              }
              zipZoneEntries.push(entry)
            }
          } else if (type === "individual" || type === "list") {
            const zipCodesStr = row[2]?.toString().trim()
            if (zipCodesStr) {
              const zipCodes = zipCodesStr
                .split(",")
                .map((z) => z.trim())
                .filter(Boolean)
              const extraCharges = {}
              for (let j = 3; j < row.length; j += 2) {
                const chargeName = row[j]?.toString()
                const chargeValue = Number.parseFloat(row[j + 1])
                if (chargeName && !isNaN(chargeValue)) {
                  extraCharges[chargeName] = chargeValue
                }
              }

              zipCodes.forEach((zipCode) => {
                zipZoneEntries.push({
                  zone,
                  zipCode,
                  zipFrom: null,
                  zipTo: null,
                  extraCharges: { ...extraCharges },
                })
              })
            }
          }
        } else if (hasZipFrom && hasZipTo) {
          const zipFrom = row[1]?.toString().trim()
          const zipTo = row[2]?.toString().trim()
          if (zipFrom && zipTo) {
            const entry = { zone, zipCode: null, zipFrom, zipTo, extraCharges: {} }
            for (let j = 3; j < row.length; j += 2) {
              const chargeName = row[j]?.toString()
              const chargeValue = Number.parseFloat(row[j + 1])
              if (chargeName && !isNaN(chargeValue)) {
                entry.extraCharges[chargeName] = chargeValue
              }
            }
            zipZoneEntries.push(entry)
          }
        } else if (hasZipCodes) {
          const zipCodesStr = row[1]?.toString().trim()
          if (zipCodesStr) {
            const zipCodes = zipCodesStr
              .split(",")
              .map((z) => z.trim())
              .filter(Boolean)
            const extraCharges = {}
            for (let j = 2; j < row.length; j += 2) {
              const chargeName = row[j]?.toString()
              const chargeValue = Number.parseFloat(row[j + 1])
              if (chargeName && !isNaN(chargeValue)) {
                extraCharges[chargeName] = chargeValue
              }
            }
            zipCodes.forEach((zipCode) => {
              zipZoneEntries.push({
                zone,
                zipCode,
                zipFrom: null,
                zipTo: null,
                extraCharges: { ...extraCharges },
              })
            })
          }
        } else {
          const val1 = row[1]?.toString().trim()
          const val2 = row[2]?.toString().trim()

          if (val1 && val2 && !val1.includes(",") && !val2.includes(",")) {
            const entry = { zone, zipCode: null, zipFrom: val1, zipTo: val2, extraCharges: {} }
            for (let j = 3; j < row.length; j += 2) {
              const chargeName = row[j]?.toString()
              const chargeValue = Number.parseFloat(row[j + 1])
              if (chargeName && !isNaN(chargeValue)) {
                entry.extraCharges[chargeName] = chargeValue
              }
            }
            zipZoneEntries.push(entry)
          } else if (val1) {
            const zipCodes = val1
              .split(",")
              .map((z) => z.trim())
              .filter(Boolean)
            const extraCharges = {}
            for (let j = 2; j < row.length; j += 2) {
              const chargeName = row[j]?.toString()
              const chargeValue = Number.parseFloat(row[j + 1])
              if (chargeName && !isNaN(chargeValue)) {
                extraCharges[chargeName] = chargeValue
              }
            }
            zipCodes.forEach((zipCode) => {
              zipZoneEntries.push({
                zone,
                zipCode,
                zipFrom: null,
                zipTo: null,
                extraCharges: { ...extraCharges },
              })
            })
          }
        }

        if (zipZoneEntries.length > 0) {
          zipZonesSection.push(...zipZoneEntries)
          zipZoneEntries.forEach((entry) => {
            accepted.push({
              row: i + 1,
              zone: entry.zone,
              zipCode: entry.zipCode,
              zipFrom: entry.zipFrom,
              zipTo: entry.zipTo,
              charges: Object.keys(entry.extraCharges).length,
            })
          })
        } else {
          rejected.push({ row: i + 1, data: row, reason: "Could not parse ZIP data" })
        }
      }

      setSingleCountryZipZonesValidation({
        zipZones: zipZonesSection,
        accepted,
        rejected,
        headers,
      })
    } catch (error) {
      console.error("Error processing single country ZIP zones file:", error)
      toast({
        title: "Error",
        description: "Failed to process the ZIP zones file.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!rateData.vendorName || !rateData.service || !rateData.originalName) {
      toast({
        title: "Error",
        description: "Please fill all required fields (Vendor Name, Service, Original Name).",
        variant: "destructive",
      })
      return
    }

    // Validate sales rate has a linked purchase rate
    if (rateData.rateCategory === "sales" && !rateData.purchaseRateId) {
      toast({
        title: "Error",
        description: "Sales rates must be linked to a purchase rate.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    let payloadRates
    let payloadZones
    let payloadPostalZones
    let rateMode = "multi-country"
    let targetCountry = ""

    if (entryMethod === "file") {
      if (!ratesValidation) {
        toast({
          title: "Error",
          description: "Please upload and validate the rates file.",
          variant: "destructive",
        })
        setUploading(false)
        return
      }

      if (!zonesValidation && !zipZonesValidation) {
        toast({
          title: "Error",
          description: "Please upload and validate either a zones file or a ZIP zones file.",
          variant: "destructive",
        })
        setUploading(false)
        return
      }

      payloadRates = ratesValidation.rates
      payloadZones = zonesValidation ? zonesValidation.zones : []
      payloadPostalZones = zipZonesValidation ? zipZonesValidation.postalZones : []
    } else if (entryMethod === "singleCountryZip") {
      rateMode = "single-country-zip"

      if (singleCountryMethod === "file") {
        if (!rateData.targetCountry) {
          toast({
            title: "Error",
            description: "Please enter the target country name.",
            variant: "destructive",
          })
          setUploading(false)
          return
        }

        if (!singleCountryRatesValidation) {
          toast({
            title: "Error",
            description: "Please upload and validate the rates file.",
            variant: "destructive",
          })
          setUploading(false)
          return
        }

        if (!singleCountryZipZonesValidation) {
          toast({
            title: "Error",
            description: "Please upload and validate the ZIP zones file.",
            variant: "destructive",
          })
          setUploading(false)
          return
        }

        targetCountry = rateData.targetCountry
        payloadRates = singleCountryRatesValidation.rates

        payloadPostalZones = singleCountryZipZonesValidation.zipZones.map((zz) => ({
          ...zz,
          country: targetCountry,
        }))

        const uniqueZones = [...new Set(payloadPostalZones.map((pz) => pz.zone))]
        payloadZones = uniqueZones.map((zoneName) => ({
          zone: zoneName,
          countries: [targetCountry],
          extraCharges: {},
        }))
      } else {
        if (!singleCountryManualData) {
          toast({
            title: "Error",
            description: "Please generate rate data using the manual form.",
            variant: "destructive",
          })
          setUploading(false)
          return
        }

        targetCountry = singleCountryManualData.targetCountry
        payloadRates = singleCountryManualData.rates
        payloadPostalZones = singleCountryManualData.postalZones
        payloadZones = singleCountryManualData.zones
      }
    } else {
      if (manualData.rates.length === 0 || manualData.zones.length === 0) {
        toast({
          title: "Error",
          description: "Please generate a rate table using the manual form before submitting.",
          variant: "destructive",
        })
        setUploading(false)
        return
      }

      payloadRates = manualData.rates.map((rate) => {
        const baseRate = { kg: rate.kg }
        Object.keys(rate)
          .filter((key) => key !== "kg")
          .forEach((zoneKey) => {
            baseRate[zoneKey] = parseFloat((rate[zoneKey] * rate.kg).toFixed(2))
          })
        return baseRate
      })
      payloadZones = manualData.zones
      payloadPostalZones = []
    }

    try {
      const payload = {
        vendorName: rateData.vendorName,
        rateCategory: rateData.rateCategory,
        purchaseRateId: rateData.rateCategory === "sales" ? rateData.purchaseRateId : null,
        type: rateData.type,
        service: rateData.service,
        originalName: rateData.originalName,
        charges: rateData.charges,
        // For purchase rates, status is always hidden
        status: rateData.rateCategory === "purchase" ? "hidden" : rateData.status,
        assignedTo: rateData.status === "unlisted" ? rateData.assignedTo : [],
        rates: payloadRates,
        zones: payloadZones,
        rateMode,
        targetCountry,
      }

      if (payloadPostalZones && payloadPostalZones.length > 0) {
        payload.postalZones = payloadPostalZones
      }

      const response = await fetch("/api/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({ 
          title: "Success", 
          description: `${rateData.rateCategory === "purchase" ? "Purchase" : "Sales"} rate uploaded successfully.` 
        })
        router.push("/rates")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to upload rate.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading rate:", error)
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const downloadRatesTemplate = () => {
    const isPerKg = rateData.rateType === "perKg"
    const wb = XLSX.utils.book_new()
    const wsData = isPerKg
      ? [
          ["kg", "1", "2"],
          [0.5, 2184, 2170],
          [1, 1315, 1296],
        ]
      : [
          ["kg", "1", "2"],
          [0.5, 1092, 1085],
          [1, 1315, 1296],
        ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Rates")
    XLSX.writeFile(wb, `rates_template_${isPerKg ? "per_kg" : "base"}.xlsx`)
  }

  const downloadZonesTemplate = () => {
    const wb = XLSX.utils.book_new()
    const wsData = [
      ["Zone", "Countries", "Charge Name", "Charge Value"],
      ["1", "Bangladesh,Bhutan,Maldives", "Fuel Surcharge", 20],
      ["2", "Hong Kong,Malaysia,Singapore", "Remote Area", 15],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Zones")
    XLSX.writeFile(wb, "zones_template.xlsx")
  }

  const downloadZipZonesTemplate = () => {
    const wb = XLSX.utils.book_new()
    const wsData = [
      ["Country", "Zone", "Zip From", "Zip To", "Charge Name", "Charge Value"],
      ["Australia", "1", "0000", "0999", "Fuel Surcharge", 10],
      ["Australia", "2", "1000", "1999", "Remote Area", 15],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "ZipZones")
    XLSX.writeFile(wb, "zip_zones_template.xlsx")
  }

  const downloadSingleCountryRatesTemplate = () => {
    const isPerKg = rateData.rateType === "perKg"
    const wb = XLSX.utils.book_new()
    const wsData = isPerKg
      ? [
          ["kg", "Zone1", "Zone2", "Zone3"],
          [0.5, 50, 60, 70],
          [1, 45, 55, 65],
          [1.5, 42, 52, 62],
          [2, 40, 50, 60],
        ]
      : [
          ["kg", "Zone1", "Zone2", "Zone3"],
          [0.5, 25, 30, 35],
          [1, 45, 55, 65],
          [1.5, 63, 78, 93],
          [2, 80, 100, 120],
        ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Rates")
    XLSX.writeFile(wb, `single_country_rates_template_${isPerKg ? "per_kg" : "base"}.xlsx`)
  }

  const downloadSingleCountryZipZonesTemplate = (format = "range") => {
    const wb = XLSX.utils.book_new()

    if (format === "range") {
      const wsData = [
        ["Zone", "Zip From", "Zip To", "Charge Name", "Charge Value"],
        ["Zone1", "0200", "0299", "Remote Area", 10],
        ["Zone1", "1000", "1999", "", ""],
        ["Zone2", "2600", "2699", "", ""],
        ["Zone3", "4000", "4999", "", ""],
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, "ZipZones")
      XLSX.writeFile(wb, "single_country_zip_zones_range_template.xlsx")
    } else if (format === "individual") {
      const wsData = [
        ["Zone", "Zip Codes", "Charge Name", "Charge Value"],
        ["Zone1", "2000,2001,2002,2003,2004,2005", "Remote Area", 10],
        ["Zone2", "3000,3001,3002,3003", "Fuel Surcharge", 5],
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, "ZipZones")
      XLSX.writeFile(wb, "single_country_zip_zones_individual_template.xlsx")
    } else if (format === "mixed") {
      const wsData = [
        ["Zone", "Type", "Value1", "Value2", "Charge Name", "Charge Value"],
        ["Zone1", "range", "0200", "0299", "Remote Area", 10],
        ["Zone1", "individual", "2000,2001,2005,2010", "", "", ""],
        ["Zone2", "range", "3000", "3999", "Fuel Surcharge", 5],
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, "ZipZones")
      XLSX.writeFile(wb, "single_country_zip_zones_mixed_template.xlsx")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/rates">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Upload New Rate</h1>
          <p className="text-muted-foreground">Define rate details, visibility, and data entry method.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        {/* RATE CATEGORY SELECTION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Rate Category
            </CardTitle>
            <CardDescription>
              Choose whether this is a purchase rate (internal/cost) or a sales rate (for clients).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  rateData.rateCategory === "purchase"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
                onClick={() => handleRateCategoryChange("purchase")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${
                    rateData.rateCategory === "purchase" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Purchase Rate</h3>
                    <p className="text-sm text-muted-foreground">Internal cost rates</p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-12">
                  <li>• Only visible to admin/internal users</li>
                  <li>• Used for cost tracking & margin calculation</li>
                  <li>• Always hidden from clients</li>
                </ul>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  rateData.rateCategory === "sales"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
                onClick={() => handleRateCategoryChange("sales")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${
                    rateData.rateCategory === "sales" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sales Rate</h3>
                    <p className="text-sm text-muted-foreground">Client-facing rates</p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-12">
                  <li>• Can be made live for all clients</li>
                  <li>• Can be unlisted for specific clients/franchises</li>
                  <li>• Must be linked to a purchase rate</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RATE CONFIGURATION */}
        <Card>
          <CardHeader>
            <CardTitle>1. Rate Configuration</CardTitle>
            <CardDescription>
              Enter general information and set visibility status.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-4">
                {/* Vendor Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="vendorName">Vendor Name *</Label>
                  <Input
                    id="vendorName"
                    value={rateData.vendorName}
                    onChange={(e) => setRateData({ ...rateData, vendorName: e.target.value })}
                    placeholder="e.g., DHL, FedEx, Aramex"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The shipping carrier or vendor providing this rate.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="service">Service *</Label>
                  <Input
                    id="service"
                    value={rateData.service}
                    onChange={(e) => setRateData({ ...rateData, service: e.target.value })}
                    placeholder="e.g., SUNEX-D, Express, Economy"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="originalName">Original Name *</Label>
                  <Input
                    id="originalName"
                    value={rateData.originalName}
                    onChange={(e) => setRateData({ ...rateData, originalName: e.target.value })}
                    placeholder="e.g., DHL Express Worldwide"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type">Type/Category (Optional)</Label>
                  <Input
                    id="type"
                    value={rateData.type}
                    onChange={(e) => setRateData({ ...rateData, type: e.target.value })}
                    placeholder="e.g., express, economy, standard"
                  />
                </div>

                <div>
                  <DynamicChargesManager
                    value={rateData.charges}
                    onChange={(newCharges) => setRateData({ ...rateData, charges: newCharges })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Sales Rate: Link to Purchase Rate */}
                {rateData.rateCategory === "sales" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <PurchaseRateSelector
                      vendorName={rateData.vendorName}
                      selectedRateId={rateData.purchaseRateId}
                      onSelect={(value) => setRateData({ ...rateData, purchaseRateId: value })}
                      purchaseRates={purchaseRates}
                    />
                    {loadingPurchaseRates && (
                      <p className="text-sm text-muted-foreground">Loading purchase rates...</p>
                    )}
                  </div>
                )}

                {/* Status - Only for Sales Rates */}
                {rateData.rateCategory === "sales" ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="status">Visibility Status</Label>
                      <Select
                        value={rateData.status}
                        onValueChange={(value) => setRateData({ ...rateData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hidden">Hidden - Not visible to anyone</SelectItem>
                          <SelectItem value="unlisted">Unlisted - Visible only to assigned clients</SelectItem>
                          <SelectItem value="live">Live - Visible to everyone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {rateData.status === "unlisted" && (
                      <div className="space-y-1.5">
                        <Label>Assigned Clients / Franchises</Label>
                        <TagInput
                          value={rateData.assignedTo}
                          onChange={(newTags) => setRateData({ ...rateData, assignedTo: newTags })}
                          placeholder="Enter client code and press Enter"
                        />
                        <p className="text-sm text-muted-foreground pt-1">
                          Only these clients/franchises will be able to see this rate.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Purchase rates are always hidden and only visible to admin users.
                      They are used for internal cost tracking and margin calculations.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RATE & ZONE DATA */}
        <Card>
          <CardHeader>
            <CardTitle>2. Rate &amp; Zone Data</CardTitle>
            <CardDescription>Choose your data entry method based on your rate structure.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={entryMethod} onValueChange={setEntryMethod}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="file">
                  <Globe className="mr-2 h-4 w-4" />
                  Multi-Country
                </TabsTrigger>
                <TabsTrigger value="singleCountryZip">
                  <MapPin className="mr-2 h-4 w-4" />
                  Single Country (ZIP)
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <Edit className="mr-2 h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>

              {/* MULTI-COUNTRY FILE UPLOAD METHOD */}
              <TabsContent value="file" className="pt-6 space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Multi-Country Mode:</strong> Use this for rates that cover multiple countries, where each
                    country belongs to a zone.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> Rate Calculation Method
                  </Label>
                  <RadioGroup value={rateData.rateType} onValueChange={handleRateTypeChange} className="mt-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="base" id="base" />
                      <Label htmlFor="base" className="font-normal">
                        Base Rate (Final amounts)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="perKg" id="perKg" />
                      <Label htmlFor="perKg" className="font-normal">
                        Rate per Kg
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="ratesFile">Rates File {rateData.rateType === "perKg" && "(per kg)"}</Label>
                    <div className="flex gap-2">
                      <Input id="ratesFile" type="file" accept=".xlsx,.xls" onChange={handleRatesFileChange} />
                      <Button type="button" variant="outline" onClick={downloadRatesTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Template
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Zones Definition</Label>
                    <Tabs value={zoneUploadMode} onValueChange={setZoneUploadMode} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="countries">By Country</TabsTrigger>
                        <TabsTrigger value="zip">By Zip Code</TabsTrigger>
                      </TabsList>

                      <TabsContent value="countries" className="pt-3">
                        <Label htmlFor="zonesFile">Zones File (Countries)</Label>
                        <div className="flex gap-2">
                          <Input id="zonesFile" type="file" accept=".xlsx,.xls" onChange={handleZonesFileChange} />
                          <Button type="button" variant="outline" onClick={downloadZonesTemplate}>
                            <Download className="w-4 h-4 mr-2" />
                            Template
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="zip" className="pt-3">
                        <Label htmlFor="zipZonesFile">ZIP Zones File</Label>
                        <div className="flex gap-2">
                          <Input
                            id="zipZonesFile"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleZipZonesFileChange}
                          />
                          <Button type="button" variant="outline" onClick={downloadZipZonesTemplate}>
                            <Download className="w-4 h-4 mr-2" />
                            Template
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </TabsContent>

              {/* SINGLE COUNTRY ZIP MODE */}
              <TabsContent value="singleCountryZip" className="pt-6 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Single Country ZIP Mode:</strong> Use this for rates specific to one country where zones are
                    defined by ZIP/postal codes.
                  </p>
                </div>

                <Tabs value={singleCountryMethod} onValueChange={setSingleCountryMethod}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">
                      <FileUp className="mr-2 h-4 w-4" />
                      Upload Files
                    </TabsTrigger>
                    <TabsTrigger value="manual">
                      <Edit className="mr-2 h-4 w-4" />
                      Enter Manually
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="file" className="pt-4 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label htmlFor="targetCountry">Target Country *</Label>
                        <Input
                          id="targetCountry"
                          value={rateData.targetCountry}
                          onChange={(e) => setRateData({ ...rateData, targetCountry: e.target.value })}
                          placeholder="e.g., Australia"
                        />
                      </div>

                      <div className="border rounded-lg p-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Calculator className="w-4 h-4" /> Rate Calculation Method
                        </Label>
                        <RadioGroup value={rateData.rateType} onValueChange={handleRateTypeChange} className="mt-3">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="base" id="base-single" />
                            <Label htmlFor="base-single" className="font-normal">
                              Base Rate
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="perKg" id="perKg-single" />
                            <Label htmlFor="perKg-single" className="font-normal">
                              Rate per Kg
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="singleCountryRatesFile">Rates File</Label>
                        <div className="flex gap-2">
                          <Input
                            id="singleCountryRatesFile"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleSingleCountryRatesFileChange}
                          />
                          <Button type="button" variant="outline" onClick={downloadSingleCountryRatesTemplate}>
                            <Download className="w-4 h-4 mr-2" />
                            Template
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="singleCountryZipZonesFile">ZIP Zones File</Label>
                        <div className="flex gap-2 flex-wrap">
                          <Input
                            id="singleCountryZipZonesFile"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleSingleCountryZipZonesFileChange}
                            className="flex-1"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => downloadSingleCountryZipZonesTemplate("range")}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Range
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => downloadSingleCountryZipZonesTemplate("individual")}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Individual
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => downloadSingleCountryZipZonesTemplate("mixed")}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Mixed
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="pt-4">
                    <ManualSingleCountryForm onDataGenerated={setSingleCountryManualData} />

                    {singleCountryManualData && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <Check className="w-5 h-5" />
                          <span className="font-medium">Data Generated Successfully!</span>
                        </div>
                        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                          <p>Country: {singleCountryManualData.targetCountry}</p>
                          <p>Rate entries: {singleCountryManualData.rates.length}</p>
                          <p>ZIP zone entries: {singleCountryManualData.postalZones.length}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* MANUAL METHOD */}
              <TabsContent value="manual" className="pt-6">
                <ManualRateForm onDataGenerated={setManualData} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* VALIDATION SECTION - Same as before */}
        {((entryMethod === "file" && (ratesValidation || zonesValidation || zipZonesValidation)) ||
          (entryMethod === "singleCountryZip" &&
            singleCountryMethod === "file" &&
            (singleCountryRatesValidation || singleCountryZipZonesValidation))) && (
          <Card>
            <CardHeader>
              <CardTitle>3. Data Validation</CardTitle>
              <CardDescription>Review the processed data before submission.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* ... validation content same as before ... */}
              {entryMethod === "file" && (
                <Tabs defaultValue="rates" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rates" disabled={!ratesValidation}>
                      Rates Data
                    </TabsTrigger>
                    <TabsTrigger value="zones" disabled={!zonesValidation}>
                      Zones Data
                    </TabsTrigger>
                    <TabsTrigger value="zipzones" disabled={!zipZonesValidation}>
                      ZIP Zones Data
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="rates" className="space-y-4 pt-4">
                    {ratesValidation && (
                      <>
                        <div className="flex gap-4">
                          <Badge variant="default" className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {ratesValidation.accepted.length} Accepted
                          </Badge>
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <X className="w-3 h-3" />
                            {ratesValidation.rejected.length} Rejected
                          </Badge>
                        </div>

                        {ratesValidation.accepted.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Accepted Rates (Preview)</h4>
                            <div className="border rounded-lg overflow-auto max-h-64">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Row</TableHead>
                                    <TableHead>Weight (kg)</TableHead>
                                    <TableHead>Zones</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {ratesValidation.accepted.slice(0, 10).map((item, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{item.row}</TableCell>
                                      <TableCell>{item.kg}</TableCell>
                                      <TableCell>{item.zones}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* Other tabs similar */}
                </Tabs>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/rates">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={uploading}>
            {uploading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Create {rateData.rateCategory === "purchase" ? "Purchase" : "Sales"} Rate
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}