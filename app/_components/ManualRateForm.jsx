"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PlusCircle, Trash2, Info, Calculator, X, AlertTriangle, TrendingUp } from "lucide-react"
import { Countries as countryList } from "@/app/constants/country"
import { MultiSelect } from "./MultiSelect"
import { toast } from "@/hooks/use-toast"

const chargeTypeLabels = {
  percentage: "Percentage (%)",
  perKg: "Per Kg (₹)",
  oneTime: "One Time (₹)",
}

export default function ManualRateForm({ onDataGenerated, initialData = null, isReadOnlyZones = false }) {
  const formattedCountries = useMemo(
    () =>
      countryList
        .map((country) => ({
          value: country,
          label: country,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [],
  )

  const [zones, setZones] = useState([{ zoneName: "1", countries: [], extraCharges: [] }])
  const [weightRanges, setWeightRanges] = useState([{ start: "", end: "", step: 0.5, rates: {} }])
  const [generatedRates, setGeneratedRates] = useState([])
  const [showBaseRate, setShowBaseRate] = useState(false)
  const [isDataLoadedWithWarning, setIsDataLoadedWithWarning] = useState(false)

  // --- MARKUP STATE ---
  const [markup, setMarkup] = useState({ type: "percentage", value: 0 })
  const baseWeightRangesRef = useRef(null) // Stores original purchase rates before markup

  const [isZoneChargeDialogOpen, setIsZoneChargeDialogOpen] = useState(false)
  const [editingZoneIndex, setEditingZoneIndex] = useState(null)
  const [newZoneCharge, setNewZoneCharge] = useState({ chargeName: "", chargeType: "perKg", chargeValue: "" })

  const initialDataProcessedRef = useRef(false)

  useEffect(() => {
    if (!initialData || initialDataProcessedRef.current) return
    initialDataProcessedRef.current = true

    if (initialData.rates.length > 0 && initialData.zones.length > 0) {
      const initialZones = initialData.zones.map((z) => ({
        zoneName: z.zone,
        countries: z.countries,
        extraCharges: z.extraCharges || [],
      }))
      setZones(initialZones)

      const rateGroups = new Map()
      initialData.rates.forEach((rateEntry) => {
        const perKgRates = {}
        let ratesKey = ""
        initialZones.forEach((zone) => {
          // Normalize to per kg
          const perKgRate = (rateEntry[zone.zoneName] / rateEntry.kg).toFixed(4)
          perKgRates[zone.zoneName] = perKgRate
          ratesKey += `${zone.zoneName}:${perKgRate}|`
        })

        if (!rateGroups.has(ratesKey)) {
          rateGroups.set(ratesKey, { weights: [], perKgRates })
        }
        rateGroups.get(ratesKey).weights.push(rateEntry.kg)
      })

      const reconstructedRanges = []
      rateGroups.forEach((group) => {
        const sortedWeights = group.weights.sort((a, b) => a - b)
        const rangeRates = {}
        initialZones.forEach((zone) => {
          rangeRates[zone.zoneName] = Number.parseFloat(group.perKgRates[zone.zoneName])
        })

        reconstructedRanges.push({
          start: sortedWeights[0],
          end: sortedWeights[sortedWeights.length - 1],
          step: sortedWeights.length > 1 ? Number((sortedWeights[1] - sortedWeights[0]).toFixed(2)) : 0.5,
          rates: rangeRates,
        })
      })

      setWeightRanges(reconstructedRanges)
      baseWeightRangesRef.current = JSON.parse(JSON.stringify(reconstructedRanges))
      
      // Auto-trigger table generation for prefilled data
      setTimeout(() => generateRateTable(reconstructedRanges, initialZones), 100)
    }
  }, [initialData])

  // --- APPLY MARKUP LOGIC ---
  useEffect(() => {
    if (!baseWeightRangesRef.current) return

    const markupVal = Number(markup.value) || 0
    const newRanges = baseWeightRangesRef.current.map((range) => {
      const updatedRates = { ...range.rates }
      Object.keys(updatedRates).forEach((zone) => {
        const originalPrice = updatedRates[zone]
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

  const handleGenerateRates = (allRates, finalZones) => {
    onDataGenerated({ rates: allRates, zones: finalZones })
  }

  // Modified generateRateTable to accept params for the useEffect trigger
  const generateRateTable = (rangesToUse = weightRanges, zonesToUse = zones) => {
    const allRates = []
    rangesToUse.forEach((range) => {
      const start = Number.parseFloat(range.start)
      const end = range.end ? Number.parseFloat(range.end) : start
      const step = Number.parseFloat(range.step)

      for (let kg = start; kg <= end; kg = Number.parseFloat((kg + step).toFixed(2))) {
        const rateEntry = { kg }
        zonesToUse.forEach((zone) => {
          rateEntry[zone.zoneName] = Number.parseFloat(range.rates[zone.zoneName] || 0)
        })
        allRates.push(rateEntry)
      }
    })

    setGeneratedRates(allRates)
    const finalZones = zonesToUse.map((z) => ({
      zone: z.zoneName,
      countries: z.countries,
      extraCharges: z.extraCharges || [],
    }))
    handleGenerateRates(allRates, finalZones)
  }

  return (
    <div className="space-y-8">
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

      {/* --- Rest of your UI Sections --- */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">1. Zone Information {isReadOnlyZones && "(Read-Only)"}</h3>
        {/* ... (Your existing Zones mapping code) ... */}
        {zones.map((zone, index) => (
             <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
               {/* Zone Header and Countries */}
               <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr_auto] gap-4 items-start">
                 <div>
                   <Label>Zone Name</Label>
                   <Input value={zone.zoneName} disabled />
                 </div>
                 <div>
                   <Label>Countries</Label>
                   <MultiSelect
                     options={formattedCountries}
                     selected={zone.countries}
                     disabled={isReadOnlyZones}
                     onChange={(selected) => {
                        const newZones = [...zones];
                        newZones[index].countries = selected;
                        setZones(newZones);
                     }}
                   />
                 </div>
               </div>
             </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">2. Set Weight Ranges & Rates (per kg)</h3>
        {weightRanges.map((range, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4 relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
              <div>
                <Label>Start Weight (kg)</Label>
                <Input type="number" value={range.start} readOnly={initialData} />
              </div>
              <div>
                <Label>End Weight (kg)</Label>
                <Input type="number" value={range.end} readOnly={initialData} />
              </div>
              <div>
                <Label>Step Up</Label>
                <Input type="number" value={range.step} readOnly={initialData} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {zones.map((zone) => (
                <div key={zone.zoneName}>
                  <Label className="text-xs">Zone {zone.zoneName} (₹/kg)</Label>
                  <Input
                    type="number"
                    value={range.rates[zone.zoneName] || ""}
                    onChange={(e) => {
                        const newRanges = [...weightRanges];
                        newRanges[index].rates[zone.zoneName] = e.target.value;
                        setWeightRanges(newRanges);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button size="lg" type="button" onClick={() => generateRateTable()}>
          <Calculator className="mr-2 h-4 w-4" />
          Update Preview Table
        </Button>
      </div>

      {/* --- Preview Table Section --- */}
      {generatedRates.length > 0 && (
         <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">3. Preview Sales Rate Table</h3>
                <div className="flex items-center space-x-2">
                    <Label htmlFor="rate-toggle">Show Total Price</Label>
                    <Switch id="rate-toggle" checked={showBaseRate} onCheckedChange={setShowBaseRate} />
                </div>
            </div>
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
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
         </div>
      )}
    </div>
  )
}