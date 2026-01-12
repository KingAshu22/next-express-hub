"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Package, ShoppingCart, AlertCircle, Trash2, Download } from "lucide-react"
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

export default function EditRatePage() {
  const router = useRouter()
  const params = useParams()
  const rateId = params.id

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [entryMethod, setEntryMethod] = useState("file")
  const [rateType, setRateType] = useState("base")

  const [rateData, setRateData] = useState({
    vendorName: "",
    rateCategory: "purchase",
    type: "",
    service: "",
    originalName: "",
    charges: [],
    status: "hidden",
    assignedTo: [],
    rateMode: "multi-country",
    targetCountry: "",
  })

  const [ratesFile, setRatesFile] = useState(null)
  const [zonesFile, setZonesFile] = useState(null)
  const [ratesValidation, setRatesValidation] = useState(null)
  const [zonesValidation, setZonesValidation] = useState(null)

  const [manualData, setManualData] = useState({ rates: [], zones: [] })

  useEffect(() => {
    fetchRate()
  }, [rateId])

  const fetchRate = async () => {
    try {
      const response = await fetch(`/api/rates/${rateId}`)
      if (response.ok) {
        const data = await response.json()
        setRateData({
          vendorName: data.vendorName,
          rateCategory: data.rateCategory,
          type: data.type || "",
          service: data.service,
          originalName: data.originalName,
          charges: data.charges || [],
          status: data.status || "hidden",
          assignedTo: data.assignedTo || [],
          rateMode: data.rateMode || "multi-country",
          targetCountry: data.targetCountry || "",
        })

        // Load existing rates and zones data
        if (data.rates && data.zones) {
          setManualData({
            rates: data.rates,
            zones: data.zones,
          })
          setRatesValidation({
            rates: data.rates,
            accepted: data.rates.map((r, i) => ({ row: i + 1, kg: r.kg })),
            rejected: [],
            headers: ["kg", ...data.zones.map((z) => z.zone)],
          })
          setZonesValidation({
            zones: data.zones,
            accepted: data.zones.map((z, i) => ({
              row: i + 1,
              zone: z.zone,
              countries: z.countries.length,
            })),
            rejected: [],
            headers: ["Zone", "Countries"],
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Rate not found.",
          variant: "destructive",
        })
        router.push("/rates")
      }
    } catch (error) {
      console.error("Error fetching rate:", error)
      toast({
        title: "Error",
        description: "Failed to load rate details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRatesFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setRatesFile(selectedFile)
      processRatesFile(selectedFile)
    }
  }

  const handleZonesFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setZonesFile(selectedFile)
      processZonesFile(selectedFile)
    }
  }

  const processRatesFile = async (file) => {
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
          const rate = Number.parseFloat(row[j])
          if (!isNaN(rate) && rate > 0) {
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

  const downloadRatesData = () => {
    if (!ratesValidation || ratesValidation.rates.length === 0) {
      toast({
        title: "Error",
        description: "No rate data available to download.",
        variant: "destructive",
      })
      return
    }

    const wb = XLSX.utils.book_new()
    const headers = ["kg", ...(zonesValidation?.zones?.map((z) => z.zone) || [])]
    const wsData = [headers]

    ratesValidation.rates.forEach((rate) => {
      const row = [rate.kg]
      headers.slice(1).forEach((zone) => {
        const rateValue = rate[zone] || 0
        if (rateType === "perKg") {
          row.push(Number((rateValue / rate.kg).toFixed(4)))
        } else {
          row.push(rateValue)
        }
      })
      wsData.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Rates")
    XLSX.writeFile(wb, `${rateData.originalName}_rates_${rateType}.xlsx`)
    toast({ title: "Success", description: "Rates downloaded successfully." })
  }

  const downloadZonesData = () => {
    if (!zonesValidation || zonesValidation.zones.length === 0) {
      toast({
        title: "Error",
        description: "No zones data available to download.",
        variant: "destructive",
      })
      return
    }

    const wb = XLSX.utils.book_new()
    const headers = ["Zone", "Countries"]
    const wsData = [headers]

    zonesValidation.zones.forEach((zone) => {
      const row = [zone.zone, zone.countries.join(",")]

      Object.entries(zone.extraCharges).forEach(([chargeName, chargeValue]) => {
        row.push(chargeName, chargeValue)
      })

      wsData.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Zones")
    XLSX.writeFile(wb, `${rateData.originalName}_zones.xlsx`)
    toast({ title: "Success", description: "Zones downloaded successfully." })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!rateData.vendorName || !rateData.service || !rateData.originalName) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)

    let payloadRates
    let payloadZones

    if (entryMethod === "file") {
      if (!ratesValidation) {
        toast({
          title: "Error",
          description: "Please upload and validate the rates file.",
          variant: "destructive",
        })
        setUpdating(false)
        return
      }

      if (!zonesValidation) {
        toast({
          title: "Error",
          description: "Please upload and validate the zones file.",
          variant: "destructive",
        })
        setUpdating(false)
        return
      }

      payloadRates = ratesValidation.rates
      payloadZones = zonesValidation.zones
    } else {
      if (manualData.rates.length === 0 || manualData.zones.length === 0) {
        toast({
          title: "Error",
          description: "Please generate a rate table before submitting.",
          variant: "destructive",
        })
        setUpdating(false)
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
        type: rateData.type,
        service: rateData.service,
        originalName: rateData.originalName,
        charges: rateData.charges,
        status: rateData.status,
        assignedTo: rateData.status === "unlisted" ? rateData.assignedTo : [],
        rates: payloadRates,
        zones: payloadZones,
        rateMode: rateData.rateMode,
        targetCountry: rateData.targetCountry,
      }

      const response = await fetch(`/api/rates/${rateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Rate updated successfully.",
        })
        router.push(`/rates/${rateId}`)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to update rate.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating rate:", error)
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this rate? This action cannot be undone.")) {
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/rates/${rateId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Rate deleted successfully.",
        })
        router.push("/rates")
      } else {
        toast({
          title: "Error",
          description: "Failed to delete rate.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting rate:", error)
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading rate details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/rates/${rateId}`}>
          <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Rate</h1>
          <p className="text-muted-foreground">Update rate details and pricing data.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {rateData.rateCategory === "purchase" ? (
                <Package className="w-5 h-5" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
              Basic Information
            </CardTitle>
            <CardDescription>Update rate vendor, service, and general details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vendorName">Vendor Name *</Label>
                <Input
                  id="vendorName"
                  value={rateData.vendorName}
                  onChange={(e) => setRateData({ ...rateData, vendorName: e.target.value })}
                  placeholder="e.g., DHL, FedEx, Aramex"
                  required
                />
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
            </div>

            <div className="mt-4">
              <DynamicChargesManager
                value={rateData.charges}
                onChange={(newCharges) => setRateData({ ...rateData, charges: newCharges })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rate Mode & Visibility */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Settings</CardTitle>
            <CardDescription>Configure rate mode and visibility.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rate Mode</Label>
                <RadioGroup
                  value={rateData.rateMode}
                  onValueChange={(value) => setRateData({ ...rateData, rateMode: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="multi-country" id="multi-country" />
                    <Label htmlFor="multi-country" className="font-normal cursor-pointer">
                      Multi-Country
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single-country" id="single-country" />
                    <Label htmlFor="single-country" className="font-normal cursor-pointer">
                      Single Country
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {rateData.rateMode === "single-country" && (
                <div className="space-y-1.5">
                  <Label htmlFor="targetCountry">Target Country *</Label>
                  <Input
                    id="targetCountry"
                    value={rateData.targetCountry}
                    onChange={(e) => setRateData({ ...rateData, targetCountry: e.target.value })}
                    placeholder="e.g., United States, India"
                    required={rateData.rateMode === "single-country"}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Visibility Status</Label>
                <RadioGroup
                  value={rateData.status}
                  onValueChange={(value) => setRateData({ ...rateData, status: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hidden" id="hidden" />
                    <Label htmlFor="hidden" className="font-normal cursor-pointer">
                      Hidden
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="live" id="live" />
                    <Label htmlFor="live" className="font-normal cursor-pointer">
                      Visible to All
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unlisted" id="unlisted" />
                    <Label htmlFor="unlisted" className="font-normal cursor-pointer">
                      Listed to Specific Users
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {rateData.status === "unlisted" && (
                <div className="space-y-2">
                  <Label>Assign to Users</Label>
                  <TagInput
                    value={rateData.assignedTo}
                    onChange={(newAssignedTo) => setRateData({ ...rateData, assignedTo: newAssignedTo })}
                    placeholder="Enter user ID/email and press Enter"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rate Data Entry */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Data Entry</CardTitle>
            <CardDescription>Choose how to update your rate data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={entryMethod} onValueChange={setEntryMethod}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Excel File Upload</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>

              {/* File Upload Tab */}
              <TabsContent value="file" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ratesFile">Rates File (XLSX)</Label>
                    <Input id="ratesFile" type="file" accept=".xlsx" onChange={handleRatesFileChange} />
                    <p className="text-xs text-muted-foreground">
                      First column: weight (kg), subsequent columns: zone rates
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zonesFile">Zones File (XLSX)</Label>
                    <Input id="zonesFile" type="file" accept=".xlsx" onChange={handleZonesFileChange} />
                    <p className="text-xs text-muted-foreground">
                      Columns: Zone, Countries (comma-separated), Charge Names & Values
                    </p>
                  </div>
                </div>

                {ratesValidation && (
                  <div className="space-y-3">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Rates: {ratesValidation.accepted.length} accepted, {ratesValidation.rejected.length} rejected
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {zonesValidation && (
                  <div className="space-y-3">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Zones: {zonesValidation.accepted.length} accepted, {zonesValidation.rejected.length} rejected
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {ratesValidation && zonesValidation && (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download Current Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Rate Type to Download</Label>
                        <Select value={rateType} onValueChange={setRateType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="base">Base Rate (Total per kg)</SelectItem>
                            <SelectItem value="perKg">Rate Per Kg</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {rateType === "base"
                            ? "Download rates as total base rate for each weight"
                            : "Download rates as per kg rate (multiply by weight to get base rate)"}
                        </p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadRatesData}
                          className="gap-2 bg-transparent"
                        >
                          <Download className="w-4 h-4" />
                          Download Rates
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadZonesData}
                          className="gap-2 bg-transparent"
                        >
                          <Download className="w-4 h-4" />
                          Download Zones
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Manual Entry Tab */}
              <TabsContent value="manual" className="space-y-6">
                <ManualRateForm
                  onDataGenerated={setManualData}
                  initialData={{
                    rates: manualData.rates || [],
                    zones: manualData.zones || [],
                  }}
                  isReadOnlyZones={false}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3 justify-between">
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={updating} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Delete Rate
          </Button>
          <div className="flex gap-3">
            <Link href={`/rates/${rateId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={updating}>
              {updating ? "Updating..." : "Update Rate"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
