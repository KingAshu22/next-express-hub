"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Upload, Download, Check, X, Calculator } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

export default function UploadRatePage() {
  const router = useRouter()
  const [ratesFile, setRatesFile] = useState(null)
  const [zonesFile, setZonesFile] = useState(null)
  const [rateData, setRateData] = useState({
    type: "",
    service: "",
    originalName: "",
    covidCharges: "",
    fuelCharges: "",
    rateType: "base", // Default to base rate
  })
  const [ratesValidation, setRatesValidation] = useState(null)
  const [zonesValidation, setZonesValidation] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleRatesFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setRatesFile(selectedFile)
      // Re-process file if rate type changes
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
    // Re-process rates file if it exists and rate type changes
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

      // Skip header row and process data
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

        // Process zone rates (columns 1 onwards)
        for (let j = 1; j < row.length; j++) {
          let rate = Number.parseFloat(row[j])
          if (!isNaN(rate) && rate > 0) {
            // If rate type is "per kg", multiply by weight to get base rate
            if (rateType === "perKg") {
              rate = rate * kg
            }
            rateEntry[j.toString()] = Number(rate.toFixed(2)) // Round to 2 decimal places
            hasValidRates = true
          }
        }

        if (hasValidRates) {
          ratesSection.push(rateEntry)
          accepted.push({
            row: i + 1,
            kg,
            zones: Object.keys(rateEntry).length - 1,
            rateType: rateType === "perKg" ? "Calculated from Per Kg" : "Base Rate",
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
        rateType: rateType,
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

        // Process extra charges (column 2 onwards)
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!ratesValidation || !zonesValidation || !rateData.type || !rateData.service || !rateData.originalName) {
      toast({
        title: "Error",
        description: "Please fill all fields and upload both rates and zones files",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const payload = {
        ...rateData,
        rates: ratesValidation.rates, // Already converted to base rates if needed
        zones: zonesValidation.zones,
        uploadedRateType: rateData.rateType, // Track what type was uploaded for reference
      }

      const response = await fetch("/api/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Rate uploaded successfully${rateData.rateType === "perKg" ? " (converted from per kg to base rate)" : ""}`,
        })
        router.push("/rates")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to upload rate",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading rate:", error)
      toast({
        title: "Error",
        description: "Failed to upload rate",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const downloadRatesTemplate = () => {
    const isPerKg = rateData.rateType === "perKg"
    const wb = XLSX.utils.book_new()
    
    // Adjust template values based on rate type
    const wsData = isPerKg ? [
      ["kg", "1", "2", "3", "4", "5"],
      [0.5, 2184, 2170, 2456, 2318, 2896], // These are per kg rates
      [1, 1315, 1296, 1491, 1297, 1784],
      [2, 768.5, 766.5, 875.5, 717, 1056.5],
      [3, 586.33, 590, 670.33, 523.67, 814],
      [4, 495.25, 501.75, 567.75, 427, 692.75],
      [5, 440.6, 448.8, 506.2, 369, 620],
    ] : [
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
    XLSX.writeFile(wb, `rates_template_${isPerKg ? "per_kg" : "base"}.xlsx`)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/rates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rates
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Upload New Rate</h1>
          <p className="text-muted-foreground">Upload Excel files with rate and zone data</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rate Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rate Type Selection */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Rate Type Selection
                </Label>
                <RadioGroup
                  value={rateData.rateType}
                  onValueChange={handleRateTypeChange}
                  className="flex flex-col space-y-2 mt-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="base" id="base" />
                    <Label htmlFor="base" className="font-normal cursor-pointer">
                      Base Rate (Default) - Rates are already final amounts
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="perKg" id="perKg" />
                    <Label htmlFor="perKg" className="font-normal cursor-pointer">
                      Rate per Kg - Rates will be multiplied by weight to calculate base rate
                    </Label>
                  </div>
                </RadioGroup>
                {rateData.rateType === "perKg" && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      ℹ️ Rates in the file will be multiplied by the corresponding weight (kg) to calculate the base rate before saving.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={rateData.type}
                    onChange={(e) => setRateData({ ...rateData, type: e.target.value })}
                    placeholder="e.g., dhl, fedex, ups"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Input
                    id="service"
                    value={rateData.service}
                    onChange={(e) => setRateData({ ...rateData, service: e.target.value })}
                    placeholder="e.g., SUNEX-D"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="originalName">Original Name</Label>
                  <Input
                    id="originalName"
                    value={rateData.originalName}
                    onChange={(e) => setRateData({ ...rateData, originalName: e.target.value })}
                    placeholder="e.g., DHL"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="covidCharges">Covid Charges</Label>
                  <Input
                    id="covidCharges"
                    value={rateData.covidCharges}
                    onChange={(e) => setRateData({ ...rateData, covidCharges: e.target.value })}
                    placeholder="Covid charges per kg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fuelCharges">Fuel Charges</Label>
                  <Input
                    id="fuelCharges"
                    value={rateData.fuelCharges}
                    onChange={(e) => setRateData({ ...rateData, fuelCharges: e.target.value })}
                    placeholder="Fuel charges in percentage"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ratesFile">
                    Upload Rates File {rateData.rateType === "perKg" && "(Per Kg Values)"}
                  </Label>
                  <div className="flex gap-2">
                    <Input id="ratesFile" type="file" accept=".xlsx,.xls" onChange={handleRatesFileChange} required />
                    <Button type="button" variant="outline" onClick={downloadRatesTemplate}>
                      <Download className="w-4 h-4 mr-2" />
                      Template
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="zonesFile">Upload Zones File</Label>
                  <div className="flex gap-2">
                    <Input id="zonesFile" type="file" accept=".xlsx,.xls" onChange={handleZonesFileChange} required />
                    <Button type="button" variant="outline" onClick={downloadZonesTemplate}>
                      <Download className="w-4 h-4 mr-2" />
                      Template
                    </Button>
                  </div>
                </div>
              </div>

              {ratesValidation && zonesValidation && (
                <Button type="submit" disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Rate"}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {(ratesValidation || zonesValidation) && (
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="rates" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rates">Rates Data</TabsTrigger>
                  <TabsTrigger value="zones">Zones Data</TabsTrigger>
                </TabsList>

                <TabsContent value="rates" className="space-y-4">
                  {ratesValidation && (
                    <>
                      <div className="flex gap-4 mb-4">
                        <Badge variant="secondary" className="text-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          Accepted: {ratesValidation.accepted.length}
                        </Badge>
                        <Badge variant="secondary" className="text-red-600">
                          <X className="w-4 h-4 mr-1" />
                          Rejected: {ratesValidation.rejected.length}
                        </Badge>
                        {ratesValidation.rateType === "perKg" && (
                          <Badge variant="secondary" className="text-blue-600">
                            <Calculator className="w-4 h-4 mr-1" />
                            Converted from Per Kg to Base Rate
                          </Badge>
                        )}
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Weight (kg)</TableHead>
                              {ratesValidation.headers.slice(1).map((header, index) => (
                                <TableHead key={index}>
                                  Zone {header}
                                  {ratesValidation.rateType === "perKg" && (
                                    <span className="text-xs block text-muted-foreground">
                                      (Base Rate)
                                    </span>
                                  )}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ratesValidation.rates.slice(0, 10).map((rate, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{rate.kg}</TableCell>
                                {Object.entries(rate)
                                  .filter(([key]) => key !== "kg")
                                  .map(([zone, amount], zoneIndex) => (
                                    <TableCell key={zoneIndex}>
                                      {amount}
                                      {ratesValidation.rateType === "perKg" && (
                                        <span className="text-xs text-muted-foreground block">
                                          ({(amount / rate.kg).toFixed(2)}/kg)
                                        </span>
                                      )}
                                    </TableCell>
                                  ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {ratesValidation.rates.length > 10 && (
                          <div className="p-3 text-sm text-muted-foreground border-t">
                            And {ratesValidation.rates.length - 10} more rates...
                          </div>
                        )}
                      </div>

                      {ratesValidation.rejected.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-red-600">Rejected Entries:</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Row</TableHead>
                                <TableHead>Reason</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ratesValidation.rejected.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.row}</TableCell>
                                  <TableCell className="text-red-600">{item.reason}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="zones" className="space-y-4">
                  {zonesValidation && (
                    <>
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

                      {zonesValidation.rejected.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-red-600">Rejected Entries:</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Row</TableHead>
                                <TableHead>Reason</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {zonesValidation.rejected.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.row}</TableCell>
                                  <TableCell className="text-red-600">{item.reason}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </>
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