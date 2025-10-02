"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import * as XLSX from "xlsx"
import {
  Button,
} from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ArrowLeft, Upload, Download, Check, X } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function UpdateRatePage() {
  const router = useRouter()
  const { code } = useParams()

  const [ratesFile, setRatesFile] = useState(null)
  const [zonesFile, setZonesFile] = useState(null)
  const [rateData, setRateData] = useState({
    type: "",
    service: "",
    originalName: "",
    covidCharges: "",
    fuelCharges: "",
  })
  const [ratesValidation, setRatesValidation] = useState(null)
  const [zonesValidation, setZonesValidation] = useState(null)
  const [uploading, setUploading] = useState(false)

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
          rejected.push({ row: i + 1, data: row, reason: "Missing zone or countries" })
          continue
        }

        const countries = countriesStr
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c)

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
        rates: ratesValidation.rates,
        zones: zonesValidation.zones,
      }

      const response = await fetch(`/api/franchise/${code}/update-rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Rate uploaded successfully",
        })
        router.push(`/franchise/${code}/rates`)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to upload rate",
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/franchise/${code}/rates`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rates
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Upload New Rate</h1>
          <p className="text-muted-foreground">
            Upload Excel files with rate and zone data
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rate Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Type</Label>
                <Input
                  value={rateData.type}
                  onChange={(e) => setRateData({ ...rateData, type: e.target.value })}
                  placeholder="e.g., dhl, fedex, ups"
                  required
                />
              </div>
              <div>
                <Label>Service</Label>
                <Input
                  value={rateData.service}
                  onChange={(e) => setRateData({ ...rateData, service: e.target.value })}
                  placeholder="e.g., SUNEX-D"
                  required
                />
              </div>
              <div>
                <Label>Original Name</Label>
                <Input
                  value={rateData.originalName}
                  onChange={(e) => setRateData({ ...rateData, originalName: e.target.value })}
                  placeholder="e.g., DHL"
                  required
                />
              </div>
              <div>
                <Label>Covid Charges</Label>
                <Input
                  value={rateData.covidCharges}
                  onChange={(e) => setRateData({ ...rateData, covidCharges: e.target.value })}
                  placeholder="Covid charges per kg"
                  required
                />
              </div>
              <div>
                <Label>Fuel Charges</Label>
                <Input
                  value={rateData.fuelCharges}
                  onChange={(e) => setRateData({ ...rateData, fuelCharges: e.target.value })}
                  placeholder="Fuel charges in %"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Upload Rates File</Label>
                <Input type="file" accept=".xlsx,.xls" onChange={handleRatesFileChange} required />
              </div>
              <div>
                <Label>Upload Zones File</Label>
                <Input type="file" accept=".xlsx,.xls" onChange={handleZonesFileChange} required />
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
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="rates" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rates">Rates Data</TabsTrigger>
                <TabsTrigger value="zones">Zones Data</TabsTrigger>
              </TabsList>

              {/* Rates Validation */}
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
                          {ratesValidation.rates.slice(0, 10).map((rate, index) => (
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
                      {ratesValidation.rates.length > 10 && (
                        <div className="p-3 text-sm text-muted-foreground border-t">
                          And {ratesValidation.rates.length - 10} more rates...
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Zones Validation */}
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
                                {zone.countries.slice(0, 3).join(", ")}
                                {zone.countries.length > 3 &&
                                  ` +${zone.countries.length - 3} more`}
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
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
