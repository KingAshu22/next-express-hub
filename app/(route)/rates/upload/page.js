"use client"

import { useState } from "react"
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
import { ArrowLeft, Upload, Download, Check, X, Calculator, Plus, FileUp, Edit } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import DynamicChargesManager from "@/app/_components/DynamicChargesManager"
import ManualRateForm from "@/app/_components/ManualRateForm"

// Reusable TagInput component (remains the same)
function TagInput({ value, onChange }) {
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
          placeholder="Enter a client code and press Enter"
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

export default function UploadRatePage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [entryMethod, setEntryMethod] = useState("file") // 'file' or 'manual'

  // Common state for the rate sheet
  const [rateData, setRateData] = useState({
    type: "",
    service: "",
    originalName: "",
    charges: [],
    status: "hidden",
    assignedTo: [],
    rateType: "base", // Specific to file upload, but kept for simplicity
  })

  // State for File Upload method
  const [ratesFile, setRatesFile] = useState(null)
  const [zonesFile, setZonesFile] = useState(null)
  const [ratesValidation, setRatesValidation] = useState(null)
  const [zonesValidation, setZonesValidation] = useState(null)

  // State for Manual Entry method
  const [manualData, setManualData] = useState({ rates: [], zones: [] })

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

      setRatesValidation({ rates: ratesSection, accepted, rejected, headers: jsonData[0] || [], rateType })
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

        const countries = countriesStr.split(",").map((c) => c.trim()).filter(Boolean)
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
        accepted.push({ row: i + 1, zone, countries: countries.length, charges: Object.keys(zoneEntry.extraCharges).length })
      }

      setZonesValidation({ zones: zonesSection, accepted, rejected, headers: jsonData[0] || [] })
    } catch (error) {
      console.error("Error processing zones file:", error)
      toast({ title: "Error", description: "Failed to process the zones file.", variant: "destructive" })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!rateData.type || !rateData.service || !rateData.originalName) {
      toast({ title: "Error", description: "Please fill all fields in the 'Rate Configuration' section.", variant: "destructive" })
      return
    }

    setUploading(true)
    let payloadRates, payloadZones;

    if (entryMethod === 'file') {
      if (!ratesValidation || !zonesValidation) {
        toast({ title: "Error", description: "Please upload and validate both rates and zones files.", variant: "destructive" })
        setUploading(false)
        return
      }
      payloadRates = ratesValidation.rates
      payloadZones = zonesValidation.zones
    } else { // Manual entry
      if (manualData.rates.length === 0 || manualData.zones.length === 0) {
        toast({ title: "Error", description: "Please generate a rate table using the manual form before submitting.", variant: "destructive" })
        setUploading(false)
        return
      }
      // Manual form gives per/kg rates, convert them to base rates for the database
      payloadRates = manualData.rates.map(rate => {
        const baseRate = { kg: rate.kg }
        Object.keys(rate)
              .filter(key => key !== 'kg')
              .forEach(zoneKey => {
                baseRate[zoneKey] = parseFloat((rate[zoneKey] * rate.kg).toFixed(2))
              })
        return baseRate
      })
      payloadZones = manualData.zones
    }

    try {
      const payload = { ...rateData, rates: payloadRates, zones: payloadZones }

      if (payload.status !== 'unlisted') {
        payload.assignedTo = []
      }

      const response = await fetch("/api/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Rate uploaded successfully." })
        router.push("/rates")
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.message || "Failed to upload rate.", variant: "destructive" })
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
      ? [ ["kg", "1", "2"], [0.5, 2184, 2170], [1, 1315, 1296] ]
      : [ ["kg", "1", "2"], [0.5, 1092, 1085], [1, 1315, 1296] ]
    
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
        <Card>
          <CardHeader>
            <CardTitle>1. Rate Configuration</CardTitle>
            <CardDescription>Enter general information and set visibility status. This applies to both entry methods.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="service">Service</Label>
                  <Input id="service" value={rateData.service} onChange={(e) => setRateData({ ...rateData, service: e.target.value })} placeholder="e.g., SUNEX-D" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="originalName">Original Name</Label>
                  <Input id="originalName" value={rateData.originalName} onChange={(e) => setRateData({ ...rateData, originalName: e.target.value })} placeholder="e.g., DHL" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type">Type</Label>
                  <Input id="type" value={rateData.type} onChange={(e) => setRateData({ ...rateData, type: e.target.value })} placeholder="e.g., dhl, fedex" required />
                </div>
                 <div>
                   <DynamicChargesManager 
                    value={rateData.charges}
                    onChange={(newCharges) => setRateData({...rateData, charges: newCharges})}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select value={rateData.status} onValueChange={(value) => setRateData({ ...rateData, status: value })}>
                    <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hidden">Hidden - Not visible (Default)</SelectItem>
                      <SelectItem value="unlisted">Unlisted - Visible only to assigned clients</SelectItem>
                      <SelectItem value="live">Live - Visible to everyone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {rateData.status === 'unlisted' && (
                  <div className="space-y-1.5">
                    <Label>Assigned Clients / Franchises</Label>
                    <TagInput value={rateData.assignedTo} onChange={(newTags) => setRateData({ ...rateData, assignedTo: newTags })} />
                    <p className="text-sm text-muted-foreground pt-1">Enter client codes to grant them access.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Rate & Zone Data</CardTitle>
            <CardDescription>Choose to upload files or enter data manually.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={entryMethod} onValueChange={setEntryMethod}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file"><FileUp className="mr-2 h-4 w-4" />Upload Files</TabsTrigger>
                <TabsTrigger value="manual"><Edit className="mr-2 h-4 w-4" />Enter Manually</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="pt-6 space-y-6">
                <div className="border rounded-lg p-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> Rate Calculation Method (for File)
                  </Label>
                  <RadioGroup value={rateData.rateType} onValueChange={handleRateTypeChange} className="mt-3">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="base" id="base" /><Label htmlFor="base" className="font-normal">Base Rate (Final amounts)</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="perKg" id="perKg" /><Label htmlFor="perKg" className="font-normal">Rate per Kg</Label></div>
                  </RadioGroup>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="ratesFile">Rates File {rateData.rateType === "perKg" && "(per kg)"}</Label>
                    <div className="flex gap-2">
                      <Input id="ratesFile" type="file" accept=".xlsx,.xls" onChange={handleRatesFileChange} />
                      <Button type="button" variant="outline" onClick={downloadRatesTemplate}><Download className="w-4 h-4 mr-2" />Template</Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="zonesFile">Zones File</Label>
                    <div className="flex gap-2">
                      <Input id="zonesFile" type="file" accept=".xlsx,.xls" onChange={handleZonesFileChange} />
                      <Button type="button" variant="outline" onClick={downloadZonesTemplate}><Download className="w-4 h-4 mr-2" />Template</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="manual" className="pt-6">
                <ManualRateForm onDataGenerated={setManualData} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {entryMethod === 'file' && (ratesValidation || zonesValidation) && (
          <Card>
            <CardHeader><CardTitle>3. Validation (File Upload)</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="rates" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rates" disabled={!ratesValidation}>Rates Data</TabsTrigger>
                  <TabsTrigger value="zones" disabled={!zonesValidation}>Zones Data</TabsTrigger>
                </TabsList>
                <TabsContent value="rates" className="space-y-4 pt-4">{ ratesValidation && ( <> {/*... your rates validation table UI ...*/} </> )} </TabsContent>
                <TabsContent value="zones" className="space-y-4 pt-4">{ zonesValidation && ( <> {/*... your zones validation table UI ...*/} </> )} </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={uploading}>
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Create Rate Sheet"}
          </Button>
        </div>
      </form>
    </div>
  )
}