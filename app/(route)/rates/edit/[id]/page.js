"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Download, Check, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

export default function EditRatePage() {
  const params = useParams()
  const router = useRouter()
  const [rate, setRate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ratesFile, setRatesFile] = useState(null)
  const [zonesFile, setZonesFile] = useState(null)
  const [ratesValidation, setRatesValidation] = useState(null)
  const [zonesValidation, setZonesValidation] = useState(null)
  const [updateRates, setUpdateRates] = useState(false)
  const [updateZones, setUpdateZones] = useState(false)

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
        description: "Failed to fetch rate details",
        variant: "destructive",
      })
      router.push("/rates")
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
          rejected.push({
            row: i + 1,
            data: row,
            reason: "Invalid or missing weight",
          })
          continue
        }

        const rateEntry = { kg }
        let hasValidRates = false

        for (let j = 1; j < row.length; j++) {
          const rate = Number.parseFloat(row[j])
          if (!isNaN(rate) && rate > 0) {
            rateEntry[j.toString()] = rate
            hasValidRates = true
          }
        }

        if (hasValidRates) {
          ratesSection.push(rateEntry)
          accepted.push({
            row: i + 1,
            kg,
            zones: Object.keys(rateEntry).length - 1,
          })
        } else {
          rejected.push({
            row: i + 1,
            data: row,
            reason: "No valid zone rates found",
          })
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
      toast({
        title: "Error",
        description: "Failed to process the rates file",
        variant: "destructive",
      })
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
          rejected.push({
            row: i + 1,
            data: row,
            reason: "Missing zone or countries",
          })
          continue
        }

        const countries = countriesStr
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c)
        if (countries.length === 0) {
          rejected.push({
            row: i + 1,
            data: row,
            reason: "No valid countries found",
          })
          continue
        }

        const zoneEntry = {
          zone,
          countries,
          extraCharges: {},
        }

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

      setZonesValidation({
        zones: zonesSection,
        accepted,
        rejected,
        headers: jsonData[0] || [],
      })
    } catch (error) {
      console.error("Error processing zones file:", error)
      toast({
        title: "Error",
        description: "Failed to process the zones file",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const payload = {
        ...rate,
        rates: updateRates && ratesValidation ? ratesValidation.rates : rate.rates,
        zones: updateZones && zonesValidation ? zonesValidation.zones : rate.zones,
      }

      const response = await fetch(`/api/rates/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Rate updated successfully",
        })
        router.push(`/rates/${params.id}`)
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
      setSaving(false)
    }
  }

  const downloadRatesTemplate = () => {
    const wb = XLSX.utils.book_new()
    const wsData = [
      ["kg", "1", "2", "3", "4", "5"],
      [0.5, 1092, 1085, 1228, 1159, 1448],
      [1, 1315, 1296, 1491, 1297, 1784],
      [2, 1537, 1533, 1751, 1434, 2113],
      [3, 1759, 1770, 2011, 1571, 2442],
      [4, 1981, 2007, 2271, 1708, 2771],
      [5, 2203, 2244, 2531, 1845, 3100],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Rates")
    XLSX.writeFile(wb, "rates_template.xlsx")
  }

  const downloadZonesTemplate = () => {
    const wb = XLSX.utils.book_new()
    const wsData = [
      ["Zone", "Countries", "Charge Name", "Charge Value", "Charge Name 2", "Charge Value 2"],
      ["1", "Bangladesh,Bhutan,Maldives", "Fuel Surcharge", 20, "Remote Area", 15],
      ["2", "Hong Kong,Malaysia,Singapore", "Fuel Surcharge", 20, "Remote Area", 15],
      ["3", "China", "Fuel Surcharge", 20, "Remote Area", 15],
      ["4", "Australia,New Zealand", "Fuel Surcharge", 25, "Remote Area", 20],
      ["5", "United States,Canada", "Fuel Surcharge", 30, "Remote Area", 25],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Zones")
    XLSX.writeFile(wb, "zones_template.xlsx")
  }

  const downloadCurrentRates = () => {
    if (!rate || !rate.rates) return

    const wb = XLSX.utils.book_new()

    // Get all unique zones from the rates data
    const zones = new Set()
    rate.rates.forEach((rateItem) => {
      Object.keys(rateItem).forEach((key) => {
        if (key !== "kg") {
          zones.add(key)
        }
      })
    })

    const sortedZones = Array.from(zones).sort()
    const headers = ["kg", ...sortedZones]

    // Create the data array
    const wsData = [headers]

    rate.rates.forEach((rateItem) => {
      const row = [rateItem.kg]
      sortedZones.forEach((zone) => {
        row.push(rateItem[zone] || "")
      })
      wsData.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Rates")
    XLSX.writeFile(wb, `${rate.originalName}_rates.xlsx`)
  }

  const downloadCurrentZones = () => {
    if (!rate || !rate.zones) return

    const wb = XLSX.utils.book_new()

    // Create headers - start with Zone and Countries, then add charge columns
    const maxCharges = Math.max(...rate.zones.map((zone) => Object.keys(zone.extraCharges || {}).length))
    const headers = ["Zone", "Countries"]

    // Add charge name/value pairs
    for (let i = 0; i < maxCharges; i++) {
      headers.push(`Charge Name ${i + 1}`, `Charge Value ${i + 1}`)
    }

    const wsData = [headers]

    rate.zones.forEach((zone) => {
      const row = [zone.zone, Array.isArray(zone.countries) ? zone.countries.join(",") : zone.countries]

      // Add extra charges
      const charges = Object.entries(zone.extraCharges || {})
      charges.forEach(([name, value]) => {
        row.push(name, value)
      })

      // Fill remaining charge columns with empty values
      while (row.length < headers.length) {
        row.push("")
      }

      wsData.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, "Zones")
    XLSX.writeFile(wb, `${rate.originalName}_zones.xlsx`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading rate details...</div>
      </div>
    )
  }

  if (!rate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Rate not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/rates/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Rate
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Rate</h1>
            <p className="text-muted-foreground">
              {rate.originalName} - {rate.service}
            </p>
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
            <CardTitle>Rate Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                {/* Use ?? '' to prevent uncontrolled -> controlled error */}
                <Input id="type" value={rate.type ?? ''} onChange={(e) => setRate({ ...rate, type: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="service">Service</Label>
                {/* Use ?? '' to prevent uncontrolled -> controlled error */}
                <Input
                  id="service"
                  value={rate.service ?? ''}
                  onChange={(e) => setRate({ ...rate, service: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="originalName">Original Name</Label>
                {/* Use ?? '' to prevent uncontrolled -> controlled error */}
                <Input
                  id="originalName"
                  value={rate.originalName ?? ''}
                  onChange={(e) => setRate({ ...rate, originalName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="covidCharges">Covid Charges</Label>
                {/* FIX: Corrected typo "covideCharges" to "covidCharges" and added ?? '' */}
                <Input
                  id="covidCharges"
                  value={rate.covidCharges ?? ''}
                  onChange={(e) => setRate({ ...rate, covidCharges: e.target.value })}
                  placeholder="Covid charges per kg"
                />
              </div>
              <div>
                <Label htmlFor="fuelCharges">Fuel Charges</Label>
                {/* Use ?? '' to prevent uncontrolled -> controlled error */}
                <Input
                  id="fuelCharges"
                  value={rate.fuelCharges ?? ''}
                  onChange={(e) => setRate({ ...rate, fuelCharges: e.target.value })}
                  placeholder="Fuel charges in percentage"
                />
              </div>
              <div>
                <Label htmlFor="awbCharges">AWB Charges</Label>
                {/* FIX: The specific input causing the error */}
                <Input
                  id="awbCharges"
                  value={rate.awbCharges ?? ''}
                  onChange={(e) => setRate({ ...rate, awbCharges: e.target.value })}
                  placeholder="AWB charges" // Updated placeholder for clarity
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="updateRates" checked={updateRates} onCheckedChange={setUpdateRates} />
                  <Label htmlFor="updateRates" className="font-medium">
                    Update Rates Data
                  </Label>
                </div>
                {updateRates && (
                  <div>
                    <Label htmlFor="ratesFile">Upload New Rates File</Label>
                    <div className="flex gap-2">
                      <Input id="ratesFile" type="file" accept=".xlsx,.xls" onChange={handleRatesFileChange} />
                      <Button type="button" variant="outline" onClick={downloadRatesTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Template
                      </Button>
                      <Button type="button" variant="outline" onClick={downloadCurrentRates}>
                        <Download className="w-4 h-4 mr-2" />
                        Current Data
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="updateZones" checked={updateZones} onCheckedChange={setUpdateZones} />
                  <Label htmlFor="updateZones" className="font-medium">
                    Update Zones Data
                  </Label>
                </div>
                {updateZones && (
                  <div>
                    <Label htmlFor="zonesFile">Upload New Zones File</Label>
                    <div className="flex gap-2">
                      <Input id="zonesFile" type="file" accept=".xlsx,.xls" onChange={handleZonesFileChange} />
                      <Button type="button" variant="outline" onClick={downloadZonesTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Template
                      </Button>
                      <Button type="button" variant="outline" onClick={downloadCurrentZones}>
                        <Download className="w-4 h-4 mr-2" />
                        Current Data
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {(ratesValidation || zonesValidation) && (
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={ratesValidation ? "rates" : "zones"} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rates" disabled={!ratesValidation}>
                    Rates Data
                  </TabsTrigger>
                  <TabsTrigger value="zones" disabled={!zonesValidation}>
                    Zones Data
                  </TabsTrigger>
                </TabsList>

                {ratesValidation && (
                  <TabsContent value="rates" className="space-y-4">
                    <div className="flex gap-4 mb-4">
                      <Badge variant="secondary" className="text-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        Accepted: {ratesValidation.accepted.length}
                      </Badge>
                      <Badge variant="secondary" className="text-red-600">
                        <X className="w-4 h-4 mr-1" />
                        Rejected: {ratesValidation.rejected.length}
                      </Badge>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Weight (kg)</TableHead>
                            {ratesValidation.headers.slice(1).map((header, index) => (
                              <TableHead key={index}>Zone {header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ratesValidation.rates.map((rate, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{rate.kg}</TableCell>
                              {Object.entries(rate)
                                .filter(([key]) => key !== "kg")
                                .map(([zone, amount], zoneIndex) => (
                                  <TableCell key={zoneIndex}>{amount}</TableCell>
                                ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {/* {ratesValidation.rates.length > 10 && (
                        <div className="p-3 text-sm text-muted-foreground border-t">
                          And {ratesValidation.rates.length - 10} more rates...
                        </div>
                      )} */}
                    </div>
                  </TabsContent>
                )}

                {zonesValidation && (
                  <TabsContent value="zones" className="space-y-4">
                    <div className="flex gap-4 mb-4">
                      <Badge variant="secondary" className="text-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        Accepted: {zonesValidation.accepted.length}
                      </Badge>
                      <Badge variant="secondary" className="text-red-600">
                        <X className="w-4 h-4 mr-1" />
                        Rejected: {zonesValidation.rejected.length}
                      </Badge>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Zone</TableHead>
                            <TableHead>Countries</TableHead>
                            <TableHead>Extra Charges</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {zonesValidation.zones.map((zone, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{zone.zone}</TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  {zone.countries.slice(0, 3).join(", ")}
                                  {zone.countries.length > 3 && ` +${zone.countries.length - 3} more`}
                                </div>
                              </TableCell>
                              <TableCell>
                                {Object.entries(zone.extraCharges).map(([name, value]) => (
                                  <Badge key={name} variant="outline" className="mr-1">
                                    {name}: {value}
                                  </Badge>
                                ))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
