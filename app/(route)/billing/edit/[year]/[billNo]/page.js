"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Save, Package, Loader2, ChevronRight, Eye, Settings, AlertCircle, FileText, XCircle, ArrowLeft } from "lucide-react"

// --- Helper Functions ---
const safeParseFloat = (val) => {
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
}

const calculateAWBWeight = (awb) => {
  if (awb?.financials?.sales?.weight?.chargeable) {
    return safeParseFloat(awb.financials.sales.weight.chargeable)
  }
  if (!awb?.boxes || !Array.isArray(awb.boxes) || awb.boxes.length === 0) {
    return awb?.rateInfo?.weight ? safeParseFloat(awb.rateInfo.weight) : 0
  }
  return awb.boxes.reduce((sum, box) => {
    const cw = safeParseFloat(box.chargeableWeight)
    const aw = safeParseFloat(box.actualWeight)
    const dw = safeParseFloat(box.dimensionalWeight)
    return sum + (cw > 0 ? cw : Math.max(aw, dw))
  }, 0)
}

export default function EditBillPage() {
  const params = useParams()
  const router = useRouter()
  const { year, billNo } = params

  // --- State Management ---
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Data State
  const [existingBill, setExistingBill] = useState(null)
  const [clientInfo, setClientInfo] = useState(null)
  
  // AWB Management
  const [eligibleAwbs, setEligibleAwbs] = useState([]) // Pool of (In-Bill + Unbilled)
  const [filteredAwbs, setFilteredAwbs] = useState([])
  const [selectedAwbs, setSelectedAwbs] = useState([]) // ID Strings
  const [selectAll, setSelectAll] = useState(false)
  const [awbRates, setAwbRates] = useState([])

  // Filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchTrackingNumber, setSearchTrackingNumber] = useState("")
  const [searchCountry, setSearchCountry] = useState("")

  // Billing Details
  const [billingInfo, setBillingInfo] = useState({ name: "", address: "", gst: "" })

  // Settings
  const [includeGST, setIncludeGST] = useState(true)
  const [gstType, setGstType] = useState("cgst_sgst")
  const [rateSettings, setRateSettings] = useState({ cgst: 9, sgst: 9, igst: 18, profitPercent: 0 })
  
  // Totals
  const [totals, setTotals] = useState({ subtotal: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, total: 0, paid: 0, balance: 0 })

  // Rate Source Logic
  const [rateSource, setRateSource] = useState("awb") 
  const [selectedRateType, setSelectedRateType] = useState("")
  const [availableRates, setAvailableRates] = useState([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [rateApiErrors, setRateApiErrors] = useState([])

  const [showInvoicePreview, setShowInvoicePreview] = useState(false)

  // --- 1. Fetch Initial Data ---
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true)
        
        // 1. Fetch Bill
        const billRes = await fetch(`/api/billing/year/${year}/${billNo}`)
        if (!billRes.ok) throw new Error("Bill not found")
        const billData = await billRes.json()
        setExistingBill(billData)

        // 2. Setup Basic Bill State
        setBillingInfo(billData.billingInfo)
        setTotals(prev => ({ ...prev, paid: billData.paid || 0 }))
        
        const isGst = billData.invoiceType === 'gst'
        setIncludeGST(isGst)
        
        if (billData.igstAmount > 0) {
          setGstType("igst")
          setRateSettings(p => ({ ...p, igst: billData.igst || 18 }))
        } else {
          setGstType("cgst_sgst")
          setRateSettings(p => ({ ...p, cgst: billData.cgst || 9, sgst: billData.sgst || 9 }))
        }

        // 3. Fetch Rates Master (for API calculation)
        const ratesRes = await fetch("/api/rates", { headers: { "userType": "admin" } })
        const ratesData = await ratesRes.json()
        setAvailableRates(ratesData.data || ratesData || [])

        // 4. Fetch Client & All Relevant AWBs
        // We need the Client ID/Code from the bill (assuming it's stored or derive from first AWB)
        // If your bill stores clientCode, use that. If not, use the first AWB's refCode.
        let clientCode = billData.clientFranchiseCode
        
        // Fetch all AWBs to find eligible ones (This client's unbilled + This bill's awbs)
        const awbRes = await fetch(`/api/awb?fetchAll=true`)
        const awbResult = await awbRes.json()
        const allSystemAwbs = awbResult.data || awbResult

        // Extract IDs currently in this bill
        const currentBillAwbIds = billData.awbs.map(item => 
          typeof item.awbId === 'object' ? item.awbId._id : item.awbId
        )

        // Find the client info if not explicitly stored
        if (!clientCode && currentBillAwbIds.length > 0) {
           const firstAwb = allSystemAwbs.find(a => a._id === currentBillAwbIds[0])
           if(firstAwb) clientCode = firstAwb.refCode
        }

        // 5. Filter for Eligible AWBs
        // Criteria: (Belongs to this Client) AND (Is Unbilled OR Is in THIS bill)
        const eligible = allSystemAwbs.filter(awb => {
           const matchesClient = awb.refCode === clientCode
           const isUnbilled = !awb.isBilled
           const isInThisBill = currentBillAwbIds.includes(awb._id)
           return matchesClient && (isUnbilled || isInThisBill)
        })

        setEligibleAwbs(eligible)
        setSelectedAwbs(currentBillAwbIds) // Pre-select existing items

        // 6. Initialize Rate State
        // For items in the bill, use the saved bill values (basePrice = amount / weight, roughly)
        // For items NOT in the bill, calculate defaults
        const initialRates = eligible.map(awb => {
            const isInBill = currentBillAwbIds.includes(awb._id)
            const weight = calculateAWBWeight(awb)

            if (isInBill) {
               // Use saved data
               const billItem = billData.awbs.find(i => {
                 const id = typeof i.awbId === 'object' ? i.awbId._id : i.awbId
                 return id === awb._id
               })

               return calculateRowRate({
                  awbId: awb._id,
                  weight: billItem.weight,
                  service: "Existing Item", // Or store service in bill item
                  baseCharge: billItem.amount, // In bill schema, 'amount' is essentially taxable value
                  fuelSurcharge: 0, // Usually merged in saved bills
                  otherCharges: 0,
                  profitCharges: 0,
                  isFromAPI: false,
               }, isGst, gstType === 'igst' ? billData.igst : billData.cgst + billData.sgst)
            } else {
               // Calculate default for unbilled items
               const salesData = awb.financials?.sales || {}
               const otherChargesSum = Array.isArray(salesData.charges?.otherCharges) 
                ? salesData.charges.otherCharges.reduce((acc, curr) => acc + safeParseFloat(curr.amount), 0)
                : 0

               return calculateRowRate({
                  awbId: awb._id,
                  weight: safeParseFloat(salesData.weight?.chargeable) || weight,
                  service: salesData.serviceType || awb.rateInfo?.service || "N/A",
                  baseCharge: safeParseFloat(salesData.rates?.baseTotal),
                  fuelSurcharge: safeParseFloat(salesData.charges?.fuelAmount),
                  otherCharges: otherChargesSum,
                  profitCharges: 0,
                  isFromAPI: false,
               }, isGst, gstType === 'igst' ? 18 : 18)
            }
        })
        setAwbRates(initialRates)
        setClientInfo({ code: clientCode }) // Basic info

      } catch (err) {
        console.error(err)
        alert("Error loading bill data")
      } finally {
        setLoading(false)
      }
    }

    initPage()
  }, [year, billNo])

  // --- 2. Calculation Helper ---
  const calculateRowRate = useCallback((rateData, _includeGST = includeGST, _taxRate = null) => {
    const newRate = { ...rateData }
    
    newRate.subtotal = safeParseFloat(newRate.baseCharge) +
      safeParseFloat(newRate.fuelSurcharge) +
      safeParseFloat(newRate.otherCharges) +
      safeParseFloat(newRate.profitCharges)

    if (_includeGST) {
      // Use provided tax rate or current state
      const effectiveTaxRate = _taxRate !== null 
        ? _taxRate 
        : (gstType === "igst" ? rateSettings.igst : (rateSettings.cgst + rateSettings.sgst))
      
      newRate.gstAmount = (newRate.subtotal * effectiveTaxRate) / 100
    } else {
      newRate.gstAmount = 0
    }

    newRate.total = newRate.subtotal + newRate.gstAmount
    return newRate
  }, [includeGST, gstType, rateSettings])

  // --- 3. Filter Logic ---
  useEffect(() => {
    let result = eligibleAwbs

    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      result = result.filter((awb) => new Date(awb.date) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      result = result.filter((awb) => new Date(awb.date) <= end)
    }

    if (searchTrackingNumber) {
      const searchLower = searchTrackingNumber.toLowerCase()
      result = result.filter((awb) =>
        awb.trackingNumber?.toLowerCase().includes(searchLower) ||
        awb.cNoteNumber?.toLowerCase().includes(searchLower)
      )
    }

    if (searchCountry) {
      const countryLower = searchCountry.toLowerCase()
      result = result.filter((awb) =>
        awb.receiver?.country?.toLowerCase().includes(countryLower)
      )
    }

    setFilteredAwbs(result)
  }, [eligibleAwbs, startDate, endDate, searchTrackingNumber, searchCountry])

  // --- 4. Selection Logic ---
  useEffect(() => {
    if (filteredAwbs.length === 0) {
      setSelectAll(false)
      return
    }
    // Check if all displayed AWBs are currently selected
    const allDisplayedSelected = filteredAwbs.every(a => selectedAwbs.includes(a._id))
    setSelectAll(allDisplayedSelected)
  }, [selectedAwbs, filteredAwbs])

  const handleToggleSelectAll = (isChecked) => {
    if (isChecked) {
      // Add all currently filtered IDs to selection (merge unique)
      const visibleIds = filteredAwbs.map(a => a._id)
      setSelectedAwbs(prev => [...new Set([...prev, ...visibleIds])])
    } else {
      // Remove all currently filtered IDs from selection
      const visibleIds = filteredAwbs.map(a => a._id)
      setSelectedAwbs(prev => prev.filter(id => !visibleIds.includes(id)))
    }
  }

  const handleToggleIndividual = (awbId) => {
    setSelectedAwbs(prev => {
      if (prev.includes(awbId)) return prev.filter(id => id !== awbId)
      return [...prev, awbId]
    })
  }

  // --- 5. Recalculate Totals ---
  useEffect(() => {
    // Refresh calculations for all rates based on current settings
    const updatedRates = awbRates.map(rate => calculateRowRate(rate))
    
    // Only sum up Selected AWBs
    const selectedRateObjects = updatedRates.filter((rate) => selectedAwbs.includes(rate.awbId))
    
    const newTotals = selectedRateObjects.reduce((acc, rate) => {
      acc.subtotal += safeParseFloat(rate.subtotal)
      acc.gstAmount += safeParseFloat(rate.gstAmount)
      acc.total += safeParseFloat(rate.total)
      return acc
    }, { subtotal: 0, gstAmount: 0, total: 0 })

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0

    if (includeGST) {
      if (gstType === "igst") {
        igstAmount = newTotals.gstAmount
      } else {
        cgstAmount = newTotals.gstAmount / 2
        sgstAmount = newTotals.gstAmount / 2
      }
    }

    setTotals((prev) => ({
      ...prev,
      subtotal: newTotals.subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      total: newTotals.total,
      balance: newTotals.total - prev.paid
    }))
  }, [selectedAwbs, includeGST, gstType, rateSettings, awbRates.length]) // Trigger when list or settings change

  // --- 6. API Rates Fetching ---
  const fetchRatesForSelected = async () => {
    if (!selectedRateType) return setRateApiErrors(["Select rate type"])
    setLoadingRates(true)
    setRateApiErrors([])
    const errors = []

    // Only apply to SELECTED items in the rates table
    const targetAwbs = eligibleAwbs.filter(a => selectedAwbs.includes(a._id))

    const updatedRates = [...awbRates]

    await Promise.all(targetAwbs.map(async (awb) => {
      const weight = calculateAWBWeight(awb)
      const country = awb.receiver?.country || "Unknown"

      try {
         const params = new URLSearchParams({
          type: selectedRateType,
          weight: weight.toString(),
          country,
          profitPercent: rateSettings.profitPercent.toString()
        })
        const res = await fetch(`/api/rate?${params}`, { headers: { "userType": "admin" } })
        if(!res.ok) throw new Error("No rate")
        const data = await res.json()

        // Update state array
        const idx = updatedRates.findIndex(r => r.awbId === awb._id)
        if(idx > -1) {
          updatedRates[idx] = calculateRowRate({
             ...updatedRates[idx],
             baseCharge: safeParseFloat(data.baseRate),
             fuelSurcharge: 0,
             otherCharges: safeParseFloat(data.totalCharges),
             profitCharges: safeParseFloat(data.profitCharges),
             service: data.service || selectedRateType,
             isFromAPI: true
          })
        }
      } catch (e) {
        errors.push(`${awb.trackingNumber}: ${e.message}`)
      }
    }))

    setAwbRates(updatedRates)
    if(errors.length) setRateApiErrors(errors)
    setLoadingRates(false)
  }

  // --- 7. Save Handler ---
  const handleUpdate = async () => {
    if (selectedAwbs.length === 0) return alert("Select at least one AWB.")
    
    setSaving(true)
    try {
      const formattedAwbs = awbRates
        .filter(rate => selectedAwbs.includes(rate.awbId))
        .map(rate => {
          const awb = eligibleAwbs.find(a => a._id === rate.awbId)
          return {
            awbId: rate.awbId,
            trackingNumber: awb?.trackingNumber,
            weight: rate.weight,
            ratePerKg: rate.weight > 0 ? (rate.subtotal / rate.weight) : 0,
            amount: rate.subtotal,
            country: awb?.receiver?.country || 'N/A',
          }
        })

      const payload = {
        invoiceType: includeGST ? "gst" : "non-gst",
        billingInfo,
        awbs: formattedAwbs,
        subtotal: totals.subtotal,
        cgst: includeGST && gstType === "cgst_sgst" ? rateSettings.cgst : 0,
        sgst: includeGST && gstType === "cgst_sgst" ? rateSettings.sgst : 0,
        igst: includeGST && gstType === "igst" ? rateSettings.igst : 0,
        cgstAmount: totals.cgstAmount,
        sgstAmount: totals.sgstAmount,
        igstAmount: totals.igstAmount,
        total: totals.total,
        balance: totals.total - totals.paid
      }

      const res = await fetch(`/api/billing/year/${year}/${billNo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error(await res.text())
      
      alert("Bill Updated Successfully")
      router.push(`/billing/${year}/${billNo}`)

    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRateChange = (awbId, field, value) => {
    setAwbRates((prev) => prev.map((rate) => (
      rate.awbId === awbId ? calculateRowRate({ ...rate, [field]: safeParseFloat(value) }) : rate
    )))
  }

  if (loading) {
     return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8"/></div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="container mx-auto px-4 py-8 max-w-screen-2xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/billing/${year}/${billNo}`}>
            <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4"/></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Bill #{billNo}</h1>
            <p className="text-gray-500">Modify items, rates, and billing details</p>
          </div>
        </div>

        {/* 1. Filter AWBs (Client Locked) */}
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <div className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Add / Remove AWBs
              </div>
              {clientInfo && <Badge variant="outline">Client Code: {clientInfo.code}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tracking No / C-Note</Label>
                <Input value={searchTrackingNumber} onChange={(e) => setSearchTrackingNumber(e.target.value)} placeholder="Search..." />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={searchCountry} onChange={(e) => setSearchCountry(e.target.value)} placeholder="Filter country..." />
              </div>
            </div>

            {/* Selection Toolbar */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md flex flex-wrap gap-4 justify-between items-center border border-blue-100">
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Eligible in Filter:</span>
                      <span className="font-bold text-gray-900">{filteredAwbs.length}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4 bg-gray-300"/>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Selected for Bill:</span>
                      <span className="font-bold text-blue-600">{selectedAwbs.length}</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={selectAll ? "secondary" : "default"}
                    onClick={() => handleToggleSelectAll(!selectAll)}
                  >
                      {selectAll ? "Deselect Filtered" : "Select All Filtered"}
                  </Button>
                </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Consignee</TableHead>
                      <TableHead className="text-center">Weight</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAwbs.length > 0 ? (
                      filteredAwbs.map((awb) => {
                        const weight = calculateAWBWeight(awb)
                        const isSelected = selectedAwbs.includes(awb._id)
                        // It is considered "Billed" if it's marked billed AND NOT in our current selection (meaning it belongs to another bill)
                        const isLockedBilled = awb.isBilled && !existingBill.awbs.find(i => {
                            const id = typeof i.awbId === 'object' ? i.awbId._id : i.awbId
                            return id === awb._id
                        })

                        return (
                          <TableRow
                            key={awb._id}
                            onClick={() => !isLockedBilled && handleToggleIndividual(awb._id)}
                            className={`
                              cursor-pointer transition-colors
                              ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""} 
                              ${isLockedBilled ? "opacity-50 bg-gray-100 cursor-not-allowed" : "hover:bg-gray-50"}
                            `}
                          >
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleIndividual(awb._id)}
                                disabled={isLockedBilled}
                                className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {awb.date ? new Date(awb.date).toLocaleDateString("en-IN") : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{awb.trackingNumber}</span>
                                <span className="text-xs text-gray-500">{awb.cNoteNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{awb.receiver?.name || "N/A"}</TableCell>
                            <TableCell className="text-center font-mono">{weight.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {isSelected ? <Badge className="bg-green-600">Selected</Badge> : <Badge variant="outline">Available</Badge>}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-gray-500">No items found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedAwbs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 2. Rates Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-sm border-l-4 border-l-orange-500 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="bg-orange-100 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Rates & Charges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Source Selection & API Controls */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <Label className="font-semibold">Update Rates Method</Label>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                            <Switch 
                                checked={rateSource === 'rates'} 
                                onCheckedChange={(c) => setRateSource(c ? 'rates' : 'awb')} 
                            />
                            <Label>{rateSource === 'rates' ? 'Using Master Rates' : 'Manual / Existing Data'}</Label>
                        </div>
                    </div>

                    {rateSource === "rates" && (
                      <div className="pt-4 border-t space-y-4 animate-in fade-in">
                          <div className="flex gap-4 items-end">
                            <div className="flex-1">
                              <Label className="text-xs mb-1.5 block">Service Type</Label>
                              <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedRateType}
                                onChange={(e) => setSelectedRateType(e.target.value)}
                              >
                                <option value="">Select Service...</option>
                                {availableRates.map(r => <option key={r._id} value={r.originalName || r.name}>{r.originalName || r.name}</option>)}
                              </select>
                            </div>
                            <div className="w-24">
                              <Label className="text-xs mb-1.5 block">Profit %</Label>
                              <Input 
                                type="number" 
                                value={rateSettings.profitPercent} 
                                onChange={(e) => setRateSettings(p => ({...p, profitPercent: e.target.value}))} 
                              />
                            </div>
                            <Button onClick={fetchRatesForSelected} disabled={loadingRates}>
                              {loadingRates ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply to Selected"}
                            </Button>
                          </div>
                          {rateApiErrors.length > 0 && (
                            <div className="bg-red-50 text-red-700 p-2 text-xs rounded max-h-24 overflow-auto">
                              {rateApiErrors.map((e,i) => <p key={i}>{e}</p>)}
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Editable Table */}
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-100 dark:bg-gray-800">
                        <TableRow>
                          <TableHead>Track #</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Base (₹)</TableHead>
                          <TableHead>Fuel (₹)</TableHead>
                          <TableHead>Other (₹)</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          {includeGST && <TableHead className="text-right text-xs">GST</TableHead>}
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {awbRates
                          .filter(r => selectedAwbs.includes(r.awbId))
                          .map(rate => {
                            const awb = eligibleAwbs.find(a => a._id === rate.awbId)
                            return (
                              <TableRow key={rate.awbId}>
                                <TableCell className="font-medium text-xs">
                                  {awb?.trackingNumber}
                                  <div className="text-[10px] text-gray-500 font-normal">{rate.service}</div>
                                </TableCell>
                                <TableCell>{rate.weight}</TableCell>
                                <TableCell className="p-1">
                                  <Input 
                                    type="number" 
                                    className="h-8 w-20 text-xs" 
                                    value={rate.baseCharge} 
                                    onChange={(e) => handleRateChange(rate.awbId, "baseCharge", e.target.value)}
                                  />
                                </TableCell>
                                <TableCell className="p-1">
                                  <Input 
                                    type="number" 
                                    className="h-8 w-16 text-xs" 
                                    value={rate.fuelSurcharge} 
                                    onChange={(e) => handleRateChange(rate.awbId, "fuelSurcharge", e.target.value)}
                                  />
                                </TableCell>
                                <TableCell className="p-1">
                                  <Input 
                                    type="number" 
                                    className="h-8 w-16 text-xs" 
                                    value={rate.otherCharges + rate.profitCharges} 
                                    onChange={(e) => handleRateChange(rate.awbId, "otherCharges", e.target.value)}
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium">{rate.subtotal.toFixed(2)}</TableCell>
                                {includeGST && <TableCell className="text-right text-xs text-gray-500">{rate.gstAmount.toFixed(1)}</TableCell>}
                                <TableCell className="text-right font-bold text-blue-600">{rate.total.toFixed(2)}</TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3. Billing Info & Summary */}
            <div className="space-y-6">
               <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4"/> Tax Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center justify-between">
                     <Label>Include GST</Label>
                     <Switch checked={includeGST} onCheckedChange={setIncludeGST} />
                   </div>
                   {includeGST && (
                     <div className="pt-2 border-t space-y-3">
                        <RadioGroup value={gstType} onValueChange={setGstType} className="flex gap-4">
                          <div className="flex items-center space-x-2"><RadioGroupItem value="cgst_sgst" id="r1"/><Label htmlFor="r1" className="text-xs">CGST+SGST</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="igst" id="r2"/><Label htmlFor="r2" className="text-xs">IGST</Label></div>
                        </RadioGroup>
                        <div className="grid grid-cols-2 gap-2">
                           {gstType === 'cgst_sgst' ? (
                             <>
                              <div><Label className="text-[10px]">CGST %</Label><Input type="number" className="h-8" value={rateSettings.cgst} onChange={(e) => setRateSettings(p => ({...p, cgst: safeParseFloat(e.target.value)}))} /></div>
                              <div><Label className="text-[10px]">SGST %</Label><Input type="number" className="h-8" value={rateSettings.sgst} onChange={(e) => setRateSettings(p => ({...p, sgst: safeParseFloat(e.target.value)}))} /></div>
                             </>
                           ) : (
                              <div><Label className="text-[10px]">IGST %</Label><Input type="number" className="h-8" value={rateSettings.igst} onChange={(e) => setRateSettings(p => ({...p, igst: safeParseFloat(e.target.value)}))} /></div>
                           )}
                        </div>
                     </div>
                   )}
                </CardContent>
               </Card>

               <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4"/> Billing Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Billing Name" value={billingInfo.name} onChange={(e) => setBillingInfo(p => ({...p, name: e.target.value}))} />
                  <Input placeholder="GST Number" value={billingInfo.gst} onChange={(e) => setBillingInfo(p => ({...p, gst: e.target.value}))} />
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Address" 
                    value={billingInfo.address} 
                    onChange={(e) => setBillingInfo(p => ({...p, address: e.target.value}))} 
                  />
                </CardContent>
               </Card>

               <Card className="shadow-md bg-slate-900 text-white border-none">
                 <CardHeader>
                   <CardTitle className="text-lg">Summary</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm opacity-80">
                      <span>Subtotal</span>
                      <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {includeGST && (
                      <div className="flex justify-between text-sm opacity-80">
                        <span>Tax</span>
                        <span>₹{(totals.cgstAmount + totals.sgstAmount + totals.igstAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <Separator className="bg-slate-700 my-2" />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>₹{totals.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-slate-400">Paid</span>
                      <span className="text-green-400">₹{totals.paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-yellow-400">
                      <span>Balance</span>
                      <span>₹{totals.balance.toFixed(2)}</span>
                    </div>
                 </CardContent>
               </Card>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      {selectedAwbs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t shadow-lg z-50">
          <div className="container mx-auto flex justify-between items-center max-w-screen-2xl">
            <div>
               <p className="font-semibold">{selectedAwbs.length} Items Selected</p>
               <p className="text-sm text-gray-500">Total: ₹{totals.total.toFixed(2)}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowInvoicePreview(true)}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </Button>
              <Button onClick={handleUpdate} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2" />}
                Update Bill
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showInvoicePreview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <Card className="w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <CardTitle>Invoice Preview</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowInvoicePreview(false)}>✕</Button>
              </CardHeader>
              <CardContent className="overflow-y-auto p-8 space-y-6">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="font-bold text-lg">{billingInfo.name || "Client Name"}</h3>
                      <p className="whitespace-pre-line text-sm text-gray-600">{billingInfo.address}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-bold">Total: ₹{totals.total.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Items: {selectedAwbs.length}</p>
                   </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {awbRates.filter(r => selectedAwbs.includes(r.awbId)).map((rate, i) => {
                       const awb = eligibleAwbs.find(a => a._id === rate.awbId)
                       return (
                         <TableRow key={rate.awbId}>
                           <TableCell>{i + 1}</TableCell>
                           <TableCell>
                             <div className="font-medium">{awb?.trackingNumber}</div>
                             <div className="text-xs text-gray-500">{awb?.receiver?.country}</div>
                           </TableCell>
                           <TableCell className="text-xs">{rate.service}</TableCell>
                           <TableCell className="text-right">{rate.weight}</TableCell>
                           <TableCell className="text-right">{(rate.subtotal/rate.weight).toFixed(2)}</TableCell>
                           <TableCell className="text-right">{rate.subtotal.toFixed(2)}</TableCell>
                         </TableRow>
                       )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="justify-end gap-2 border-t pt-4">
                 <Button variant="outline" onClick={() => setShowInvoicePreview(false)}>Close</Button>
                 <Button onClick={handleUpdate} className="bg-green-600 hover:bg-green-700">Confirm Update</Button>
              </CardFooter>
            </Card>
          </div>
        )}
    </div>
  )
}