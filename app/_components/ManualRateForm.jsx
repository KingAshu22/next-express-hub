"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, Info, Calculator, X, AlertTriangle } from "lucide-react"
import { Countries as countryList } from "@/app/constants/country"
import { MultiSelect } from "./MultiSelect"
import { toast } from "@/hooks/use-toast"

const chargeTypeLabels = {
  percentage: "Percentage (%)",
  perKg: "Per Kg (₹)",
  oneTime: "One Time (₹)",
};

export default function ManualRateForm({ onDataGenerated, initialData = null }) {
  const formattedCountries = useMemo(() =>
    countryList
      .map(country => ({
        value: country,
        label: country
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  const [zones, setZones] = useState([{ zoneName: '1', countries: [], extraCharges: [] }]);
  const [weightRanges, setWeightRanges] = useState([
    { start: '', end: '', step: 0.5, rates: {} }
  ]);
  const [generatedRates, setGeneratedRates] = useState([]);
  const [showBaseRate, setShowBaseRate] = useState(false);
  const [isDataLoadedWithWarning, setIsDataLoadedWithWarning] = useState(false);

  const [isZoneChargeDialogOpen, setIsZoneChargeDialogOpen] = useState(false);
  const [editingZoneIndex, setEditingZoneIndex] = useState(null);
  const [newZoneCharge, setNewZoneCharge] = useState({ chargeName: "", chargeType: "perKg", chargeValue: "" });

  useEffect(() => {
    if (initialData && initialData.rates.length > 0 && initialData.zones.length > 0) {
      const initialZones = initialData.zones.map(z => ({
        zoneName: z.zone,
        countries: z.countries,
        extraCharges: z.extraCharges || []
      }));
      setZones(initialZones);

      const rateGroups = new Map();
      initialData.rates.forEach(rateEntry => {
        const perKgRates = {};
        let ratesKey = "";
        initialZones.forEach(zone => {
          const perKgRate = (rateEntry[zone.zoneName] / rateEntry.kg).toFixed(4);
          perKgRates[zone.zoneName] = perKgRate;
          ratesKey += `${zone.zoneName}:${perKgRate}|`;
        });

        if (!rateGroups.has(ratesKey)) {
          rateGroups.set(ratesKey, { weights: [], perKgRates });
        }
        rateGroups.get(ratesKey).weights.push(rateEntry.kg);
      });

      const reconstructedRanges = [];
      let stepIsConsistent = true;
      if (rateGroups.size > 10) { // Heuristic: if too many groups, it's likely complex
          stepIsConsistent = false;
      }

      rateGroups.forEach((group) => {
        const sortedWeights = group.weights.sort((a, b) => a - b);
        let currentStart = sortedWeights[0];
        let currentStep = sortedWeights.length > 1 ? sortedWeights[1] - sortedWeights[0] : 0.5;

        for (let i = 1; i < sortedWeights.length; i++) {
          if (Math.abs((sortedWeights[i] - sortedWeights[i - 1]) - currentStep) > 0.01) {
            stepIsConsistent = false;
            break;
          }
        }
        if (!stepIsConsistent) return;

        const rangeRates = {};
        initialZones.forEach(zone => {
          rangeRates[zone.zoneName] = parseFloat(group.perKgRates[zone.zoneName]);
        });

        reconstructedRanges.push({
          start: currentStart,
          end: sortedWeights[sortedWeights.length - 1],
          step: currentStep,
          rates: rangeRates
        });
      });

      if (reconstructedRanges.length > 0 && stepIsConsistent) {
        setWeightRanges(reconstructedRanges);
      } else {
        setIsDataLoadedWithWarning(true);
        // Fallback for very complex rates: create a range for each unique rate group
        const fallbackRanges = [];
        rateGroups.forEach((group) => {
             const rangeRates = {};
             initialZones.forEach(zone => {
                rangeRates[zone.zoneName] = parseFloat(group.perKgRates[zone.zoneName]);
            });
            fallbackRanges.push({
                start: group.weights[0],
                end: group.weights[group.weights.length-1],
                step: 0.5, // A guess
                rates: rangeRates
            })
        });
        setWeightRanges(fallbackRanges);
      }

      const perKgInitialRates = initialData.rates.map(rate => {
        const perKgRate = { kg: rate.kg };
        initialZones.forEach(zone => {
            perKgRate[zone.zoneName] = rate[zone.zoneName] / rate.kg;
        })
        return perKgRate;
      });
      setGeneratedRates(perKgInitialRates);
    }
  }, [initialData]);

  useEffect(() => {
    if (generatedRates.length > 0) {
      const finalZones = zones.map(z => ({
        zone: z.zoneName,
        countries: z.countries,
        extraCharges: z.extraCharges || []
      }));
      onDataGenerated({ rates: generatedRates, zones: finalZones });
    }
  }, [generatedRates, zones, onDataGenerated]);

  const handleZoneChange = (index, field, value) => {
    const newZones = [...zones];
    newZones[index][field] = value;
    setZones(newZones);
  };
  const addZone = () => setZones([...zones, { zoneName: (zones.length + 1).toString(), countries: [], extraCharges: [] }]);
  const removeZone = (index) => setZones(zones.filter((_, i) => i !== index));

  const handleWeightRangeChange = (index, field, value) => {
    const newRanges = [...weightRanges];
    newRanges[index][field] = value;
    setWeightRanges(newRanges);
  };
  const handleWeightRateChange = (rangeIndex, zoneName, value) => {
    const newRanges = [...weightRanges];
    newRanges[rangeIndex].rates[zoneName] = value;
    setWeightRanges(newRanges);
  };
  const addWeightRange = () => setWeightRanges([...weightRanges, { start: '', end: '', step: 0.5, rates: {} }]);
  const removeWeightRange = (index) => setWeightRanges(weightRanges.filter((_, i) => i !== index));

  const openZoneChargeDialog = (index) => {
    setEditingZoneIndex(index);
    setIsZoneChargeDialogOpen(true);
  };

  const handleAddZoneCharge = () => {
    if (!newZoneCharge.chargeName || !newZoneCharge.chargeValue || editingZoneIndex === null) {
        toast({ title: "Invalid Charge", description: "Please fill all fields.", variant: "destructive"});
        return;
    }
    const newZones = [...zones];
    newZones[editingZoneIndex].extraCharges.push({
      ...newZoneCharge,
      chargeValue: Number(newZoneCharge.chargeValue)
    });
    setZones(newZones);
    setNewZoneCharge({ chargeName: "", chargeType: "perKg", chargeValue: "" });
    setIsZoneChargeDialogOpen(false);
    setEditingZoneIndex(null);
  };

  const handleRemoveZoneCharge = (zoneIndex, chargeIndex) => {
    const newZones = [...zones];
    newZones[zoneIndex].extraCharges = newZones[zoneIndex].extraCharges.filter((_, i) => i !== chargeIndex);
    setZones(newZones);
  };

  const generateRateTable = () => {
    if (zones.some(z => !z.zoneName || z.countries.length === 0)) {
      toast({ title: "Zone Error", description: "Please ensure all zones have a name and at least one country.", variant: "destructive" });
      return;
    }
    if (weightRanges.some(r => !r.start || !r.step || Object.keys(r.rates).length < zones.length)) {
      toast({ title: "Rate Error", description: "Please ensure all weight ranges have a start weight, step, and rates for each zone.", variant: "destructive" });
      return;
    }

    let allRates = [];
    weightRanges.forEach(range => {
      const start = parseFloat(range.start);
      const end = range.end ? parseFloat(range.end) : start;
      const step = parseFloat(range.step);

      for (let kg = start; kg <= end; kg = parseFloat((kg + step).toFixed(2))) {
        let rateEntry = { kg };
        zones.forEach(zone => {
          rateEntry[zone.zoneName] = parseFloat(range.rates[zone.zoneName] || 0);
        });
        allRates.push(rateEntry);
      }
    });

    setGeneratedRates(allRates);
    const toastMessage = initialData ? "Rate table re-generated successfully." : "Rate table generated successfully.";
    toast({ title: "Success", description: toastMessage });
  };

  return (
    <div className="space-y-8">
      {isDataLoadedWithWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Complex Rate Sheet Detected</AlertTitle>
          <AlertDescription>
            The existing rate data has inconsistent weight steps and could not be perfectly reconstructed into ranges. The form has been pre-filled to the best of its ability. Please review carefully. Any new generation will overwrite this complex structure.
          </AlertDescription>
        </Alert>
      )}

      {!isDataLoadedWithWarning && initialData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Editing Existing Data</AlertTitle>
          <AlertDescription>
            The current rate data has been loaded into the form. You can now edit the zones and weight ranges. Click "Re-Generate Rate Table" to see your changes before saving.
          </AlertDescription>
        </Alert>
      )}
      
      {!initialData && (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How to Use the Manual Rate Generator</AlertTitle>
            <AlertDescription>
            <ol className="list-decimal list-inside space-y-1 mt-2">
                <li><strong>Define Zones:</strong> Create zones and assign countries to each. Add extra charges per zone if needed.</li>
                <li><strong>Set Weight Ranges:</strong> Add weight ranges, a step (e.g., 0.5), and the 'per kg' rate for each zone. If 'End Weight' is blank, it applies only to the 'Start Weight'.</li>
                <li><strong>Generate Table:</strong> Click "Generate Rate Table" to preview your rates.</li>
                <li><strong>Submit:</strong> Once satisfied, fill the other rate details and submit the form.</li>
            </ol>
            </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">1. Define Zones & Zone-Specific Charges</h3>
        <Dialog open={isZoneChargeDialogOpen} onOpenChange={setIsZoneChargeDialogOpen}>
          {zones.map((zone, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr_auto] gap-4 items-start">
                <div>
                  <Label>Zone Name</Label>
                  <Input placeholder="e.g., 1 or A" value={zone.zoneName} onChange={(e) => handleZoneChange(index, 'zoneName', e.target.value)} />
                </div>
                <div>
                  <Label>Countries</Label>
                  <MultiSelect options={formattedCountries} selected={zone.countries} onChange={(selected) => handleZoneChange(index, 'countries', selected)} />
                </div>
                <div className="pt-6">
                  <Button variant="ghost" size="icon" onClick={() => removeZone(index)} disabled={zones.length === 1}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Extra Charges for Zone {zone.zoneName}</Label>
                <div className="space-y-2 mt-2">
                  {zone.extraCharges.length > 0 ? (
                    zone.extraCharges.map((charge, chargeIndex) => (
                      <div key={chargeIndex} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                        <span>{charge.chargeName} ({chargeTypeLabels[charge.chargeType]})</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {charge.chargeType === 'percentage' ? `${charge.chargeValue}%` : `₹${charge.chargeValue}`}
                          </span>
                          <button type="button" onClick={() => handleRemoveZoneCharge(index, chargeIndex)}>
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No extra charges for this zone.</p>
                  )}
                   <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => openZoneChargeDialog(index)}>
                        <PlusCircle className="w-4 h-4 mr-2" /> Add Charge to Zone {zone.zoneName}
                      </Button>
                  </DialogTrigger>
                </div>
              </div>
            </div>
          ))}
          <DialogContent>
            <DialogHeader><DialogTitle>Add Extra Charge for Zone</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Charge Name</Label><Input placeholder="e.g., Remote Area Fee" value={newZoneCharge.chargeName} onChange={(e) => setNewZoneCharge({ ...newZoneCharge, chargeName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Charge Type</Label><Select value={newZoneCharge.chargeType} onValueChange={(val) => setNewZoneCharge({ ...newZoneCharge, chargeType: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">{chargeTypeLabels.percentage}</SelectItem><SelectItem value="perKg">{chargeTypeLabels.perKg}</SelectItem><SelectItem value="oneTime">{chargeTypeLabels.oneTime}</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Value</Label><Input type="number" placeholder="e.g., 250" value={newZoneCharge.chargeValue} onChange={(e) => setNewZoneCharge({ ...newZoneCharge, chargeValue: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="button" onClick={handleAddZoneCharge}>Save Zone Charge</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" type="button" onClick={addZone}><PlusCircle className="mr-2 h-4 w-4" />Add Another Zone</Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">2. Set Weight Ranges & Rates (per kg)</h3>
        {weightRanges.map((range, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
              <div><Label>Start Weight (kg)</Label><Input type="number" placeholder="1" value={range.start} onChange={e => handleWeightRangeChange(index, 'start', e.target.value)} /></div>
              <div><Label>End Weight (kg)</Label><Input type="number" placeholder="5 (optional)" value={range.end} onChange={e => handleWeightRangeChange(index, 'end', e.target.value)} /></div>
              <div><Label>Step Up</Label><Input type="number" step="0.5" placeholder="0.5" value={range.step} onChange={e => handleWeightRangeChange(index, 'step', e.target.value)} /></div>
              <Button variant="ghost" size="icon" onClick={() => removeWeightRange(index)} disabled={weightRanges.length === 1}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {zones.map(zone => (
                <div key={zone.zoneName}><Label>Rate for Zone {zone.zoneName} (₹/kg)</Label><Input type="number" placeholder="e.g., 150" value={range.rates[zone.zoneName] || ''} onChange={e => handleWeightRateChange(index, zone.zoneName, e.target.value)} /></div>
              ))}
            </div>
          </div>
        ))}
        <Button variant="outline" type="button" onClick={addWeightRange}><PlusCircle className="mr-2 h-4 w-4" />Add Weight Range</Button>
      </div>

      <div className="flex justify-center">
        <Button size="lg" type="button" onClick={generateRateTable}><Calculator className="mr-2 h-4 w-4" />{initialData ? "Re-Generate Rate Table" : "Generate Rate Table"}</Button>
      </div>

      {generatedRates.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">3. Preview Generated Rate Table</h3>
            <div className="flex items-center space-x-2">
              <Label htmlFor="rate-toggle">Show Base Rate</Label>
              <Switch id="rate-toggle" checked={showBaseRate} onCheckedChange={setShowBaseRate} />
            </div>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Weight (kg)</TableHead>
                {zones.map(z => <TableHead key={z.zoneName}>Zone {z.zoneName}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {generatedRates.map((rate, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{rate.kg}</TableCell>
                    {zones.map(z => (
                      <TableCell key={z.zoneName}>
                        ₹{(showBaseRate ? (rate[z.zoneName] * rate.kg) : rate[z.zoneName]).toFixed(2)}
                        {showBaseRate && <span className="text-xs text-muted-foreground block">({rate[z.zoneName].toFixed(2)}/kg)</span>}
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
  );
}