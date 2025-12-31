"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Package, ShoppingCart, LinkIcon, AlertCircle, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import DynamicChargesManager from "@/app/_components/DynamicChargesManager"
import ManualRateForm from "@/app/_components/ManualRateForm"

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
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <div
            key={tag}
            className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
          >
            {tag}
            <button type="button" className="ml-1 hover:text-foreground" onClick={() => removeTag(tag)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PurchaseRateSelector({ vendorName, selectedRateId, onSelect, purchaseRates, onPrefill }) {
  const filteredRates = vendorName
    ? purchaseRates.filter((rate) => rate.vendorName?.toLowerCase() === vendorName.toLowerCase())
    : purchaseRates

  const handleSelect = (rateId) => {
    onSelect(rateId)
    const selectedRate = purchaseRates.find((r) => r._id === rateId)
    if (selectedRate && onPrefill) {
      onPrefill(selectedRate)
    }
  }

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
          <Select value={selectedRateId} onValueChange={handleSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a purchase rate to link" />
            </SelectTrigger>
            <SelectContent>
              {filteredRates.map((rate) => (
                <SelectItem key={rate._id} value={rate._id}>
                  <span>
                    {rate.vendorName} - {rate.service}
                  </span>
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
                      <strong>Mode:</strong> {selectedRate.rateMode}
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
        Sales rates must be linked to a purchase rate. Vendor, service, and rate data will auto-fill.
      </p>
    </div>
  )
}

export default function UploadRatePage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [entryMethod, setEntryMethod] = useState("file")

  const [purchaseRates, setPurchaseRates] = useState([])
  const [loadingPurchaseRates, setLoadingPurchaseRates] = useState(false)

  const [prefillData, setPrefillData] = useState(null)

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
    rateMode: "multi-country",
    targetCountry: "",
  })

  const [ratesFile, setRatesFile] = useState(null)
  const [zonesFile, setZonesFile] = useState(null)
  const [ratesValidation, setRatesValidation] = useState(null)
  const [zonesValidation, setZonesValidation] = useState(null)

  const [manualData, setManualData] = useState({ rates: [], zones: [] })

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

  const handlePrefillFromPurchaseRate = (purchaseRate) => {
    setPrefillData(purchaseRate)

    setRateData((prev) => ({
      ...prev,
      vendorName: purchaseRate.vendorName,
      service: purchaseRate.service,
      originalName: purchaseRate.originalName,
      type: purchaseRate.type || "",
      charges: purchaseRate.charges || [],
      rateMode: purchaseRate.rateMode,
      targetCountry: purchaseRate.targetCountry || "",
    }))

    // Pre-fill manual data if available
    if (purchaseRate.rates && purchaseRate.zones) {
      setManualData({
        rates: purchaseRate.rates,
        zones: purchaseRate.zones,
      })
    }
  }

  const handleRateCategoryChange = (value) => {
    setRateData({
      ...rateData,
      rateCategory: value,
      status: value === "purchase" ? "hidden" : rateData.status,
      purchaseRateId: value === "purchase" ? "" : rateData.purchaseRateId,
      assignedTo: value === "purchase" ? [] : rateData.assignedTo,
    })
    setPrefillData(null)
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

  const handleRateTypeChange = (value) => {
    setRateData({ ...rateData, rateType: value })
    if (ratesFile) {
      processRatesFile(ratesFile, value)
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
    const rateMode = "multi-country"
    const targetCountry = ""

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

      if (!zonesValidation) {
        toast({
          title: "Error",
          description: "Please upload and validate the zones file.",
          variant: "destructive",
        })
        setUploading(false)
        return
      }

      payloadRates = ratesValidation.rates
      payloadZones = zonesValidation.zones
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
            baseRate[zoneKey] = Number.parseFloat((rate[zoneKey] * rate.kg).toFixed(2))
          })
        return baseRate
      })
      payloadZones = manualData.zones
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
        status: rateData.rateCategory === "purchase" ? "hidden" : rateData.status,
        assignedTo: rateData.status === "unlisted" ? rateData.assignedTo : [],
        rates: payloadRates,
        zones: payloadZones,
        rateMode,
        targetCountry,
      }

      const response = await fetch("/api/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${rateData.rateCategory === "purchase" ? "Purchase" : "Sales"} rate uploaded successfully.`,
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/rates">
          <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
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
                  <div
                    className={`p-2 rounded-full ${
                      rateData.rateCategory === "purchase" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
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
                  <div
                    className={`p-2 rounded-full ${
                      rateData.rateCategory === "sales" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
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
            <CardDescription>Enter general information and set visibility status.</CardDescription>
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
                    onChange={(e) => !prefillData && setRateData({ ...rateData, vendorName: e.target.value })}
                    placeholder="e.g., DHL, FedEx, Aramex"
                    disabled={!!prefillData && rateData.rateCategory === "sales"}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {prefillData && rateData.rateCategory === "sales"
                      ? "Auto-filled from purchase rate (Read-only)"
                      : "The shipping carrier or vendor providing this rate."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="service">Service *</Label>
                  <Input
                    id="service"
                    value={rateData.service}
                    onChange={(e) => !prefillData && setRateData({ ...rateData, service: e.target.value })}
                    placeholder="e.g., SUNEX-D, Express, Economy"
                    disabled={!!prefillData && rateData.rateCategory === "sales"}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {prefillData && rateData.rateCategory === "sales"
                      ? "Auto-filled from purchase rate (Read-only)"
                      : ""}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="originalName">Original Name *</Label>
                  <Input
                    id="originalName"
                    value={rateData.originalName}
                    onChange={(e) => !prefillData && setRateData({ ...rateData, originalName: e.target.value })}
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
                      onPrefill={handlePrefillFromPurchaseRate}
                      purchaseRates={purchaseRates}
                    />
                    {loadingPurchaseRates && <p className="text-sm text-muted-foreground">Loading purchase rates...</p>}
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
                      Purchase rates are always hidden and only visible to admin users. They are used for internal cost
                      tracking and margin calculations.
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">File Upload</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Upload Excel files containing your rate and zone data. Download templates to see the expected
                    format.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rate Type</Label>
                    <RadioGroup value={rateData.rateType} onValueChange={handleRateTypeChange}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="base" id="file-base" />
                        <Label htmlFor="file-base" className="font-normal">
                          Base Rate (Final amounts)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="perKg" id="file-perKg" />
                        <Label htmlFor="file-perKg" className="font-normal">
                          Rate per Kg (Multiplied by weight)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ratesFile">Rates File *</Label>
                    <Input
                      id="ratesFile"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleRatesFileChange}
                      required={entryMethod === "file"}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={downloadRatesTemplate}>
                      Download Rates Template
                    </Button>
                    {ratesValidation && (
                      <div className="text-sm">
                        <p className="font-medium">Accepted: {ratesValidation.accepted.length}</p>
                        {ratesValidation.rejected.length > 0 && (
                          <p className="text-destructive">Rejected: {ratesValidation.rejected.length}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zonesFile">Zones File *</Label>
                    <Input
                      id="zonesFile"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleZonesFileChange}
                      required={entryMethod === "file"}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={downloadZonesTemplate}>
                      Download Zones Template
                    </Button>
                    {zonesValidation && (
                      <div className="text-sm">
                        <p className="font-medium">Accepted: {zonesValidation.accepted.length}</p>
                        {zonesValidation.rejected.length > 0 && (
                          <p className="text-destructive">Rejected: {zonesValidation.rejected.length}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-6">
                <ManualRateForm
                  onDataGenerated={setManualData}
                  initialData={
                    prefillData
                      ? {
                          rates: prefillData.rates || [],
                          zones: prefillData.zones || [],
                        }
                      : null
                  }
                  isReadOnlyZones={!!prefillData && rateData.rateCategory === "sales"}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end gap-4">
          <Link href="/rates">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Rate"}
          </Button>
        </div>
      </form>
    </div>
  )
}
