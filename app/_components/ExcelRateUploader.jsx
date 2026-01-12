"use client"

import { useState, useRef } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import RatePreviewTable from "./RatePreviewTable"

export default function ExcelRateUploader({
    onRatesLoaded,
    rateMode = "multi-country",
    existingZones = [],
    isEditMode = false,
}) {
    const [baseRateMode, setBaseRateMode] = useState("baseRate")
    const [selectedFile, setSelectedFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [previewData, setPreviewData] = useState(null)
    const [uploadedRates, setUploadedRates] = useState([])
    const [uploadedZones, setUploadedZones] = useState([])
    const fileInputRef = useRef(null)

    const parseExcelFile = async (file) => {
        try {
            setLoading(true)
            const arrayBuffer = await file.arrayBuffer()
            const workbook = XLSX.read(arrayBuffer, { type: "array" })

            // Determine sheet names
            const ratesSheetName = "Rates"
            const zonesSheetName = rateMode === "single-country-zip" ? "Postal Zones" : null

            // For single-country-zip mode, try to find postal zones sheet
            if (rateMode === "single-country-zip" && workbook.SheetNames.includes("Postal Zones")) {
                const zonesSheet = workbook.Sheets["Postal Zones"]
                const zonesData = XLSX.utils.sheet_to_json(zonesSheet)

                // Parse postal zones
                const zones = zonesData.map((row) => ({
                    zoneName: row["Zone Name"] || row["Zone"],
                    postalCodes: (row["Postal Codes"] || "").split(",").map((p) => p.trim()),
                    originalInput: row["Postal Codes"] || "",
                    searchMode: row["Search Mode"] || "exact",
                }))

                setUploadedZones(zones)
            }

            // Parse rates sheet
            const ratesSheet = workbook.Sheets[ratesSheetName]
            const ratesData = XLSX.utils.sheet_to_json(ratesSheet)

            if (ratesData.length === 0) {
                toast({
                    title: "Error",
                    description: "No rates data found in Excel file.",
                    variant: "destructive",
                })
                return
            }

            // Validate and format rates
            const formattedRates = ratesData.map((row) => {
                const kg = Number.parseFloat(row["Weight (kg)"] || row["kg"] || row["Weight"])
                if (isNaN(kg)) return null

                const formattedRow = { kg }

                // Get zone columns (all columns except Weight)
                Object.keys(row).forEach((key) => {
                    if (!["Weight (kg)", "kg", "Weight"].includes(key) && key) {
                        const value = Number.parseFloat(row[key])

                        // If in perKg mode during upload, convert to base rate if baseRate mode is selected
                        if (baseRateMode === "baseRate" && !isNaN(value)) {
                            // Assume uploaded values are per kg, multiply by weight to get base rate
                            formattedRow[key] = value * kg
                        } else if (!isNaN(value)) {
                            formattedRow[key] = value
                        }
                    }
                })

                return formattedRow
            })

            const validRates = formattedRates.filter((r) => r !== null)

            if (validRates.length === 0) {
                toast({
                    title: "Error",
                    description: "No valid rates found in Excel file.",
                    variant: "destructive",
                })
                return
            }

            setUploadedRates(validRates)

            // Detect zones from headers
            const zoneHeaders = Object.keys(ratesData[0]).filter((key) => !["Weight (kg)", "kg", "Weight"].includes(key))

            const detectedZones = zoneHeaders.map((header) => ({
                zoneName: header,
                countries: rateMode === "multi-country" ? [] : [],
            }))

            setUploadedZones((prev) => (prev.length > 0 ? prev : detectedZones))
            setPreviewData({ rates: validRates, zones: detectedZones })

            toast({
                title: "Success",
                description: `Loaded ${validRates.length} rates from Excel file.`,
            })
        } catch (error) {
            console.error("Error parsing Excel:", error)
            toast({
                title: "Error",
                description: "Failed to parse Excel file. Please check the format.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            parseExcelFile(file)
        }
    }

    const handleConfirmUpload = () => {
        if (uploadedRates.length === 0) {
            toast({
                title: "Error",
                description: "No rates to upload.",
                variant: "destructive",
            })
            return
        }

        onRatesLoaded({
            rates: uploadedRates,
            zones: uploadedZones.length > 0 ? uploadedZones : existingZones,
            baseRateMode,
        })

        setSelectedFile(null)
        setUploadedRates([])
        setUploadedZones([])
        setPreviewData(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }

        toast({
            title: "Success",
            description: "Rates imported successfully.",
        })
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Excel File Upload</CardTitle>
                    <CardDescription>
                        Upload rates from an Excel file. Use "Weight (kg)" column for weights and zone names for rate columns.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="baseRateMode">Rate Format in Excel</Label>
                        <Select value={baseRateMode} onValueChange={setBaseRateMode} disabled={uploadedRates.length > 0}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="baseRate">Base Rate (total per weight)</SelectItem>
                                <SelectItem value="perKg">Per Kg (will be shown as-is)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {baseRateMode === "baseRate"
                                ? "Excel contains total rates (multiplied by weight). Each row shows final rate."
                                : "Excel contains per-kg rates. Will be multiplied by weight for base rate display."}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="excelFile">Select Excel File</Label>
                        {/* Temporarily replace shadcn Input with native input */}
                        <input
                            id="excelFile"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            disabled={loading}
                            ref={fileInputRef} // Pass ref to native input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" // You can copy some shadcn styles for visual consistency
                        />
                    </div>

                    {uploadedRates.length > 0 && (
                        <Alert>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle>File Loaded Successfully</AlertTitle>
                            <AlertDescription>{uploadedRates.length} rates ready to import.</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {previewData && uploadedRates.length > 0 && (
                <>
                    <RatePreviewTable
                        rates={uploadedRates}
                        zones={uploadedZones.length > 0 ? uploadedZones : previewData.zones}
                        rateMode={rateMode}
                        baseRateMode={baseRateMode}
                    />

                    <div className="flex gap-2">
                        <Button onClick={handleConfirmUpload} disabled={loading} className="flex-1">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Confirm & Import Rates
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedFile(null)
                                setUploadedRates([])
                                setUploadedZones([])
                                setPreviewData(null)
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = ""
                                }
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
