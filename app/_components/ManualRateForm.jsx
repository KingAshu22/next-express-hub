"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Trash2, Info, Calculator, TrendingUp, MapPin, Globe, AlertCircle } from "lucide-react"
import { Countries as countryList } from "@/app/constants/country"
import { MultiSelect } from "./MultiSelect"
import { toast } from "@/hooks/use-toast"

const chargeTypeLabels = {
  percentage: "Percentage (%)",
  perKg: "Per Kg (₹)",
  oneTime: "One Time (₹)",
}

// Helper function to expand ZIP code ranges
function expandZipCodes(zipString) {
  if (!zipString || zipString.trim() === "") return []
  
  const zipCodes = []
  const parts = zipString.split(",").map((p) => p.trim()).filter(Boolean)

  parts.forEach((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((p) => p.trim())
      const startNum = parseInt(start, 10)
      const endNum = parseInt(end, 10)

      if (!isNaN(startNum) && !isNaN(endNum) && startNum <= endNum) {
        // Limit range expansion to prevent memory issues
        const rangeSize = endNum - startNum + 1
        if (rangeSize > 10000) {
          // For very large ranges, store as range instead of expanding
          zipCodes.push({ zipFrom: start, zipTo: end })
        } else {
          for (let i = startNum; i <= endNum; i++) {
            const paddedZip = String(i).padStart(start.length, "0")
            zipCodes.push(paddedZip)
          }
        }
      } else if (start && end) {
        // Alphanumeric range - store as range
        zipCodes.push({ zipFrom: start, zipTo: end })
      }
    } else if (part) {
      zipCodes.push(part)
    }
  })

  return zipCodes
}

// Compress ZIP codes back to ranges for display
function compressZipCodes(zipEntries) {
  if (!zipEntries || zipEntries.length === 0) return ""
  
  // Handle mixed array of strings and range objects
  const individualZips = []
  const ranges = []
  
  zipEntries.forEach(entry => {
    if (typeof entry === 'object' && entry.zipFrom && entry.zipTo) {
      ranges.push(`${entry.zipFrom}-${entry.zipTo}`)
    } else if (typeof entry === 'string') {
      individualZips.push(entry)
    }
  })
  
  // Sort individual zips
  const sorted = [...individualZips].sort((a, b) => {
    const numA = parseInt(a, 10)
    const numB = parseInt(b, 10)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    return a.localeCompare(b)
  })

  const compressedRanges = []
  if (sorted.length > 0) {
    let rangeStart = sorted[0]
    let rangeEnd = sorted[0]

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]
      const prev = sorted[i - 1]
      const currentNum = parseInt(current, 10)
      const prevNum = parseInt(prev, 10)

      if (!isNaN(currentNum) && !isNaN(prevNum) && currentNum === prevNum + 1) {
        rangeEnd = current
      } else {
        if (rangeStart === rangeEnd) {
          compressedRanges.push(rangeStart)
        } else {
          compressedRanges.push(`${rangeStart}-${rangeEnd}`)
        }
        rangeStart = current
        rangeEnd = current
      }
    }

    // Don't forget the last range
    if (rangeStart === rangeEnd) {
      compressedRanges.push(rangeStart)
    } else {
      compressedRanges.push(`${rangeStart}-${rangeEnd}`)
    }
  }

  return [...compressedRanges, ...ranges].join(", ")
}

// Count total ZIP codes (including expanded ranges)
function countZipCodes(zipString) {
  const expanded = expandZipCodes(zipString)
  let count = 0
  expanded.forEach(zip => {
    if (typeof zip === 'object') {
      const start = parseInt(zip.zipFrom, 10)
      const end = parseInt(zip.zipTo, 10)
      if (!isNaN(start) && !isNaN(end)) {
        count += (end - start + 1)
      } else {
        count += 1 // Count alphanumeric range as 1
      }
    } else {
      count += 1
    }
  })
  return count
}

export default function ManualRateForm({
  onDataGenerated,
  initialData = null,
  isReadOnlyZones = false,
  rateMode = "multi-country",
  targetCountry = "",
}) {
  const formattedCountries = useMemo(
    () =>
      countryList
        .map((country) => ({
          value: country,
          label: country,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    []
  )

  // Common state
  const [zones, setZones] = useState([{ zoneName: "1", countries: [], zipCodes: "", extraCharges: [] }])
  const [weightRanges, setWeightRanges] = useState([{ start: "", end: "", step: 0.5, rates: {} }])
  const [generatedRates, setGeneratedRates] = useState([])
  const [generatedPostalZones, setGeneratedPostalZones] = useState([])
  const [showBaseRate, setShowBaseRate] = useState(false)

  // Markup state
  const [markup, setMarkup] = useState({ type: "percentage", value: 0 })
  const baseWeightRangesRef = useRef(null)

  const initialDataProcessedRef = useRef(false)

  // Reset zones when rate mode changes
  useEffect(() => {
    if (!initialData) {
      setZones([{ zoneName: "1", countries: [], zipCodes: "", extraCharges: [] }])
      setGeneratedRates([])
      setGeneratedPostalZones([])
    }
  }, [rateMode])

  useEffect(() => {
    if (!initialData || initialDataProcessedRef.current) return
    initialDataProcessedRef.current = true

    if (initialData.rates && initialData.rates.length > 0) {
      let initialZones = []

      if (rateMode === "multi-country" && initialData.zones && initialData.zones.length > 0) {
        initialZones = initialData.zones.map((z) => ({
          zoneName: z.zone,
          countries: z.countries || [],
          zipCodes: "",
          extraCharges: z.extraCharges || {},
        }))
      } else if (rateMode === "single-country-zip" && initialData.postalZones && initialData.postalZones.length > 0) {
        // Group postal zones by zone name
        const zoneMap = new Map()
        initialData.postalZones.forEach((pz) => {
          if (!zoneMap.has(pz.zone)) {
            zoneMap.set(pz.zone, { zipCodes: [], extraCharges: pz.extraCharges || {} })
          }
          if (pz.zipCode) {
            zoneMap.get(pz.zone).zipCodes.push(pz.zipCode)
          } else if (pz.zipFrom && pz.zipTo) {
            zoneMap.get(pz.zone).zipCodes.push({ zipFrom: pz.zipFrom, zipTo: pz.zipTo })
          }
        })

        zoneMap.forEach((data, zoneName) => {
          initialZones.push({
            zoneName,
            countries: [],
            zipCodes: compressZipCodes(data.zipCodes),
            extraCharges: data.extraCharges,
          })
        })
      }

      if (initialZones.length === 0) {
        initialZones = [{ zoneName: "1", countries: [], zipCodes: "", extraCharges: [] }]
      }

      setZones(initialZones)

      // Reconstruct weight ranges from rates
      const rateGroups = new Map()
      initialData.rates.forEach((rateEntry) => {
        const perKgRates = {}
        let ratesKey = ""
        initialZones.forEach((zone) => {
          const rateValue = rateEntry[zone.zoneName]
          if (rateValue !== undefined && rateEntry.kg > 0) {
            const perKgRate = (rateValue / rateEntry.kg).toFixed(4)
            perKgRates[zone.zoneName] = perKgRate
            ratesKey += `${zone.zoneName}:${perKgRate}|`
          }
        })

        if (ratesKey && !rateGroups.has(ratesKey)) {
          rateGroups.set(ratesKey, { weights: [], perKgRates })
        }
        if (ratesKey) {
          rateGroups.get(ratesKey).weights.push(rateEntry.kg)
        }
      })

      const reconstructedRanges = []
      rateGroups.forEach((group) => {
        const sortedWeights = group.weights.sort((a, b) => a - b)
        const rangeRates = {}
        initialZones.forEach((zone) => {
          rangeRates[zone.zoneName] = Number.parseFloat(group.perKgRates[zone.zoneName] || 0)
        })

        reconstructedRanges.push({
          start: sortedWeights[0],
          end: sortedWeights[sortedWeights.length - 1],
          step: sortedWeights.length > 1 ? Number((sortedWeights[1] - sortedWeights[0]).toFixed(2)) : 0.5,
          rates: rangeRates,
        })
      })

      if (reconstructedRanges.length > 0) {
        setWeightRanges(reconstructedRanges)
        baseWeightRangesRef.current = JSON.parse(JSON.stringify(reconstructedRanges))
        setTimeout(() => generateRateTable(reconstructedRanges, initialZones), 100)
      }
    }
  }, [initialData, rateMode])

  // Apply markup logic
  useEffect(() => {
    if (!baseWeightRangesRef.current) return

    const markupVal = Number(markup.value) || 0
    if (markupVal === 0) {
      setWeightRanges(JSON.parse(JSON.stringify(baseWeightRangesRef.current)))
      return
    }

    const newRanges = baseWeightRangesRef.current.map((range) => {
      const updatedRates = { ...range.rates }
      Object.keys(updatedRates).forEach((zone) => {
        const originalPrice = Number(updatedRates[zone]) || 0
        if (markup.type === "percentage") {
          updatedRates[zone] = Number((originalPrice * (1 + markupVal / 100)).toFixed(2))
        } else {
          updatedRates[zone] = Number((originalPrice + markupVal).toFixed(2))
        }
      })
      return { ...range, rates: updatedRates }
    })

    setWeightRanges(newRanges)
  }, [markup])

  const generateRateTable = (rangesToUse = weightRanges, zonesToUse = zones) => {
    // Validate inputs
    const hasValidRanges = rangesToUse.some(range => {
      const start = Number.parseFloat(range.start)
      const step = Number.parseFloat(range.step)
      return !isNaN(start) && !isNaN(step) && step > 0
    })

    if (!hasValidRanges) {
      toast({
        title: "Invalid Weight Ranges",
        description: "Please enter valid start weight and step values.",
        variant: "destructive",
      })
      return
    }

    // Validate zones for single-country-zip mode
    if (rateMode === "single-country-zip") {
      const hasZipCodes = zonesToUse.some(zone => zone.zipCodes && zone.zipCodes.trim() !== "")
      if (!hasZipCodes) {
        toast({
          title: "Missing ZIP Codes",
          description: "Please enter ZIP codes for at least one zone.",
          variant: "destructive",
        })
        return
      }
    }

    const allRates = []
    rangesToUse.forEach((range) => {
      const start = Number.parseFloat(range.start)
      const end = range.end ? Number.parseFloat(range.end) : start
      const step = Number.parseFloat(range.step)

      if (isNaN(start) || isNaN(step) || step <= 0) {
        return
      }

      for (let kg = start; kg <= end + 0.001; kg = Number.parseFloat((kg + step).toFixed(2))) {
        const rateEntry = { kg }
        zonesToUse.forEach((zone) => {
          const rateValue = Number.parseFloat(range.rates[zone.zoneName]) || 0
          rateEntry[zone.zoneName] = rateValue
        })
        allRates.push(rateEntry)
      }
    })

    if (allRates.length === 0) {
      toast({
        title: "No Rates Generated",
        description: "Please check your weight range settings.",
        variant: "destructive",
      })
      return
    }

    setGeneratedRates(allRates)

    // Build final zone structures
    let finalZones = []
    let finalPostalZones = []

    if (rateMode === "multi-country") {
      finalZones = zonesToUse.map((z) => ({
        zone: z.zoneName,
        countries: z.countries || [],
        extraCharges: z.extraCharges || {},
      }))
    } else {
      // Build postal zones from ZIP codes
      zonesToUse.forEach((zone) => {
        if (!zone.zipCodes || zone.zipCodes.trim() === "") return
        
        const expandedZips = expandZipCodes(zone.zipCodes)
        console.log(`Zone ${zone.zoneName} expanded ZIPs:`, expandedZips) // Debug log
        
        expandedZips.forEach((zip) => {
          if (typeof zip === "object" && zip.zipFrom && zip.zipTo) {
            finalPostalZones.push({
              country: targetCountry,
              zone: zone.zoneName,
              zipCode: null,
              zipFrom: zip.zipFrom,
              zipTo: zip.zipTo,
              extraCharges: zone.extraCharges || {},
            })
          } else if (typeof zip === "string" && zip.trim()) {
            finalPostalZones.push({
              country: targetCountry,
              zone: zone.zoneName,
              zipCode: zip,
              zipFrom: null,
              zipTo: null,
              extraCharges: zone.extraCharges || {},
            })
          }
        })
      })
    }

    setGeneratedPostalZones(finalPostalZones)

    // Debug logging
    console.log("Generated Data:", {
      rates: allRates.length,
      zones: finalZones.length,
      postalZones: finalPostalZones.length,
      rateMode,
      targetCountry,
    })

    onDataGenerated({
      rates: allRates,
      zones: finalZones,
      postalZones: finalPostalZones,
    })

    toast({
      title: "Rate Table Generated",
      description: rateMode === "multi-country" 
        ? `Generated ${allRates.length} rates for ${finalZones.length} zones.`
        : `Generated ${allRates.length} rates with ${finalPostalZones.length} ZIP code entries.`,
    })
  }

  // Handlers
  const handleWeightRangeChange = (index, field, value) => {
    const newRanges = [...weightRanges]
    newRanges[index][field] = value
    setWeightRanges(newRanges)
  }

  const handleRateChange = (rangeIndex, zoneName, value) => {
    const newRanges = [...weightRanges]
    newRanges[rangeIndex].rates[zoneName] = value
    setWeightRanges(newRanges)
  }

  const addWeightRange = () => {
    const newRates = {}
    zones.forEach((zone) => {
      newRates[zone.zoneName] = ""
    })
    setWeightRanges([...weightRanges, { start: "", end: "", step: 0.5, rates: newRates }])
  }

  const removeWeightRange = (index) => {
    if (weightRanges.length > 1) {
      setWeightRanges(weightRanges.filter((_, i) => i !== index))
    }
  }

  const addZone = () => {
    const newZoneName = (zones.length + 1).toString()
    setZones([...zones, { zoneName: newZoneName, countries: [], zipCodes: "", extraCharges: [] }])
    setWeightRanges(
      weightRanges.map((range) => ({
        ...range,
        rates: { ...range.rates, [newZoneName]: "" },
      }))
    )
  }

  const removeZone = (index) => {
    if (zones.length > 1) {
      const zoneNameToRemove = zones[index].zoneName
      setZones(zones.filter((_, i) => i !== index))
      setWeightRanges(
        weightRanges.map((range) => {
          const newRates = { ...range.rates }
          delete newRates[zoneNameToRemove]
          return { ...range, rates: newRates }
        })
      )
    }
  }

  const handleZoneCountriesChange = (index, selected) => {
    const newZones = [...zones]
    newZones[index].countries = selected
    setZones(newZones)
  }

  const handleZoneZipCodesChange = (index, value) => {
    const newZones = [...zones]
    newZones[index].zipCodes = value
    setZones(newZones)
  }

  const isWeightRangesEditable = !initialData

  // Calculate ZIP code stats for display
  const getZipCodeStats = (zipString) => {
    const count = countZipCodes(zipString)
    return count
  }

  return (
    <div className="space-y-8">
      {/* Markup Section - Only show when editing from purchase rate */}
      {initialData && (
        <div className="p-4 border-2 border-primary/20 bg-primary/5 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <TrendingUp className="w-5 h-5" />
            <h3>Profit Markup (Applying to Purchase Rates)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-3">
              <Label>Markup Type</Label>
              <RadioGroup
                defaultValue="percentage"
                className="flex gap-4"
                onValueChange={(val) => setMarkup({ ...markup, type: val })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="m1" />
                  <Label htmlFor="m1">Percentage (%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="m2" />
                  <Label htmlFor="m2">Fixed Amount (₹)</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Value to Add</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder={markup.type === "percentage" ? "e.g. 10" : "e.g. 50"}
                  value={markup.value}
                  onChange={(e) => setMarkup({ ...markup, value: e.target.value })}
                  className="pl-8"
                />
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  {markup.type === "percentage" ? "%" : "₹"}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">
            * This will automatically increase the "Per Kg" rates in the sections below.
          </p>
        </div>
      )}

      {/* Zone Information Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {rateMode === "multi-country" ? (
              <Globe className="w-5 h-5 text-muted-foreground" />
            ) : (
              <MapPin className="w-5 h-5 text-muted-foreground" />
            )}
            <h3 className="text-lg font-semibold">
              1. Zone Information {isReadOnlyZones && "(Read-Only)"}
            </h3>
          </div>
          {!isReadOnlyZones && (
            <Button type="button" variant="outline" size="sm" onClick={addZone}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Zone
            </Button>
          )}
        </div>

        {rateMode === "single-country-zip" && (
          <Alert className={targetCountry ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-amber-500 bg-amber-50 dark:bg-amber-950/30"}>
            {targetCountry ? (
              <>
                <MapPin className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Defining ZIP code zones for <strong>{targetCountry}</strong>. Enter ZIP codes separated by commas or use
                  ranges (e.g., 2000, 2001, 2005-2010).
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Please select a target country first before defining ZIP code zones.
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        {zones.map((zone, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_auto] gap-4 items-start">
              <div>
                <Label>Zone</Label>
                <Input value={zone.zoneName} disabled className="font-semibold text-center" />
              </div>

              {rateMode === "multi-country" ? (
                <div>
                  <Label>Countries</Label>
                  <MultiSelect
                    options={formattedCountries}
                    selected={zone.countries}
                    disabled={isReadOnlyZones}
                    onChange={(selected) => handleZoneCountriesChange(index, selected)}
                    placeholder="Select countries for this zone..."
                  />
                  {zone.countries.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {zone.countries.length} countries selected
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>ZIP Codes</Label>
                    {zone.zipCodes && zone.zipCodes.trim() && (
                      <Badge variant="secondary" className="text-xs">
                        ~{getZipCodeStats(zone.zipCodes)} codes
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    placeholder="Enter ZIP codes (e.g., 2000, 2001, 2005-2010, 2015-2020)"
                    value={zone.zipCodes}
                    onChange={(e) => handleZoneZipCodesChange(index, e.target.value)}
                    disabled={isReadOnlyZones || !targetCountry}
                    rows={3}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate with commas. Use ranges like 2005-2010 for consecutive codes.
                  </p>
                </div>
              )}

              {!isReadOnlyZones && zones.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  onClick={() => removeZone(index)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Zone Summary */}
        {rateMode === "single-country-zip" && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Zone Summary</h4>
            <div className="flex flex-wrap gap-2">
              {zones.map((zone, index) => {
                const count = zone.zipCodes ? getZipCodeStats(zone.zipCodes) : 0
                return (
                  <Badge 
                    key={index} 
                    variant={count > 0 ? "default" : "outline"}
                    className={count > 0 ? "" : "text-muted-foreground"}
                  >
                    Zone {zone.zoneName}: {count > 0 ? `${count} ZIPs` : "No ZIPs"}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Weight Ranges & Rates Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">2. Set Weight Ranges & Rates (per kg)</h3>
          {isWeightRangesEditable && (
            <Button type="button" variant="outline" size="sm" onClick={addWeightRange}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Weight Range
            </Button>
          )}
        </div>

        {!isWeightRangesEditable && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Weight ranges are pre-filled from the linked purchase rate. You can only modify the per-kg rates using the
              markup above.
            </AlertDescription>
          </Alert>
        )}

        {weightRanges.map((range, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4 relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
              <div>
                <Label>Start Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g., 0.5"
                  value={range.start}
                  disabled={!isWeightRangesEditable}
                  onChange={(e) => handleWeightRangeChange(index, "start", e.target.value)}
                />
              </div>
              <div>
                <Label>End Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g., 10"
                  value={range.end}
                  disabled={!isWeightRangesEditable}
                  onChange={(e) => handleWeightRangeChange(index, "end", e.target.value)}
                />
              </div>
              <div>
                <Label>Step Up (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="e.g., 0.5"
                  value={range.step}
                  disabled={!isWeightRangesEditable}
                  onChange={(e) => handleWeightRangeChange(index, "step", e.target.value)}
                />
              </div>
              {isWeightRangesEditable && weightRanges.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeWeightRange(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {zones.map((zone) => (
                <div key={zone.zoneName}>
                  <Label className="text-xs">Zone {zone.zoneName} (₹/kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={range.rates[zone.zoneName] || ""}
                    onChange={(e) => handleRateChange(index, zone.zoneName, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          type="button" 
          onClick={() => generateRateTable()}
          disabled={rateMode === "single-country-zip" && !targetCountry}
        >
          <Calculator className="mr-2 h-4 w-4" />
          {generatedRates.length > 0 ? "Update Preview Table" : "Generate Rate Table"}
        </Button>
      </div>

      {/* Preview Table Section */}
      {generatedRates.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">3. Preview Rate Table</h3>
            <div className="flex items-center space-x-2">
              <Label htmlFor="rate-toggle">Show Total Price</Label>
              <Switch id="rate-toggle" checked={showBaseRate} onCheckedChange={setShowBaseRate} />
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <p className="text-2xl font-bold">{generatedRates.length}</p>
              <p className="text-xs text-muted-foreground">Weight Entries</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-2xl font-bold">{zones.length}</p>
              <p className="text-xs text-muted-foreground">Zones</p>
            </div>
            {rateMode === "single-country-zip" && (
              <>
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-2xl font-bold">{generatedPostalZones.length}</p>
                  <p className="text-xs text-muted-foreground">ZIP Entries</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{targetCountry}</p>
                  <p className="text-xs text-muted-foreground">Country</p>
                </div>
              </>
            )}
            {rateMode === "multi-country" && (
              <div className="p-3 border rounded-lg text-center">
                <p className="text-2xl font-bold">
                  {zones.reduce((acc, z) => acc + (z.countries?.length || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Countries</p>
              </div>
            )}
          </div>

          <div className="border rounded-lg overflow-x-auto max-h-96">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Weight (kg)</TableHead>
                  {zones.map((z) => (
                    <TableHead key={z.zoneName}>Zone {z.zoneName}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedRates.map((rate, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{rate.kg}</TableCell>
                    {zones.map((z) => (
                      <TableCell key={z.zoneName}>
                        ₹{(showBaseRate ? rate[z.zoneName] * rate.kg : rate[z.zoneName]).toFixed(2)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Postal Zones Preview */}
          {rateMode === "single-country-zip" && generatedPostalZones.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Generated Postal Zones Preview</h4>
              <div className="border rounded-lg p-3 bg-muted/30 max-h-48 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {zones.map((zone) => {
                    const zonePostalCodes = generatedPostalZones.filter(pz => pz.zone === zone.zoneName)
                    return (
                      <div key={zone.zoneName} className="p-2 border rounded bg-background">
                        <p className="font-semibold">Zone {zone.zoneName}</p>
                        <p className="text-muted-foreground">
                          {zonePostalCodes.length} entries for {targetCountry}
                        </p>
                        <p className="text-muted-foreground truncate">
                          {zonePostalCodes.slice(0, 5).map(pz => 
                            pz.zipCode || `${pz.zipFrom}-${pz.zipTo}`
                          ).join(", ")}
                          {zonePostalCodes.length > 5 && "..."}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {rateMode === "multi-country" 
              ? `Generated ${generatedRates.length} rate entries across ${zones.length} zone(s)`
              : `Generated ${generatedRates.length} rate entries with ${generatedPostalZones.length} ZIP code entries for ${targetCountry}`
            }
          </p>
        </div>
      )}
    </div>
  )
}