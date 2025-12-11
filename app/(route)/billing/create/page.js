"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Save, Package, Loader2, ChevronDown, Check, ChevronRight, Eye, Settings, AlertCircle, Percent, FileText, Filter } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import isAdminAuth from "@/lib/isAdminAuth"
import { format } from "date-fns" // Optional: if you use date-fns, otherwise standard JS dates used below

// --- Helper Functions ---
const safeParseFloat = (val) => {
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
}

const calculateAWBWeight = (awb) => {
  // Priority: 1. Sales Chargeable, 2. Box Calculation, 3. Fallback
  if (awb?.financials?.sales?.weight?.chargeable) {
    return safeParseFloat(awb.financials.sales.weight.chargeable)
  }

  if (!awb?.boxes || !Array.isArray(awb.boxes) || awb.boxes.length === 0) {
    if (awb?.rateInfo?.weight) {
      return safeParseFloat(awb.rateInfo.weight)
    }
    return 0
  }

  return awb.boxes.reduce((sum, box) => {
    const chargeableWeight = safeParseFloat(box.chargeableWeight)
    const actualWeight = safeParseFloat(box.actualWeight)
    const dimensionalWeight = safeParseFloat(box.dimensionalWeight)

    if (chargeableWeight > 0) return sum + chargeableWeight
    return sum + Math.max(actualWeight, dimensionalWeight)
  }, 0)
}

const getBoxCount = (awb) => {
  if (!awb?.boxes || !Array.isArray(awb.boxes)) return 0
  return awb.boxes.length
}

// --- Main Component ---
function BillingCreatePage() {
  // --- State Management ---
  const [allAwbs, setAllAwbs] = useState([])
  const [filteredAwbs, setFilteredAwbs] = useState([])
  const [selectedAwbs, setSelectedAwbs] = useState([]) // Array of Strings (IDs)
  const [selectAll, setSelectAll] = useState(false)
  const [awbRates, setAwbRates] = useState([])

  // Filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchTrackingNumber, setSearchTrackingNumber] = useState("")
  const [searchCountry, setSearchCountry] = useState("")
  const [hideBilled, setHideBilled] = useState(true)

  // Client Selection
  const [clientFranchiseList, setClientFranchiseList] = useState([])
  const [clientFranchiseSearch, setClientFranchiseSearch] = useState("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedClientFranchise, setSelectedClientFranchise] = useState(null)

  // Billing Details
  const [billingInfo, setBillingInfo] = useState({ name: "", address: "", gst: "" })

  // Settings
  const [includeGST, setIncludeGST] = useState(true)
  const [gstType, setGstType] = useState("cgst_sgst")
  
  // Rate Logic
  const [rateSource, setRateSource] = useState("awb") // 'awb' or 'rates'
  const [availableRates, setAvailableRates] = useState([])
  const [selectedRateType, setSelectedRateType] = useState("")
  const [rateSettings, setRateSettings] = useState({ cgst: 9, sgst: 9, igst: 18, profitPercent: 0 })
  const [rateApiErrors, setRateApiErrors] = useState([])

  // Totals
  const [totals, setTotals] = useState({ subtotal: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, total: 0, paid: 0, balance: 0 })

  // UI States
  const [loading, setLoading] = useState(true)
  const [loadingRates, setLoadingRates] = useState(false)
  const [showInvoicePreview, setShowInvoicePreview] = useState(false)

  // --- 1. Initial Data Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [awbsRes, clientsRes, franchisesRes, ratesRes, billsRes] = await Promise.all([
          fetch("/api/awb?fetchAll=true"),
          fetch("/api/clients"),
          fetch("/api/franchises"),
          fetch("/api/rates", { headers: { "userType": "admin" } }),
          fetch("/api/billing"),
        ])

        const awbsData = await awbsRes.json()
        const clientsData = await clientsRes.json()
        const franchisesData = await franchisesRes.json()
        const ratesData = await ratesRes.json()
        const billsResult = await billsRes.json()

        // Identify Billed AWBs
        const billsList = billsResult.data || billsResult || []
        const billedAwbIds = new Set()
        billsList.forEach(bill => {
          if (bill.awbs && Array.isArray(bill.awbs)) {
            bill.awbs.forEach(item => {
              const id = typeof item.awbId === 'object' ? item.awbId._id : item.awbId
              if (id) billedAwbIds.add(id.toString())
            })
          }
        })

        // Process AWBs
        const rawAwbs = awbsData.data || awbsData || []
        const processedAwbs = rawAwbs.map(awb => ({
          ...awb,
          isBilled: awb.isBilled || billedAwbIds.has(awb._id)
        }))

        setAllAwbs(processedAwbs)
        setAvailableRates(ratesData.data || ratesData || [])

        // Process Clients/Franchises
        const combined = [
          ...(clientsData.data || clientsData || []).map((c) => ({ ...c, type: "client", code: c.code || c.refCode || c._id })),
          ...(franchisesData.data || franchisesData || []).map((f) => ({ ...f, type: "franchise", code: f.code || f.refCode || f._id })),
        ]
        setClientFranchiseList(combined)

      } catch (error) {
        console.error("Failed to fetch initial data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // --- 2. Filter Logic (Memoized) ---
  const filteredClientFranchiseList = useMemo(() => {
    if (!clientFranchiseSearch) return clientFranchiseList
    const searchLower = clientFranchiseSearch.toLowerCase()
    return clientFranchiseList.filter(
      (item) =>
        item.companyName?.toLowerCase().includes(searchLower) ||
        item.name?.toLowerCase().includes(searchLower) ||
        item.code?.toLowerCase().includes(searchLower)
    )
  }, [clientFranchiseList, clientFranchiseSearch])

  // --- 3. Rate Calculation Helpers ---
  const calculateRowRate = useCallback((rateData) => {
    const newRate = { ...rateData }
    
    newRate.subtotal = safeParseFloat(newRate.baseCharge) +
      safeParseFloat(newRate.fuelSurcharge) +
      safeParseFloat(newRate.otherCharges) +
      safeParseFloat(newRate.profitCharges)

    if (includeGST) {
      const taxRate = gstType === "igst" ? rateSettings.igst : (rateSettings.cgst + rateSettings.sgst)
      newRate.gstAmount = (newRate.subtotal * taxRate) / 100
    } else {
      newRate.gstAmount = 0
    }

    newRate.total = newRate.subtotal + newRate.gstAmount
    return newRate
  }, [includeGST, gstType, rateSettings])

  // --- 4. Apply Filters & Generate Initial Rates ---
  const applyFiltersAndRates = useCallback(() => {
    // A. Filter AWBs
    let result = allAwbs.filter((awb) =>
      selectedClientFranchise ? awb.refCode === selectedClientFranchise.code : true
    )

    if (hideBilled) {
      result = result.filter(awb => !awb.isBilled)
    }

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
        awb.cNoteNumber?.toLowerCase().includes(searchLower) ||
        awb.awbNumber?.toLowerCase().includes(searchLower)
      )
    }

    if (searchCountry) {
      const countryLower = searchCountry.toLowerCase()
      result = result.filter((awb) =>
        awb.receiver?.country?.toLowerCase().includes(countryLower)
      )
    }

    setFilteredAwbs(result)

    // B. Calculate Rates (If Source is AWB)
    if (rateSource === "awb") {
      const ratesFromAwb = result.map((awb) => {
        // --- DATA EXTRACTION FROM FINANCIALS.SALES ---
        const salesData = awb.financials?.sales || {}
        const calculatedWeight = calculateAWBWeight(awb)

        // Sum up other charges array
        const otherChargesSum = Array.isArray(salesData.charges?.otherCharges) 
          ? salesData.charges.otherCharges.reduce((acc, curr) => acc + safeParseFloat(curr.amount), 0)
          : 0

        const initialRate = {
          awbId: awb._id,
          weight: safeParseFloat(salesData.weight?.chargeable) || calculatedWeight,
          service: salesData.serviceType || awb.rateInfo?.service || "N/A",
          baseCharge: safeParseFloat(salesData.rates?.baseTotal), // Use Sales Base Total
          fuelSurcharge: safeParseFloat(salesData.charges?.fuelAmount), // Use Sales Fuel Amount
          otherCharges: otherChargesSum, // Use Sum of Other Charges
          profitCharges: 0,
          isFromAPI: false,
          billed: awb.isBilled || false,
        }
        return calculateRowRate(initialRate)
      })
      setAwbRates(ratesFromAwb)
    } 
    // If rateSource is 'rates', we wait for user to select a type, or if logic exists elsewhere
  }, [allAwbs, selectedClientFranchise, startDate, endDate, searchTrackingNumber, searchCountry, hideBilled, rateSource, calculateRowRate])

  // Trigger Filter Application
  useEffect(() => {
    applyFiltersAndRates()
  }, [applyFiltersAndRates])

  // --- 5. Selection Logic (Fixed) ---
  const handleToggleSelectAll = (isChecked) => {
    setSelectAll(isChecked)
    if (isChecked) {
      // Only select visible, unbilled items
      const idsToSelect = filteredAwbs
        .filter(a => !a.isBilled)
        .map(a => a._id)
      setSelectedAwbs(idsToSelect)
    } else {
      setSelectedAwbs([])
    }
  }

  const handleToggleIndividual = (awbId) => {
    setSelectedAwbs(prev => {
      const isSelected = prev.includes(awbId)
      const newSelection = isSelected 
        ? prev.filter(id => id !== awbId) 
        : [...prev, awbId]
      
      // Update Select All State visually
      const unbilledCount = filteredAwbs.filter(a => !a.isBilled).length
      setSelectAll(newSelection.length === unbilledCount && unbilledCount > 0)
      
      return newSelection
    })
  }

  // --- 6. Recalculate Totals when Selection or Settings Change ---
  useEffect(() => {
    // Re-run calculation for all rates first (in case GST settings changed)
    const updatedRates = awbRates.map(rate => calculateRowRate(rate))
    
    // Check if we need to update state to avoid infinite loops
    // Simplified: We just calculate totals from the derived updatedRates
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
    
    // Only update awbRates state if the values actually changed significantly to avoid loops, 
    // or just rely on the fact that calculateRowRate is memoized on settings. 
    // Ideally, we shouldn't update awbRates inside a useEffect dependent on awbRates.
    // However, for UI inputs (editing baseCharge), we handle that in handleRateChange.
    // For Global GST toggle, we need to refresh the view.
    // Let's rely on the separate `useEffect` below for the `awbRates` update.

  }, [selectedAwbs, includeGST, gstType, rateSettings, awbRates.length]) // Dependent on length, not content to avoid loop

  // Effect to update visual rates when Tax Settings change globally
  useEffect(() => {
     setAwbRates(prev => prev.map(r => calculateRowRate(r)))
  }, [includeGST, gstType, rateSettings, calculateRowRate])


  // --- 7. API Rate Fetching ---
  const fetchRatesForAWBs = async (awbList) => {
    if (!selectedRateType) {
      setRateApiErrors(["Please select a rate type."])
      return
    }
    setLoadingRates(true)
    setRateApiErrors([])
    const errors = []

    const ratePromises = awbList.map(async (awb) => {
      const weight = calculateAWBWeight(awb)
      const country = awb.receiver?.country || "Unknown"

      try {
        const params = new URLSearchParams({
          type: selectedRateType,
          weight: weight.toString(),
          country,
          profitPercent: rateSettings.profitPercent.toString()
        })
        
        const response = await fetch(`/api/rate?${params}`, { headers: { "userType": "admin" } })

        if (!response.ok) throw new Error("Rate not found")
        const data = await response.json()

        const rateData = {
          awbId: awb._id,
          weight: safeParseFloat(data.calculatedWeight) || weight,
          service: data.service || selectedRateType,
          baseCharge: safeParseFloat(data.baseRate),
          fuelSurcharge: 0, 
          otherCharges: safeParseFloat(data.totalCharges),
          profitCharges: safeParseFloat(data.profitCharges),
          isFromAPI: true,
          billed: awb.isBilled || false,
        }
        return calculateRowRate(rateData)
      } catch (error) {
        // Fallback to existing data if API fails
        errors.push(`AWB ${awb.trackingNumber}: ${error.message}`)
        const salesData = awb.financials?.sales || {}
        const fallback = {
            awbId: awb._id,
            weight: weight,
            service: "Manual/Error",
            baseCharge: safeParseFloat(salesData.rates?.baseTotal) || 0,
            fuelSurcharge: 0,
            otherCharges: 0,
            profitCharges: 0,
            isFromAPI: false,
            billed: awb.isBilled || false
        }
        return calculateRowRate(fallback)
      }
    })

    const updatedRates = await Promise.all(ratePromises)
    setAwbRates(updatedRates)
    if(errors.length > 0) setRateApiErrors(errors)
    setLoadingRates(false)
  }

  // --- 8. Event Handlers ---
  const handleSelectClientFranchise = (item) => {
    setSelectedClientFranchise(item)
    setShowClientDropdown(false)
    setClientFranchiseSearch("")
    setBillingInfo({
      name: item.companyName || item.name || "",
      address: item.address || "",
      gst: item.gstNo || item.gst || ""
    })
    setSelectedAwbs([])
    setSelectAll(false)
  }

  const handleRateChange = (awbId, field, value) => {
    setAwbRates((prev) => prev.map((rate) => (
      rate.awbId === awbId ? calculateRowRate({ ...rate, [field]: safeParseFloat(value) }) : rate
    )))
  }

  const handleRateTypeChange = async (value) => {
    setSelectedRateType(value)
    if (rateSource === "rates" && value && filteredAwbs.length > 0) {
      await fetchRatesForAWBs(filteredAwbs)
    }
  }

  const saveBilling = async () => {
    if (!selectedClientFranchise) return alert("Select a client.")
    if (selectedAwbs.length === 0) return alert("Select at least one AWB.")

    setLoading(true)
    try {
      const formattedAwbs = awbRates
        .filter(rate => selectedAwbs.includes(rate.awbId))
        .map(rate => {
          const awb = allAwbs.find(a => a._id === rate.awbId)
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
        clientFranchiseCode: selectedClientFranchise.code,
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
        paid: totals.paid,
        balance: totals.balance,
      }

      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()
      
      alert(`Bill Saved: ${result.bill?.billNumber || 'Success'}`)
      
      // Update local state
      setAllAwbs(prev => prev.map(awb => selectedAwbs.includes(awb._id) ? { ...awb, isBilled: true } : awb))
      setSelectedAwbs([])
      setSelectAll(false)
      setTotals({ subtotal: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, total: 0, paid: 0, balance: 0 })
      
    } catch (err) {
      console.error(err)
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading && allAwbs.length === 0) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Loading Billing Data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="container mx-auto px-4 py-8 max-w-screen-2xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Bill</h1>
            <p className="text-gray-500 dark:text-gray-400">Select client, filter AWBs, and generate invoices.</p>
          </div>
          <Link href="/billing">
            <Button variant="outline">
              <ChevronRight className="w-4 h-4 mr-2" /> View History
            </Button>
          </Link>
        </div>

        {/* 1. Client Selection */}
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Select Client / Franchise
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="relative max-w-xl">
                <Button
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  variant="outline"
                  className="w-full justify-between h-12 text-left font-normal"
                >
                  <span className={selectedClientFranchise ? "text-gray-900 font-medium" : "text-gray-500"}>
                    {selectedClientFranchise
                      ? `${selectedClientFranchise.companyName || selectedClientFranchise.name} (${selectedClientFranchise.code})`
                      : "Search and select a client..."}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
                
                {showClientDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-xl z-50 max-h-80 overflow-hidden flex flex-col">
                    <div className="p-3 border-b bg-gray-50 dark:bg-gray-800">
                      <Input
                        placeholder="Type to search..."
                        value={clientFranchiseSearch}
                        onChange={(e) => setClientFranchiseSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                      {filteredClientFranchiseList.map((item) => (
                        <button
                          key={`${item.type}-${item.code}`}
                          onClick={() => handleSelectClientFranchise(item)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md flex justify-between items-center group transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{item.companyName || item.name}</p>
                            <p className="text-xs text-gray-500">{item.code} • {item.type.toUpperCase()}</p>
                          </div>
                          {selectedClientFranchise?.code === item.code && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                      ))}
                      {filteredClientFranchiseList.length === 0 && (
                        <div className="p-4 text-center text-gray-500">No results found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
          </CardContent>
        </Card>

        {selectedClientFranchise && (
          <>
            {/* 2. Filter AWBs */}
            <Card className="shadow-sm border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  Filter & Select AWBs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white dark:bg-gray-900" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white dark:bg-gray-900" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking No / C-Note</Label>
                    <Input value={searchTrackingNumber} onChange={(e) => setSearchTrackingNumber(e.target.value)} placeholder="Search..." className="bg-white dark:bg-gray-900" />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value={searchCountry} onChange={(e) => setSearchCountry(e.target.value)} placeholder="Filter country..." className="bg-white dark:bg-gray-900" />
                  </div>
                  <div className="flex items-center space-x-2 h-10">
                    <Switch id="hide-billed" checked={hideBilled} onCheckedChange={setHideBilled} />
                    <Label htmlFor="hide-billed">Hide Billed</Label>
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 flex justify-between items-center border-b">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-sm">
                        {filteredAwbs.length} Found 
                        {selectedAwbs.length > 0 && <span className="text-blue-600 ml-1">({selectedAwbs.length} Selected)</span>}
                      </span>
                    </div>
                  </div>
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
                        <TableRow>
                          <TableHead className="w-12 text-center">
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={(e) => handleToggleSelectAll(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                            />
                          </TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Tracking</TableHead>
                          <TableHead>Consignee</TableHead>
                          <TableHead>Dest.</TableHead>
                          <TableHead className="text-center">Weight</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAwbs.length > 0 ? (
                          filteredAwbs.map((awb) => {
                            const weight = calculateAWBWeight(awb)
                            const isSelected = selectedAwbs.includes(awb._id)
                            return (
                              <TableRow
                                key={awb._id}
                                className={`
                                  ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""} 
                                  ${awb.isBilled ? "opacity-50 grayscale bg-gray-50" : "hover:bg-gray-50 dark:hover:bg-gray-800"}
                                `}
                              >
                                <TableCell className="text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleIndividual(awb._id)}
                                    disabled={awb.isBilled}
                                    className="h-4 w-4 rounded border-gray-300 accent-blue-600"
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
                                <TableCell className="text-sm max-w-[150px] truncate" title={awb.receiver?.name}>
                                  {awb.receiver?.name || "N/A"}
                                </TableCell>
                                <TableCell className="text-sm">{awb.receiver?.country || "N/A"}</TableCell>
                                <TableCell className="text-center font-mono">{weight.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  {awb.isBilled ? <Badge variant="secondary">Billed</Badge> : <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Unbilled</Badge>}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                              No AWBs match your filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedAwbs.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                {/* 3. Rates Configuration */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="shadow-sm border-l-4 border-l-orange-500 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="bg-orange-100 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                        Rates & Charges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      {/* Source Selection */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <Label className="mb-3 block font-semibold">Rate Source</Label>
                        <RadioGroup value={rateSource} onValueChange={setRateSource} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Label htmlFor="src-awb" className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-all ${rateSource === 'awb' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-white'}`}>
                            <RadioGroupItem value="awb" id="src-awb" className="mt-1" />
                            <div>
                              <p className="font-medium">From AWB Data</p>
                              <p className="text-xs text-gray-500">Uses entered financials (Sales)</p>
                            </div>
                          </Label>
                          <Label htmlFor="src-rates" className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-all ${rateSource === 'rates' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-white'}`}>
                            <RadioGroupItem value="rates" id="src-rates" className="mt-1" />
                            <div>
                              <p className="font-medium">Calculate from Master</p>
                              <p className="text-xs text-gray-500">Fetches live rates from database</p>
                            </div>
                          </Label>
                        </RadioGroup>

                        {/* API Rate Controls */}
                        {rateSource === "rates" && (
                          <div className="mt-4 pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2">
                             <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                  <Label className="text-xs mb-1.5 block">Rate Type / Service</Label>
                                  <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={selectedRateType}
                                    onChange={(e) => handleRateTypeChange(e.target.value)}
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
                                <Button 
                                  onClick={() => fetchRatesForAWBs(filteredAwbs)} 
                                  disabled={loadingRates || !selectedRateType}
                                >
                                  {loadingRates ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                </Button>
                             </div>
                             {rateApiErrors.length > 0 && (
                               <div className="bg-red-50 text-red-700 p-3 rounded text-sm max-h-32 overflow-auto">
                                 <p className="font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Errors:</p>
                                 <ul className="list-disc ml-5 mt-1">{rateApiErrors.map((e,i) => <li key={i}>{e}</li>)}</ul>
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
                                const awb = allAwbs.find(a => a._id === rate.awbId)
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
                                        readOnly={rate.isFromAPI}
                                      />
                                    </TableCell>
                                    <TableCell className="p-1">
                                      <Input 
                                        type="number" 
                                        className="h-8 w-16 text-xs" 
                                        value={rate.fuelSurcharge} 
                                        onChange={(e) => handleRateChange(rate.awbId, "fuelSurcharge", e.target.value)}
                                        readOnly={rate.isFromAPI}
                                      />
                                    </TableCell>
                                    <TableCell className="p-1">
                                      <Input 
                                        type="number" 
                                        className="h-8 w-16 text-xs" 
                                        value={rate.otherCharges + rate.profitCharges} 
                                        onChange={(e) => handleRateChange(rate.awbId, "otherCharges", e.target.value)}
                                        readOnly={rate.isFromAPI}
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

                {/* 4. Billing Info & Summary */}
                <div className="space-y-6">
                   {/* Tax Settings */}
                   <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4"/> Tax Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center justify-between">
                         <Label htmlFor="gst-switch">Include GST</Label>
                         <Switch id="gst-switch" checked={includeGST} onCheckedChange={setIncludeGST} />
                       </div>
                       {includeGST && (
                         <div className="pt-2 border-t space-y-3 animate-in fade-in">
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

                   {/* Billing Details Input */}
                   <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4"/> Billing Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input placeholder="Billing Name" value={billingInfo.name} onChange={(e) => setBillingInfo(p => ({...p, name: e.target.value}))} />
                      <Input placeholder="GST Number" value={billingInfo.gst} onChange={(e) => setBillingInfo(p => ({...p, gst: e.target.value}))} />
                      <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Address" 
                        value={billingInfo.address} 
                        onChange={(e) => setBillingInfo(p => ({...p, address: e.target.value}))} 
                      />
                    </CardContent>
                   </Card>

                   {/* Final Summary Card (Sticky in large view if needed, but here inline) */}
                   <Card className="shadow-md bg-slate-900 text-white border-none">
                     <CardHeader>
                       <CardTitle className="text-lg">Invoice Summary</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm opacity-80">
                          <span>Subtotal</span>
                          <span>₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        {includeGST && (
                          <div className="flex justify-between text-sm opacity-80">
                            <span>Tax ({gstType === 'igst' ? 'IGST' : 'CGST+SGST'})</span>
                            <span>₹{(totals.cgstAmount + totals.sgstAmount + totals.igstAmount).toFixed(2)}</span>
                          </div>
                        )}
                        <Separator className="bg-slate-700 my-2" />
                        <div className="flex justify-between text-xl font-bold">
                          <span>Total</span>
                          <span>₹{totals.total.toFixed(2)}</span>
                        </div>
                        
                        <div className="pt-4">
                           <Label className="text-slate-300 text-xs">Paid Amount</Label>
                           <Input 
                             type="number" 
                             className="bg-slate-800 border-slate-700 text-white" 
                             value={totals.paid} 
                             onChange={(e) => setTotals(p => ({...p, paid: safeParseFloat(e.target.value), balance: p.total - safeParseFloat(e.target.value)}))} 
                           />
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 text-green-400">
                          <span>Balance</span>
                          <span>₹{totals.balance.toFixed(2)}</span>
                        </div>
                     </CardContent>
                   </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Bar */}
      {selectedAwbs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
          <div className="container mx-auto flex justify-between items-center max-w-screen-2xl">
            <div className="hidden md:block">
               <p className="font-semibold">{selectedAwbs.length} Items Selected</p>
               <p className="text-sm text-gray-500">Total: ₹{totals.total.toFixed(2)}</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button variant="secondary" className="flex-1 md:flex-none" onClick={() => setShowInvoicePreview(true)}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </Button>
              <Button className="flex-1 md:flex-none bg-green-600 hover:bg-green-700" onClick={saveBilling} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2" />}
                Save Bill
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showInvoicePreview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <Card className="w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50 dark:bg-gray-800">
                <CardTitle>Invoice Preview</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowInvoicePreview(false)}>✕</Button>
              </CardHeader>
              <CardContent className="overflow-y-auto p-8 space-y-6">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="font-bold text-lg">{billingInfo.name || "Client Name"}</h3>
                      <p className="whitespace-pre-line text-sm text-gray-600">{billingInfo.address || "Address"}</p>
                      {billingInfo.gst && <p className="text-sm mt-1">GSTIN: {billingInfo.gst}</p>}
                   </div>
                   <div className="text-right">
                      <Badge variant={includeGST ? "default" : "secondary"}>{includeGST ? "Tax Invoice" : "Non-GST"}</Badge>
                      <p className="text-sm text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
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
                       const awb = allAwbs.find(a => a._id === rate.awbId)
                       return (
                         <TableRow key={rate.awbId}>
                           <TableCell>{i + 1}</TableCell>
                           <TableCell>
                             <div className="font-medium">{awb?.trackingNumber}</div>
                             <div className="text-xs text-gray-500">{awb?.receiver?.country} - {awb?.receiver?.name}</div>
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

                <div className="flex justify-end pt-4 border-t">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{totals.subtotal.toFixed(2)}</span></div>
                    {includeGST && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Tax ({gstType}):</span>
                        <span>{(totals.cgstAmount + totals.sgstAmount + totals.igstAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 justify-end gap-2 border-t py-3">
                 <Button variant="outline" onClick={() => setShowInvoicePreview(false)}>Close</Button>
                 <Button onClick={saveBilling} className="bg-green-600 hover:bg-green-700">Confirm & Save</Button>
              </CardFooter>
            </Card>
          </div>
        )}
    </div>
  )
}

export default isAdminAuth(BillingCreatePage)