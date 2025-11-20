"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Download, Check, X, Tag, Plus, FileUp, Edit } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import DynamicChargesManager from "@/app/_components/DynamicChargesManager"
import ManualRateForm from "@/app/_components/ManualRateForm"

// A custom component for tag-style input
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

export default function EditRatePage() {
  const params = useParams()
  const router = useRouter()
  
  const [rate, setRate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [replaceData, setReplaceData] = useState(false)
  const [entryMethod, setEntryMethod] = useState("file")
  
  const [ratesFile, setRatesFile] = useState(null)
  const [zonesFile, setZonesFile] = useState(null)
  const [rateUpdateType, setRateUpdateType] = useState("base")
  const [ratesValidation, setRatesValidation] = useState(null)
  const [zonesValidation, setZonesValidation] = useState(null)

  const [manualData, setManualData] = useState({ rates: [], zones: [] })

  useEffect(() => {
    if (params.id) {
      fetchRate()
    }
  }, [params.id])

  const fetchRate = async () => {
    try {
      const response = await fetch(`/api/rates/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRate(data)
      } else {
        toast({ title: "Error", description: "Failed to fetch rate details", variant: "destructive" })
        router.push("/rates")
      }
    } catch (error) {
      console.error("Error fetching rate:", error)
      toast({ title: "Error", description: "Failed to fetch rate details", variant: "destructive" })
      router.push("/rates")
    } finally {
      setLoading(false)
    }
  }

  const handleRatesFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setRatesFile(selectedFile)
      processRatesFile(selectedFile, rateUpdateType)
    }
  }
  
  const handleRateUpdateTypeChange = (value) => {
    setRateUpdateType(value);
    if(ratesFile) {
        processRatesFile(ratesFile, value);
    }
  }

  const handleZonesFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setZonesFile(selectedFile)
      processZonesFile(selectedFile)
    }
  }

  const processRatesFile = async (file, currentRateUpdateType) => {
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
          let rateValue = Number.parseFloat(row[j])
          if (!isNaN(rateValue) && rateValue > 0) {
            if (currentRateUpdateType === "perKg") {
              rateValue = rateValue * kg
            }
            rateEntry[j.toString()] = Number(rateValue.toFixed(2))
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
      setRatesValidation({ rates: ratesSection, accepted, rejected, headers: jsonData[0] || [], rateType: currentRateUpdateType })
    } catch (error) {
      console.error("Error processing rates file:", error)
      toast({ title: "Error", description: "Failed to process the rates file", variant: "destructive" })
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
        const countries = countriesStr.split(",").map((c) => c.trim()).filter((c) => c)
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
      toast({ title: "Error", description: "Failed to process the zones file", variant: "destructive" })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    let payloadRates = rate.rates;
    let payloadZones = rate.zones;

    if (replaceData) {
        if(entryMethod === 'file') {
            if(!ratesValidation && !zonesValidation) {
                toast({ title: "No New Data", description: "You checked 'Replace Data' but didn't upload any valid new files.", variant: "default" });
                // We can still proceed with saving other changes
            }
            if (ratesValidation) payloadRates = ratesValidation.rates;
            if (zonesValidation) payloadZones = zonesValidation.zones;
        } else { // manual
             if (manualData.rates.length === 0 || manualData.zones.length === 0) {
                toast({ title: "Error", description: "Please generate a rate table using the manual form before saving.", variant: "destructive" });
                setSaving(false);
                return;
            }
            payloadRates = manualData.rates.map(r => {
                const base = { kg: r.kg };
                Object.keys(r).filter(k => k !== 'kg').forEach(zoneKey => {
                    base[zoneKey] = parseFloat((r[zoneKey] * r.kg).toFixed(2));
                });
                return base;
            });
            payloadZones = manualData.zones;
        }
    }

    try {
      const payload = { ...rate, rates: payloadRates, zones: payloadZones }

      if (payload.status !== 'unlisted') {
        payload.assignedTo = []
      }

      const response = await fetch(`/api/rates/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Rate updated successfully." })
        router.push(`/rates/${params.id}`)
        router.refresh()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.message || "Failed to update rate.", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error updating rate:", error)
      toast({ title: "Error", description: "An unexpected error occurred while saving.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const downloadCurrentRates = () => {
    if (!rate || !rate.rates) return;
    const wb = XLSX.utils.book_new();
    const zones = new Set();
    rate.rates.forEach((rateItem) => {
      Object.keys(rateItem).forEach((key) => { if (key !== "kg" && key !== "_id") { zones.add(key) }})
    });
    const sortedZones = Array.from(zones).sort();
    const headers = ["kg", ...sortedZones];
    const wsData = [headers];
    rate.rates.forEach((rateItem) => {
      const row = [rateItem.kg];
      sortedZones.forEach((zone) => { row.push(rateItem[zone] || "") });
      wsData.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Rates");
    XLSX.writeFile(wb, `${rate.originalName}_rates.xlsx`);
  };

  const downloadCurrentZones = () => {
    if (!rate || !rate.zones) return;
    const wb = XLSX.utils.book_new();
    const maxCharges = Math.max(0, ...rate.zones.map((zone) => Object.keys(zone.extraCharges || {}).length));
    const headers = ["Zone", "Countries"];
    for (let i = 0; i < maxCharges; i++) {
      headers.push(`Charge Name ${i + 1}`, `Charge Value ${i + 1}`);
    }
    const wsData = [headers];
    rate.zones.forEach((zone) => {
      const row = [zone.zone, Array.isArray(zone.countries) ? zone.countries.join(",") : ""];
      const charges = Object.entries(zone.extraCharges || {});
      charges.forEach(([name, value]) => { row.push(name, value) });
      wsData.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Zones");
    XLSX.writeFile(wb, `${rate.originalName}_zones.xlsx`);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading rate details...</div>
  }

  if (!rate) {
    return <div className="container mx-auto px-4 py-8 text-center">Rate not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/rates/${params.id}`}>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Rate</h1>
            <p className="text-muted-foreground">{rate.originalName} - {rate.service}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Manage general information, visibility, and assignments.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5"><Label htmlFor="service">Service</Label><Input id="service" value={rate.service} onChange={(e) => setRate({ ...rate, service: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="originalName">Original Name</Label><Input id="originalName" value={rate.originalName} onChange={(e) => setRate({ ...rate, originalName: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="type">Type</Label><Input id="type" value={rate.type} onChange={(e) => setRate({ ...rate, type: e.target.value })} /></div>
                  <div><DynamicChargesManager value={rate.charges || []} onChange={(newCharges) => setRate({...rate, charges: newCharges})}/></div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="status">Status</Label>
                    <Select value={rate.status} onValueChange={(value) => setRate({ ...rate, status: value })}>
                      <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live">Live - Visible to everyone</SelectItem>
                        <SelectItem value="unlisted">Unlisted - Visible only to assigned clients</SelectItem>
                        <SelectItem value="hidden">Hidden - Not visible to anyone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {rate.status === 'unlisted' && (
                    <div className="space-y-1.5">
                      <Label>Assigned Clients / Franchises</Label>
                      <TagInput value={rate.assignedTo || []} onChange={(newTags) => setRate({ ...rate, assignedTo: newTags })}/>
                      <p className="text-sm text-muted-foreground pt-1">Enter client codes to grant them access.</p>
                    </div>
                  )}
                </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Rate & Zone Data</CardTitle>
            <CardDescription>Optionally, replace existing data by uploading files or entering it manually.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="replaceData" checked={replaceData} onCheckedChange={setReplaceData} />
                    <Label htmlFor="replaceData" className="font-medium text-base">Replace All Rate & Zone Data</Label>
                </div>
                {replaceData && (
                    <Tabs value={entryMethod} onValueChange={setEntryMethod} className="pt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="file"><FileUp className="mr-2 h-4 w-4" />Upload Files</TabsTrigger>
                            <TabsTrigger value="manual"><Edit className="mr-2 h-4 w-4" />Edit Manually</TabsTrigger>
                        </TabsList>

                        <TabsContent value="file" className="pt-6 space-y-6">
                            <div className="border rounded-lg p-4">
                                <Label className="text-base font-semibold">Rate Calculation Method (for File)</Label>
                                <RadioGroup value={rateUpdateType} onValueChange={handleRateUpdateTypeChange} className="mt-3">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="base" id="edit-base" /><Label htmlFor="edit-base" className="font-normal">Base Rate (Final amounts)</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="perKg" id="edit-perKg" /><Label htmlFor="edit-perKg" className="font-normal">Rate per Kg</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="ratesFile">Upload New Rates File</Label>
                                    <div className="flex gap-2"><Input id="ratesFile" type="file" accept=".xlsx,.xls" onChange={handleRatesFileChange} /><Button type="button" variant="outline" size="sm" onClick={downloadCurrentRates}>Current</Button></div>
                                </div>
                                <div>
                                    <Label htmlFor="zonesFile">Upload New Zones File</Label>
                                    <div className="flex gap-2"><Input id="zonesFile" type="file" accept=".xlsx,.xls" onChange={handleZonesFileChange} /><Button type="button" variant="outline" size="sm" onClick={downloadCurrentZones}>Current</Button></div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="manual" className="pt-6">
                           <ManualRateForm 
                                onDataGenerated={setManualData} 
                                initialData={rate} 
                            />
                        </TabsContent>
                    </Tabs>
                )}
             </div>
          </CardContent>
        </Card>

        {replaceData && entryMethod === 'file' && (ratesValidation || zonesValidation) && (
          <Card>
            <CardHeader><CardTitle>Validation Results (File Upload)</CardTitle></CardHeader>
            <CardContent>
                <Tabs defaultValue={ratesValidation ? "rates" : "zones"} className="w-full">
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="rates" disabled={!ratesValidation}>Rates Data</TabsTrigger><TabsTrigger value="zones" disabled={!zonesValidation}>Zones Data</TabsTrigger></TabsList>
                    <TabsContent value="rates" className="pt-4">
                        {ratesValidation && (
                            <div className="space-y-4">
                                <div className="flex gap-4"><Badge variant="secondary" className="text-green-600"><Check className="w-4 h-4 mr-1" />Accepted: {ratesValidation.accepted.length}</Badge><Badge variant="secondary" className="text-red-600"><X className="w-4 h-4 mr-1" />Rejected: {ratesValidation.rejected.length}</Badge></div>
                                {/* Validation Table UI can be added here if needed */}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="zones" className="pt-4">
                        {zonesValidation && (
                            <div className="space-y-4">
                                <div className="flex gap-4"><Badge variant="secondary" className="text-green-600"><Check className="w-4 h-4 mr-1" />Accepted: {zonesValidation.accepted.length}</Badge><Badge variant="secondary" className="text-red-600"><X className="w-4 h-4 mr-1" />Rejected: {zonesValidation.rejected.length}</Badge></div>
                                {/* Validation Table UI can be added here if needed */}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}