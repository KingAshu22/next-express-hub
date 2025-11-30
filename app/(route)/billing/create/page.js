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
import { Save, Package, Loader2, ChevronDown, Check, ChevronRight, Eye, Settings, AlertCircle, Percent } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import isAdminAuth from "@/lib/isAdminAuth"

// --- Helper Functions ---
const safeParseFloat = (val) => {
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
}

const calculateAWBWeight = (awb) => {
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

    if (chargeableWeight > 0) {
      return sum + chargeableWeight
    }
    return sum + Math.max(actualWeight, dimensionalWeight)
  }, 0)
}

const getBoxCount = (awb) => {
  if (!awb?.boxes || !Array.isArray(awb.boxes)) {
    return 0
  }
  return awb.boxes.length
}

// --- Main Component ---
function BillingCreatePage() {
  // State Management
  const [allAwbs, setAllAwbs] = useState([])
  const [filteredAwbs, setFilteredAwbs] = useState([])
  const [selectedAwbs, setSelectedAwbs] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [awbRates, setAwbRates] = useState([])

  // Filters & Toggles
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchTrackingNumber, setSearchTrackingNumber] = useState("")
  const [searchCountry, setSearchCountry] = useState("")
  
  // Default hideBilled to true
  const [hideBilled, setHideBilled] = useState(true)

  // Client/Franchise Selection
  const [clientFranchiseList, setClientFranchiseList] = useState([])
  const [clientFranchiseSearch, setClientFranchiseSearch] = useState("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedClientFranchise, setSelectedClientFranchise] = useState(null)

  // Billing Info
  const [billingInfo, setBillingInfo] = useState({ name: "", address: "", gst: "" })

  // GST Toggle
  const [includeGST, setIncludeGST] = useState(true)
  const [gstType, setGstType] = useState("cgst_sgst")

  // Rate Settings & Source
  const [rateSource, setRateSource] = useState("awb")
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

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch Bills specifically to check against the schema
        const [awbsRes, clientsRes, franchisesRes, ratesRes, billsRes] = await Promise.all([
          fetch("/api/awb?fetchAll=true"),
          fetch("/api/clients"),
          fetch("/api/franchises"),
          fetch("/api/rates", { headers: { "userType": "admin" } }),
          fetch("/api/billing"), // Fetching all bills to cross-reference
        ])

        const awbsData = await awbsRes.json()
        const clientsData = await clientsRes.json()
        const franchisesData = await franchisesRes.json()
        const ratesData = await ratesRes.json()
        const billsResult = await billsRes.json()

        // 1. Extract all AWB IDs that exist in the Billing Schema
        const billsList = billsResult.data || billsResult || []
        const billedAwbIds = new Set()
        
        billsList.forEach(bill => {
          if (bill.awbs && Array.isArray(bill.awbs)) {
            bill.awbs.forEach(item => {
              // Handle both populated object or direct string ID
              const id = typeof item.awbId === 'object' ? item.awbId._id : item.awbId
              if (id) billedAwbIds.add(id.toString())
            })
          }
        })

        // 2. Process AWBs and enforce isBilled status based on Billing Schema
        const rawAwbs = awbsData.data || awbsData || []
        const processedAwbs = rawAwbs.map(awb => ({
          ...awb,
          // An AWB is billed if the flag says so OR if it exists in the Billing collection
          isBilled: awb.isBilled || billedAwbIds.has(awb._id)
        }))

        setAllAwbs(processedAwbs)
        setAvailableRates(ratesData.data || ratesData || [])

        const combined = [
          ...(clientsData.data || clientsData || []).map((c) => ({
            ...c,
            type: "client",
            code: c.code || c.refCode || c._id,
          })),
          ...(franchisesData.data || franchisesData || []).map((f) => ({
            ...f,
            type: "franchise",
            code: f.code || f.refCode || f._id,
          })),
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

  // --- Memoized Values ---
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

  // --- Core Logic & Effects ---
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
  }, [includeGST, gstType, rateSettings.cgst, rateSettings.sgst, rateSettings.igst])

  const applyFiltersAndRates = useCallback(() => {
    // 1. Filter by Client
    let result = allAwbs.filter((awb) =>
      selectedClientFranchise ? awb.refCode === selectedClientFranchise.code : true
    )

    // 2. Filter by Billed Status (Checking the computed isBilled property)
    if (hideBilled) {
      result = result.filter(awb => awb.isBilled !== true)
    }

    // 3. Filter by Date
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

    // 4. Search Filters
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

    // Calculate Rates based on source
    if (rateSource === "awb") {
      const ratesFromAwb = result.map((awb) => {
        const rateInfo = awb.rateInfo || {}
        const calculatedWeight = calculateAWBWeight(awb)

        const initialRate = {
          awbId: awb._id,
          weight: safeParseFloat(rateInfo.weight) || calculatedWeight,
          service: rateInfo?.courier || rateInfo?.service || awb.cNoteVendorName || "N/A",
          baseCharge: safeParseFloat(rateInfo.baseCharge) || safeParseFloat(rateInfo.baseRate),
          fuelSurcharge: safeParseFloat(rateInfo.fuelSurcharge) || safeParseFloat(rateInfo.fuelCharges),
          otherCharges: safeParseFloat(rateInfo.otherCharges) || safeParseFloat(rateInfo.extraCharges),
          profitCharges: safeParseFloat(rateInfo.profitCharges) || 0,
          isFromAPI: false,
          billed: awb.isBilled || false,
        }
        return calculateRowRate(initialRate)
      })
      setAwbRates(ratesFromAwb)
    } else if (rateSource === "rates" && selectedRateType) {
      // Fetch if rates array is empty or mismatched
      if(awbRates.length === 0 || awbRates.length !== result.length) {
         fetchRatesForAWBs(result)
      }
    }
  }, [allAwbs, selectedClientFranchise, startDate, endDate, searchTrackingNumber, searchCountry, hideBilled, rateSource, selectedRateType, calculateRowRate])

  useEffect(() => {
    applyFiltersAndRates()
  }, [applyFiltersAndRates])

  useEffect(() => {
    setSelectedAwbs(selectAll ? filteredAwbs.map((awb) => awb._id) : [])
  }, [selectAll, filteredAwbs])

  useEffect(() => {
    setAwbRates(prevRates => prevRates.map(rate => calculateRowRate(rate)))
  }, [includeGST, gstType, rateSettings.cgst, rateSettings.sgst, rateSettings.igst, calculateRowRate])

  useEffect(() => {
    const selectedRateObjects = awbRates.filter((rate) => selectedAwbs.includes(rate.awbId))
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
  }, [selectedAwbs, awbRates, includeGST, gstType])

  // --- API Handlers ---
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

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API error for ${awb.trackingNumber}: ${errorText}`)
        }

        const data = await response.json()

        const rateData = {
          awbId: awb._id,
          weight: safeParseFloat(data.calculatedWeight) || safeParseFloat(data.inputWeight) || weight,
          service: data.service || data.originalName || selectedRateType,
          baseCharge: safeParseFloat(data.baseRate),
          fuelSurcharge: 0, 
          otherCharges: safeParseFloat(data.totalCharges),
          profitCharges: safeParseFloat(data.profitCharges),
          subtotal: safeParseFloat(data.subtotalBeforeGST),
          gstAmount: includeGST ? safeParseFloat(data.gstAmount) : 0,
          total: includeGST ? safeParseFloat(data.total) : safeParseFloat(data.subtotalBeforeGST),
          isFromAPI: true,
          billed: awb.isBilled || false,
        }

        if (includeGST) {
          const taxRate = gstType === "igst" ? rateSettings.igst : (rateSettings.cgst + rateSettings.sgst)
          rateData.gstAmount = (rateData.subtotal * taxRate) / 100
          rateData.total = rateData.subtotal + rateData.gstAmount
        }

        return rateData
      } catch (error) {
        console.error(`Error fetching rate for AWB ${awb.trackingNumber}:`, error)
        errors.push(`Failed to fetch rate for AWB ${awb.trackingNumber}: ${error.message}`)
        
        const rateInfo = awb.rateInfo || {}
        const fallbackRate = {
          awbId: awb._id,
          weight: safeParseFloat(rateInfo.weight) || weight,
          service: rateInfo?.courier || awb.cNoteVendorName || "N/A",
          baseCharge: safeParseFloat(rateInfo.baseCharge),
          fuelSurcharge: safeParseFloat(rateInfo.fuelSurcharge),
          otherCharges: safeParseFloat(rateInfo.otherCharges),
          profitCharges: 0,
          isFromAPI: false,
          billed: awb.isBilled || false,
        }
        return calculateRowRate(fallbackRate)
      }
    })

    const updatedRates = await Promise.all(ratePromises)
    setAwbRates(updatedRates)
    setRateApiErrors(errors)
    setLoadingRates(false)
  }

  // --- Event Handlers ---
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

  const handleAWBSelection = (awbId) => {
    setSelectedAwbs((prev) => (
      prev.includes(awbId) ? prev.filter((id) => id !== awbId) : [...prev, awbId]
    ))
    setSelectAll(false)
  }

  const handleRateChange = (awbId, field, value) => {
    setAwbRates((prev) => prev.map((rate) => (
      rate.awbId === awbId ? calculateRowRate({ ...rate, [field]: safeParseFloat(value) }) : rate
    )))
  }

  const handlePaidAmountChange = (value) => {
    const paid = safeParseFloat(value)
    setTotals((prev) => ({ ...prev, paid, balance: prev.total - paid }))
  }

  const handleRateSourceChange = (value) => {
    setRateSource(value)
    if (value === "awb") {
      applyFiltersAndRates()
    }
  }

  const handleRateTypeChange = async (value) => {
    setSelectedRateType(value)
    if (rateSource === "rates" && value && filteredAwbs.length > 0) {
      await fetchRatesForAWBs(filteredAwbs)
    }
  }

  const handleGSTTypeChange = (value) => {
    setGstType(value)
  }

  const handleProfitPercentChange = (value) => {
    setRateSettings(p => ({ ...p, profitPercent: safeParseFloat(value) }))
  }

  const handleRefetchRates = async () => {
    if (rateSource === "rates" && selectedRateType && filteredAwbs.length > 0) {
      await fetchRatesForAWBs(filteredAwbs)
    }
  }

  const saveBilling = async () => {
    if (!selectedClientFranchise) {
      alert("Please select a client or franchise.")
      return
    }
    if (selectedAwbs.length === 0) {
      alert("Please select at least one AWB to bill.")
      return
    }

    setLoading(true)
    try {
      // Construct AWB array matching Schema
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
        billingInfo: {
            name: billingInfo.name,
            address: billingInfo.address,
            gst: billingInfo.gst
        },
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

      if (!res.ok) throw new Error(`Failed to save bill: ${await res.text()}`)

      const result = await res.json()

      alert(`Bill Saved Successfully! Bill Number: ${result.bill?.billNumber || result.billNumber || 'Created'}`)

      // Update local state to mark as billed
      setAllAwbs(prevAwbs => prevAwbs.map(awb =>
        selectedAwbs.includes(awb._id) ? { ...awb, isBilled: true } : awb
      ))

      // Reset form
      setSelectedAwbs([])
      setSelectedClientFranchise(null)
      setSelectAll(false)
      setBillingInfo({ name: "", address: "", gst: "" })
      setTotals({ subtotal: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, total: 0, paid: 0, balance: 0 })
    } catch (err) {
      console.error(err)
      alert(`Error saving bill: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // --- JSX ---
  if (loading && allAwbs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-4 text-lg">Loading Data...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Create New Bill
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Generate an invoice for selected Air Waybills.
            </p>
          </div>
          <Link href="/billing">
            <Button variant="outline">
              <ChevronRight className="w-4 h-4 mr-2" />
              View All Bills
            </Button>
          </Link>
        </div>

        {/* Step 1: Select Client/Franchise */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg">1</Badge>
              Select Client or Franchise
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="font-semibold">Client / Franchise</Label>
              <div className="relative">
                <Button
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>
                    {selectedClientFranchise
                      ? `${selectedClientFranchise.companyName || selectedClientFranchise.name} (${selectedClientFranchise.type}) - Code: ${selectedClientFranchise.code}`
                      : "Search and select..."}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {showClientDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search by name or code..."
                        value={clientFranchiseSearch}
                        onChange={(e) => setClientFranchiseSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredClientFranchiseList.length > 0 ? (
                        filteredClientFranchiseList.map((item) => (
                          <button
                            key={`${item.type}-${item.code}`}
                            onClick={() => handleSelectClientFranchise(item)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center border-b last:border-b-0"
                          >
                            <div>
                              <p className="font-medium">{item.companyName || item.name}</p>
                              <p className="text-sm text-gray-500">Code: {item.code}</p>
                            </div>
                            <Badge variant="outline">{item.type}</Badge>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">No results found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedClientFranchise && (
                <div className="p-4 mt-4 bg-green-50 dark:bg-green-900/50 rounded-lg border border-green-200 dark:border-green-800 flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      {selectedClientFranchise.companyName || selectedClientFranchise.name}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                      Code: {selectedClientFranchise.code} | {filteredAwbs.length} billable AWBs found for this selection.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Filter AWBs */}
        {selectedClientFranchise && (
          <Card className="mb-8 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary" className="text-lg">2</Badge>
                Filter & Select AWBs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tracking No.</Label>
                  <Input
                    value={searchTrackingNumber}
                    onChange={(e) => setSearchTrackingNumber(e.target.value)}
                    placeholder="Search tracking no..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={searchCountry}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    placeholder="Filter by country..."
                  />
                </div>
                <div className="flex items-center space-x-2 pb-2">
                  <Switch
                    id="hide-billed"
                    checked={hideBilled}
                    onCheckedChange={setHideBilled}
                  />
                  <Label htmlFor="hide-billed">Hide Billed AWBs</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">
                    {selectedAwbs.length} of {filteredAwbs.length} AWBs selected
                  </p>
                  <Button
                    onClick={() => setSelectAll(!selectAll)}
                    variant={selectAll ? "destructive" : "default"}
                    size="sm"
                  >
                    {selectAll ? "Deselect All" : "Select All"}
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border max-h-[50vh]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={(e) => setSelectAll(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Tracking No.</TableHead>
                        <TableHead>C-Note</TableHead>
                        <TableHead>Consignee</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Boxes</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAwbs.length > 0 ? (
                        filteredAwbs.map((awb) => {
                          const weight = calculateAWBWeight(awb)
                          const boxCount = getBoxCount(awb)
                          return (
                            <TableRow
                              key={awb._id}
                              data-state={selectedAwbs.includes(awb._id) && "selected"}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${awb.isBilled ? 'opacity-50' : ''}`}
                            >
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedAwbs.includes(awb._id)}
                                  onChange={() => handleAWBSelection(awb._id)}
                                  className="h-4 w-4 rounded border-gray-300"
                                  disabled={awb.isBilled}
                                />
                              </TableCell>
                              <TableCell>
                                {new Date(awb.date).toLocaleDateString("en-IN")}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{awb.trackingNumber || 'N/A'}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">{awb.cNoteNumber || 'N/A'}</span>
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {awb.receiver?.name || "N/A"}
                              </TableCell>
                              <TableCell>{awb.receiver?.country || "N/A"}</TableCell>
                              <TableCell className="text-center">{boxCount}</TableCell>
                              <TableCell className="font-semibold">
                                {weight.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {awb.isBilled ? (
                                  <Badge variant="secondary">Billed</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-green-600 border-green-400">
                                    Unbilled
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No billable AWBs found with selected filters.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Configure Rates */}
        {selectedAwbs.length > 0 && (
          <Card className="mb-8 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary" className="text-lg">3</Badge>
                Configure Rates & Charges
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <Label className="text-base font-semibold">Rate Calculation Source</Label>
                  <RadioGroup
                    value={rateSource}
                    onValueChange={handleRateSourceChange}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="awb"
                      className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <RadioGroupItem value="awb" id="awb" className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">From AWB Data</p>
                        <p className="text-sm text-gray-500">
                          Use (and edit) rates from the original AWB record.
                        </p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="rates"
                      className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <RadioGroupItem value="rates" id="rates" className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">From Rate Master</p>
                        <p className="text-sm text-gray-500">
                          Fetch definitive rates from the database.
                        </p>
                      </div>
                    </Label>
                  </RadioGroup>

                  {rateSource === "rates" && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold mb-2 block">Select Rate Type</Label>
                          <select
                            value={selectedRateType}
                            onChange={(e) => handleRateTypeChange(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select a rate type...</option>
                            {availableRates.map((rate) => (
                              <option key={rate._id} value={rate.originalName || rate.name}>
                                {rate.originalName || rate.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block">Profit Margin %</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="number"
                                value={rateSettings.profitPercent}
                                onChange={(e) => handleProfitPercentChange(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <Button 
                              onClick={handleRefetchRates} 
                              disabled={loadingRates || !selectedRateType}
                              variant="secondary"
                            >
                              {loadingRates ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                            </Button>
                          </div>
                        </div>
                      </div>
                      {loadingRates && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Fetching rates from server...
                        </div>
                      )}
                      {rateApiErrors.length > 0 && (
                        <div className="text-red-600 text-sm space-y-1 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                          {rateApiErrors.map((e, i) => (
                            <p key={i} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> 
                              <span>{e}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Card className="bg-gray-50 dark:bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Tax Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border">
                      <Label htmlFor="include-gst" className="font-medium">Include GST</Label>
                      <Switch
                        id="include-gst"
                        checked={includeGST}
                        onCheckedChange={setIncludeGST}
                      />
                    </div>

                    {includeGST && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">GST Type</Label>
                          <RadioGroup
                            value={gstType}
                            onValueChange={handleGSTTypeChange}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="cgst_sgst" id="cgst_sgst" />
                              <Label htmlFor="cgst_sgst" className="text-sm">CGST + SGST</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="igst" id="igst" />
                              <Label htmlFor="igst" className="text-sm">IGST</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {gstType === "cgst_sgst" ? (
                          <>
                            <div className="grid grid-cols-2 gap-3 items-center">
                              <Label className="text-sm">CGST %</Label>
                              <Input
                                type="number"
                                value={rateSettings.cgst}
                                onChange={(e) => setRateSettings(p => ({ ...p, cgst: safeParseFloat(e.target.value) }))}
                                className="h-9"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3 items-center">
                              <Label className="text-sm">SGST %</Label>
                              <Input
                                type="number"
                                value={rateSettings.sgst}
                                onChange={(e) => setRateSettings(p => ({ ...p, sgst: safeParseFloat(e.target.value) }))}
                                className="h-9"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 items-center">
                            <Label className="text-sm">IGST %</Label>
                            <Input
                              type="number"
                              value={rateSettings.igst}
                              onChange={(e) => setRateSettings(p => ({ ...p, igst: safeParseFloat(e.target.value) }))}
                              className="h-9"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {!includeGST && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          GST is disabled. Bill will be generated without tax.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Rate Details for Selected AWBs</Label>
                  {rateSource === "rates" && (
                    <Button 
                      onClick={handleRefetchRates} 
                      disabled={loadingRates || !selectedRateType}
                      variant="outline"
                      size="sm"
                    >
                      {loadingRates ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Refresh Rates
                    </Button>
                  )}
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead>Date</TableHead>
                        <TableHead>Tracking #</TableHead>
                        <TableHead>Consignee</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Base (₹)</TableHead>
                        <TableHead>Other (₹)</TableHead>
                        <TableHead>Subtotal (₹)</TableHead>
                        {includeGST && <TableHead>GST (₹)</TableHead>}
                        <TableHead>Total (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {awbRates.filter((r) => selectedAwbs.includes(r.awbId)).map((rate) => {
                        const awb = filteredAwbs.find((a) => a._id === rate.awbId)
                        const isReadOnly = rate.isFromAPI
                        return (
                          <TableRow key={rate.awbId} data-state="selected">
                            <TableCell>
                              {awb ? new Date(awb.date).toLocaleDateString("en-IN") : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{awb?.trackingNumber || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell className="font-medium max-w-[120px] truncate">
                              {awb?.receiver?.name || 'N/A'}
                            </TableCell>
                            <TableCell className="font-medium">{rate.weight.toFixed(2)}</TableCell>
                            <TableCell>{awb?.receiver?.country || "N/A"}</TableCell>
                            <TableCell>
                              <span className="text-xs">{rate.service}</span>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={rate.baseCharge}
                                onChange={(e) => handleRateChange(rate.awbId, "baseCharge", e.target.value)}
                                className="w-24 h-8"
                                readOnly={isReadOnly}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={rate.otherCharges + rate.profitCharges}
                                onChange={(e) => handleRateChange(rate.awbId, "otherCharges", e.target.value)}
                                className="w-24 h-8"
                                readOnly={isReadOnly}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{rate.subtotal.toFixed(2)}</TableCell>
                            {includeGST && (
                              <TableCell className="font-medium text-orange-600">
                                {rate.gstAmount.toFixed(2)}
                              </TableCell>
                            )}
                            <TableCell className="font-bold text-blue-600">{rate.total.toFixed(2)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4 & 5: Billing Info, Summary & Actions */}
        {selectedAwbs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <Card className="lg:col-span-3 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg">4</Badge>
                  Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Billing Name</Label>
                  <Input
                    value={billingInfo.name}
                    onChange={(e) => setBillingInfo(p => ({ ...p, name: e.target.value }))}
                    placeholder="Company/Individual Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GST Number {!includeGST && "(Optional)"}</Label>
                  <Input
                    value={billingInfo.gst}
                    onChange={(e) => setBillingInfo(p => ({ ...p, gst: e.target.value }))}
                    placeholder="GSTIN"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Billing Address</Label>
                  <textarea
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo(p => ({ ...p, address: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full billing address"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg">5</Badge>
                  Billing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal ({selectedAwbs.length} AWBs)
                    </span>
                    <span className="font-semibold text-lg">₹{totals.subtotal.toFixed(2)}</span>
                  </div>

                  {includeGST && gstType === "cgst_sgst" && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600 dark:text-gray-400">
                          CGST ({rateSettings.cgst}%)
                        </span>
                        <span className="font-semibold">₹{totals.cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600 dark:text-gray-400">
                          SGST ({rateSettings.sgst}%)
                        </span>
                        <span className="font-semibold">₹{totals.sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {includeGST && gstType === "igst" && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 dark:text-gray-400">
                        IGST ({rateSettings.igst}%)
                      </span>
                      <span className="font-semibold">₹{totals.igstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {!includeGST && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="font-semibold text-gray-400">No GST</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-4 bg-gray-50 dark:bg-gray-800 px-4 rounded-lg">
                    <span className="font-bold text-xl">Grand Total</span>
                    <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                      ₹{totals.total.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-600 dark:text-gray-400">Paid Amount</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={totals.paid}
                      onChange={(e) => handlePaidAmountChange(e.target.value)}
                      className="w-40 text-right"
                    />
                  </div>

                  <div className="flex justify-between items-center py-4 bg-gray-50 dark:bg-gray-800 px-4 rounded-lg">
                    <span className="font-bold text-lg">Balance Due</span>
                    <span className={`font-bold text-2xl ${totals.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₹{totals.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-4 bg-gray-50 dark:bg-gray-800/50 justify-end p-6">
                <Button
                  variant="outline"
                  onClick={() => setShowInvoicePreview(true)}
                  size="lg"
                  disabled={loading}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={saveBilling}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Bill
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Invoice Preview Modal */}
        {showInvoicePreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Invoice Preview</CardTitle>
                <Button variant="ghost" onClick={() => setShowInvoicePreview(false)}>✕</Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Bill To:</h3>
                    <p className="font-medium">{billingInfo.name}</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{billingInfo.address}</p>
                    {billingInfo.gst && <p className="text-sm mt-1">GST: {billingInfo.gst}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString("en-IN")}</p>
                    <p className="text-sm text-gray-600">AWBs: {selectedAwbs.length}</p>
                    {!includeGST && (
                      <Badge variant="outline" className="mt-2">Non-GST Invoice</Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Consignee</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {awbRates.filter(r => selectedAwbs.includes(r.awbId)).map((rate, index) => {
                      const awb = allAwbs.find(a => a._id === rate.awbId)
                      return (
                        <TableRow key={rate.awbId}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{awb?.trackingNumber}</TableCell>
                          <TableCell>{awb?.receiver?.name}</TableCell>
                          <TableCell>{rate.weight.toFixed(2)} kg</TableCell>
                          <TableCell>{awb?.receiver?.country}</TableCell>
                          <TableCell className="text-xs">{rate.service}</TableCell>
                          <TableCell className="text-right">{rate.subtotal.toFixed(2)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                <Separator />

                <div className="flex justify-end">
                  <div className="w-72 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {includeGST && gstType === "cgst_sgst" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>CGST ({rateSettings.cgst}%):</span>
                          <span>₹{totals.cgstAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>SGST ({rateSettings.sgst}%):</span>
                          <span>₹{totals.sgstAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    {includeGST && gstType === "igst" && (
                      <div className="flex justify-between text-sm">
                        <span>IGST ({rateSettings.igst}%):</span>
                        <span>₹{totals.igstAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {!includeGST && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Tax:</span>
                        <span>No GST</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>₹{totals.total.toFixed(2)}</span>
                    </div>
                    {totals.paid > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Paid:</span>
                          <span>₹{totals.paid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-red-600">
                          <span>Balance:</span>
                          <span>₹{totals.balance.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-4">
                <Button variant="outline" onClick={() => setShowInvoicePreview(false)}>Close</Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default isAdminAuth(BillingCreatePage)