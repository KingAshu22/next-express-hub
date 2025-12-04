"use client"

import { useState, useEffect, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Calculator, Save, ArrowLeft, RefreshCcw, CreditCard, FileText } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import { format } from "date-fns"

// ✅ Dynamic Editor Import
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <p className="p-4">Loading editor...</p>,
});
import "react-quill-new/dist/quill.snow.css";

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ],
};

// --- CONSTANTS ---
const PREDEFINED_CHARGES = [
  "AWB Charge", "Clearance Charges", "Electronic Extra", "ESS", "FDA",
  "FDA CHARGES", "IMMITATION", "MEDICINE", "OVER WEIGHT", "Overweight Piece",
  "PACKING CHARGES", "PICKLE PACKING", "VACCUM PACKING", "Address Correction",
  "Remote Area", "Handling",
]

const SERVICE_OPTIONS = ["DHL", "FedEx", "UPS", "Aramex", "Self", "Express", "Economy"]

const INTERNAL_COST_TYPES = [
  "Box Charges", "Pickup Charges", "Packing Material",
  "Local Transportation", "Labor Cost", "Other Operational",
]

const PAYMENT_MODES = ["Cash", "Cheque", "UPI", "Bank Transfer"]

// --- HELPER: Calculate Weights ---
const calculateBoxWeights = (boxes) => {
  if (!boxes || !Array.isArray(boxes) || boxes.length === 0) {
    return { actual: 0, volume: 0, chargeable: 0 }
  }

  return boxes.reduce((acc, box) => {
    const act = parseFloat(box.actualWeight) || 0
    const dim = parseFloat(box.dimensionalWeight) || 0
    const chg = parseFloat(box.chargeableWeight) || Math.max(act, dim)

    return {
      actual: acc.actual + act,
      volume: acc.volume + dim,
      chargeable: acc.chargeable + chg
    }
  }, { actual: 0, volume: 0, chargeable: 0 })
}

// --- COMPONENT: Financial Column ---
const FinancialColumn = ({
  title, data, type, colorClass, onInputChange, onAddCharge, onRemoveCharge
}) => {
  const isSales = type === 'sales'
  const isCustomService = isSales && data.serviceType && !SERVICE_OPTIONS.includes(data.serviceType)
  const v = (val) => (val === null || val === undefined) ? "" : val

  return (
    <Card className={`border-t-4 ${colorClass} shadow-md`}>
      <CardHeader className="pb-2 bg-gray-50/50">
        <CardTitle className="text-lg font-bold uppercase flex justify-between items-center">
          {title}
          <Badge variant="outline" className="text-xs font-normal bg-white">
            {isSales ? 'Customer Invoice' : 'Vendor Bill'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-3 gap-2 items-center">
          <Label className="text-right text-xs text-gray-500">Company</Label>
          <Input className="col-span-2 h-8 text-sm" value={v(data.companyName)} onChange={(e) => onInputChange(type, "root", "companyName", e.target.value)} />
          {isSales && (
            <>
              <Label className="text-right text-xs text-gray-500">Service</Label>
              <div className="col-span-2 space-y-2">
                <Select value={v(isCustomService ? "Other" : data.serviceType)} onValueChange={(val) => { if (val === "Other") onInputChange(type, "root", "serviceType", ""); else onInputChange(type, "root", "serviceType", val) }}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Service" /></SelectTrigger>
                  <SelectContent>{SERVICE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}<SelectItem value="Other">Other (Type Custom)</SelectItem></SelectContent>
                </Select>
                {(isCustomService || data.serviceType === "") && (<Input placeholder="Type service name..." className="h-8 text-sm" value={v(data.serviceType)} onChange={(e) => onInputChange(type, "root", "serviceType", e.target.value)} />)}
              </div>
            </>
          )}
        </div>
        <Separator />
        <div className="grid grid-cols-3 gap-2 items-center">
          <Label className="text-right text-xs text-gray-500">Actual Wt</Label>
          <div className="col-span-2 flex gap-1"><Input type="number" className="h-8 text-sm" value={v(data.weight.actual)} onChange={(e) => onInputChange(type, "weight", "actual", e.target.value)} /><div className="flex items-center justify-center px-2 text-xs text-gray-400 border rounded bg-gray-50"><RefreshCcw className="h-3 w-3" /></div></div>
          <Label className="text-right text-xs text-gray-500">Volume Wt</Label>
          <div className="col-span-2 flex gap-1"><Input type="number" className="h-8 text-sm" value={v(data.weight.volume)} onChange={(e) => onInputChange(type, "weight", "volume", e.target.value)} /><div className="flex items-center justify-center px-2 text-xs text-gray-400 border rounded bg-gray-50"><RefreshCcw className="h-3 w-3" /></div></div>
          <Label className="text-right text-xs font-bold">Chargeable Wt</Label>
          <div className="col-span-2 flex gap-1"><Input type="number" className="h-8 text-sm font-bold bg-blue-50" value={v(data.weight.chargeable)} onChange={(e) => onInputChange(type, "weight", "chargeable", e.target.value)} /><div className="flex items-center justify-center px-2 text-xs text-gray-400 border rounded bg-gray-50"><RefreshCcw className="h-3 w-3" /></div></div>
          <Label className="text-right text-xs text-gray-500">Rate / Kg</Label>
          <Input type="number" className="col-span-2 h-8 text-sm" value={v(data.rates.ratePerKg)} onChange={(e) => onInputChange(type, "rates", "ratePerKg", e.target.value)} />
          <Label className="text-right text-xs font-bold">Base Amount</Label>
          <Input type="number" className="col-span-2 h-8 text-sm font-bold bg-gray-100" value={v(data.rates.baseTotal)} onChange={(e) => onInputChange(type, "rates", "baseTotal", e.target.value)} />
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex justify-between items-center"><Label className="text-xs font-semibold text-gray-600">Other Charges</Label><Button size="sm" variant="ghost" className="h-6 text-xs text-blue-600 hover:text-blue-800" onClick={() => onAddCharge(type)}><Plus className="h-3 w-3 mr-1" /> Add</Button></div>
          {data.charges.otherCharges.map((charge, idx) => (<div key={idx} className="grid grid-cols-3 gap-2 items-center group"><Label className="text-right text-xs text-gray-500 truncate" title={charge.name}>{charge.name}</Label><div className="col-span-2 flex gap-1"><Input readOnly className="h-7 text-sm flex-1 bg-gray-50" value={v(charge.amount)} /><Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 opacity-0 group-hover:opacity-100" onClick={() => onRemoveCharge(type, idx)}><Trash2 className="h-3 w-3" /></Button></div></div>))}
        </div>
        <div className="grid grid-cols-3 gap-2 items-center"><Label className="text-right text-xs text-gray-500">AWB Charge</Label><Input type="number" className="col-span-2 h-8 text-sm" value={v(data.charges.awbCharge)} onChange={(e) => onInputChange(type, "charges", "awbCharge", e.target.value)} /></div>
        <Separator />
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 items-center"><Label className="text-right text-xs text-gray-500">Fuel (%)</Label><div className="col-span-2 flex gap-2"><Input type="number" className="w-16 h-8 text-sm" value={v(data.charges.fuelSurcharge)} onChange={(e) => onInputChange(type, "charges", "fuelSurcharge", e.target.value)} /><div className="flex-1 h-8 flex items-center px-2 text-xs text-gray-600 bg-gray-100 rounded border">{Number(data.charges.fuelAmount).toFixed(2)}</div></div></div>
          <div className="bg-gray-50 p-2 rounded border border-dashed border-gray-300"><Label className="text-xs font-bold text-gray-700 mb-2 block">GST Breakdown</Label><div className="grid grid-cols-4 gap-2 items-center mb-2"><Label className="text-right text-xs text-gray-500">CGST %</Label><Input type="number" className="h-7 text-sm" value={v(data.charges.cgstPercent)} onChange={(e) => onInputChange(type, "charges", "cgstPercent", e.target.value)} /><div className="col-span-2 h-7 flex items-center px-2 text-xs text-gray-600 bg-white rounded border">{Number(data.charges.cgstAmount).toFixed(2)}</div></div><div className="grid grid-cols-4 gap-2 items-center mb-2"><Label className="text-right text-xs text-gray-500">SGST %</Label><Input type="number" className="h-7 text-sm" value={v(data.charges.sgstPercent)} onChange={(e) => onInputChange(type, "charges", "sgstPercent", e.target.value)} /><div className="col-span-2 h-7 flex items-center px-2 text-xs text-gray-600 bg-white rounded border">{Number(data.charges.sgstAmount).toFixed(2)}</div></div><div className="grid grid-cols-4 gap-2 items-center"><Label className="text-right text-xs text-gray-500">IGST %</Label><Input type="number" className="h-7 text-sm" value={v(data.charges.igstPercent)} onChange={(e) => onInputChange(type, "charges", "igstPercent", e.target.value)} /><div className="col-span-2 h-7 flex items-center px-2 text-xs text-gray-600 bg-white rounded border">{Number(data.charges.igstAmount).toFixed(2)}</div></div></div>
          <div className="flex justify-between items-center text-xs px-2"><span className="text-gray-500">Total Tax</span><span className="font-semibold text-gray-700">{Number(data.charges.gstAmount).toFixed(2)}</span></div>
        </div>
      </CardContent>
      <CardFooter className={`bg-${type === 'sales' ? 'blue' : 'red'}-50 border-t p-4`}><div className="w-full flex justify-between items-center"><span className="font-bold text-gray-700">Grand Total</span><span className={`text-xl font-bold ${type === 'sales' ? 'text-blue-700' : 'text-red-700'}`}>{Number(data.grandTotal).toFixed(2)}</span></div></CardFooter>
    </Card>
  )
}

export default function SalesPurchasePage({ params }) {
  const router = useRouter()
  const { trackingNumber } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ✅ MODIFIED: Set defaults to 0 here. 
  // We will intelligently apply 9% only on FRESH loads in useEffect.
  const emptyFinancialSide = {
    companyName: "",
    serviceType: "",
    weight: { actual: 0, volume: 0, chargeable: 0 },
    rates: { ratePerKg: 0, baseTotal: 0 },
    charges: {
      otherCharges: [],
      awbCharge: 0,
      fuelSurcharge: 0,
      fuelAmount: 0,
      cgstPercent: 0, cgstAmount: 0, // Default 0
      sgstPercent: 0, sgstAmount: 0, // Default 0
      igstPercent: 0, igstAmount: 0, // Default 0
      gstAmount: 0,
    },
    grandTotal: 0,
  }

  const [sales, setSales] = useState(emptyFinancialSide)
  const [purchase, setPurchase] = useState(emptyFinancialSide)
  const [internalCosts, setInternalCosts] = useState([])
  const [payments, setPayments] = useState([])
  const [notes, setNotes] = useState("")
  const [netProfit, setNetProfit] = useState(0)

  const [chargeModalOpen, setChargeModalOpen] = useState(false)
  const [currentModalType, setCurrentModalType] = useState("sales")
  const [newCharge, setNewCharge] = useState({ name: "", amount: "" })
  const [newPayment, setNewPayment] = useState({ date: new Date().toISOString().split('T')[0], mode: "Cash", amount: "", reference: "" })

  const recalculateRow = (data) => {
    const baseTotal = Number(data.rates.baseTotal) || 0
    const otherChargesTotal = data.charges.otherCharges.reduce((acc, curr) => acc + Number(curr.amount), 0)
    const awbCharge = Number(data.charges.awbCharge) || 0
    const fuelPercent = Number(data.charges.fuelSurcharge) || 0
    const fuelAmount = (baseTotal * fuelPercent) / 100
    const subTotal = baseTotal + otherChargesTotal + awbCharge + fuelAmount
    const cgstPercent = Number(data.charges.cgstPercent) || 0
    const sgstPercent = Number(data.charges.sgstPercent) || 0
    const igstPercent = Number(data.charges.igstPercent) || 0
    const cgstAmount = (subTotal * cgstPercent) / 100
    const sgstAmount = (subTotal * sgstPercent) / 100
    const igstAmount = (subTotal * igstPercent) / 100
    const totalTax = cgstAmount + sgstAmount + igstAmount
    const grandTotal = subTotal + totalTax
    return {
      ...data,
      charges: { ...data.charges, fuelAmount, cgstAmount, sgstAmount, igstAmount, gstAmount: totalTax },
      grandTotal
    }
  }

  useEffect(() => {
    const totalInternal = internalCosts.reduce((acc, curr) => acc + Number(curr.amount), 0)
    setNetProfit(sales.grandTotal - purchase.grandTotal - totalInternal)
  }, [sales.grandTotal, purchase.grandTotal, internalCosts])

  useEffect(() => {
    const fetchAwb = async () => {
      try {
        const res = await axios.get(`/api/awb/${trackingNumber}`)
        let rawData = res.data
        if (Array.isArray(rawData)) rawData = rawData[0]
        if (!rawData) { toast.error("No AWB data found"); setLoading(false); return; }

        const calculatedSalesWeights = calculateBoxWeights(rawData.boxes)
        const calculatedPurchaseWeights = calculateBoxWeights(rawData.vendorBoxes)

        let loadedSales = { ...emptyFinancialSide }
        let loadedPurchase = { ...emptyFinancialSide }
        let loadedInternal = []
        let loadedPayments = []
        let loadedNotes = ""

        if (rawData.financials) {
          // Data exists: Load it exactly as is (respects 0 if saved as 0)
          loadedSales = { 
            ...emptyFinancialSide, 
            ...rawData.financials.sales, 
            charges: { ...emptyFinancialSide.charges, ...(rawData.financials.sales?.charges || {}) } 
          }
          loadedPurchase = { 
            ...emptyFinancialSide, 
            ...rawData.financials.purchase, 
            charges: { ...emptyFinancialSide.charges, ...(rawData.financials.purchase?.charges || {}) } 
          }
          loadedInternal = rawData.financials.internalCosts || []
          loadedPayments = rawData.financials.payments || []
          loadedNotes = rawData.financials.notes || ""
        } else {
          // ✅ NEW RECORD LOGIC: Apply 9% Defaults only if NO financials exist
          loadedSales.charges.cgstPercent = 9
          loadedSales.charges.sgstPercent = 9
          loadedPurchase.charges.cgstPercent = 9
          loadedPurchase.charges.sgstPercent = 9
        }

        if (Number(loadedSales.weight.chargeable) === 0 && calculatedSalesWeights.chargeable > 0) loadedSales.weight = calculatedSalesWeights
        if (Number(loadedPurchase.weight.chargeable) === 0 && calculatedPurchaseWeights.chargeable > 0) loadedPurchase.weight = calculatedPurchaseWeights

        loadedSales = recalculateRow(loadedSales)
        loadedPurchase = recalculateRow(loadedPurchase)

        setSales(loadedSales)
        setPurchase(loadedPurchase)
        setInternalCosts(loadedInternal)
        setPayments(loadedPayments)
        setNotes(loadedNotes)
        setLoading(false)
      } catch (error) { console.error(error); setLoading(false); }
    }
    fetchAwb()
  }, [trackingNumber])

  const handleInputChange = (side, section, field, value) => {
    const current = side === "sales" ? sales : purchase
    let updated = { ...current }
    if (section === "root") updated[field] = value
    else if (section === "weight") updated.weight = { ...updated.weight, [field]: value }
    else if (section === "rates") updated.rates = { ...updated.rates, [field]: value }
    else if (section === "charges") updated.charges = { ...updated.charges, [field]: value }
    const weight = Number(updated.weight.chargeable) || 0
    if (section === "rates" && field === "ratePerKg") updated.rates.baseTotal = (Number(value) * weight).toFixed(2)
    else if (section === "rates" && field === "baseTotal") updated.rates.ratePerKg = (Number(value) / weight).toFixed(2)
    else if (section === "weight" && field === "chargeable") updated.rates.baseTotal = (Number(updated.rates.ratePerKg) * Number(value)).toFixed(2)
    updated = recalculateRow(updated)
    if (side === "sales") setSales(updated)
    else setPurchase(updated)
  }

  const handleAddCharge = () => {
    if (!newCharge.name || !newCharge.amount) return
    const chargeObj = { name: newCharge.name, amount: parseFloat(newCharge.amount) }
    if (currentModalType === "internal") setInternalCosts([...internalCosts, chargeObj])
    else {
      const current = currentModalType === "sales" ? sales : purchase
      let updated = { ...current, charges: { ...current.charges, otherCharges: [...current.charges.otherCharges, chargeObj] } }
      updated = recalculateRow(updated)
      if (currentModalType === "sales") setSales(updated)
      else setPurchase(updated)
    }
    setNewCharge({ name: "", amount: "" })
    setChargeModalOpen(false)
  }

  const removeCharge = (side, index) => {
    if (side === "internal") { const updated = [...internalCosts]; updated.splice(index, 1); setInternalCosts(updated); }
    else {
      const current = side === "sales" ? sales : purchase
      const updatedCharges = [...current.charges.otherCharges]; updatedCharges.splice(index, 1);
      let updated = { ...current, charges: { ...current.charges, otherCharges: updatedCharges } }
      updated = recalculateRow(updated)
      if (side === "sales") setSales(updated)
      else setPurchase(updated)
    }
  }

  const handleAddPayment = () => {
    if (!newPayment.amount) return
    setPayments([...payments, { ...newPayment, amount: parseFloat(newPayment.amount) }])
    setNewPayment({ date: new Date().toISOString().split('T')[0], mode: "Cash", amount: "", reference: "" })
    setChargeModalOpen(false)
  }

  const removePayment = (index) => {
    const updated = [...payments]; updated.splice(index, 1); setPayments(updated);
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const payload = { financials: { sales, purchase, internalCosts, payments, notes, netProfit } }
      await axios.put(`/api/awb/${trackingNumber}`, payload)
      toast.success("Saved successfully!")
      router.refresh()
    } catch (error) { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold text-gray-800">Financial Management</h1>
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700"><Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Financials"}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FinancialColumn title="Sales (Income)" data={sales} type="sales" colorClass="border-blue-600" onInputChange={handleInputChange} onAddCharge={(t) => { setCurrentModalType(t); setChargeModalOpen(true) }} onRemoveCharge={removeCharge} />
        {localStorage.getItem("userType") === "admin" && <FinancialColumn title="Purchase (Cost)" data={purchase} type="purchase" colorClass="border-red-600" onInputChange={handleInputChange} onAddCharge={(t) => { setCurrentModalType(t); setChargeModalOpen(true) }} onRemoveCharge={removeCharge} />}
      </div>

      {localStorage.getItem("userType") === "admin" &&
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-l-4 border-orange-500">
            <CardHeader className="pb-2 flex flex-row justify-between items-center"><CardTitle className="text-lg text-orange-800">Internal & Operational Costs</CardTitle><Button size="sm" variant="outline" onClick={() => { setCurrentModalType("internal"); setChargeModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add</Button></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {internalCosts.map((cost, i) => (<TableRow key={i}><TableCell>{cost.name}</TableCell><TableCell className="text-right">{cost.amount.toFixed(2)}</TableCell><TableCell><Button size="icon" variant="ghost" className="text-red-500 h-6 w-6" onClick={() => removeCharge("internal", i)}><Trash2 className="h-3 w-3" /></Button></TableCell></TableRow>))}
                  {internalCosts.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-xs text-gray-400">No costs added</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 text-white shadow-xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-green-400" /> Profit Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-gray-400"><span>Total Sales</span><span className="text-green-400">+ {sales.grandTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-gray-400"><span>Total Purchase</span><span className="text-red-400">- {purchase.grandTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-gray-400"><span>Internal Costs</span><span className="text-orange-400">- {internalCosts.reduce((a, b) => a + Number(b.amount), 0).toFixed(2)}</span></div>
              <Separator className="bg-gray-700 my-2" />
              <div className="flex justify-between items-end"><span className="font-bold">NET PROFIT</span><div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-500'}`}>{netProfit.toFixed(2)}</div></div>
            </CardContent>
          </Card>
        </div>
      }

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 border-l-4 border-green-600">
          <CardHeader className="pb-2 flex flex-row justify-between items-center"><CardTitle className="text-lg text-green-800 flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payments Received</CardTitle><Button size="sm" variant="outline" onClick={() => { setCurrentModalType("payment"); setChargeModalOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Payment</Button></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Mode</TableHead><TableHead>Ref #</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.map((pay, i) => (<TableRow key={i}><TableCell>{format(new Date(pay.date), "dd-MMM-yyyy")}</TableCell><TableCell><Badge variant="outline">{pay.mode}</Badge></TableCell><TableCell className="text-xs text-gray-500">{pay.reference || "-"}</TableCell><TableCell className="text-right font-medium">{pay.amount.toFixed(2)}</TableCell><TableCell><Button size="icon" variant="ghost" className="text-red-500 h-6 w-6" onClick={() => removePayment(i)}><Trash2 className="h-3 w-3" /></Button></TableCell></TableRow>))}
                {payments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-gray-400">No payments recorded</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader><CardTitle className="text-gray-600 text-lg">Payment Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm"><span>Grand Total</span><span className="font-bold">{sales.grandTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Total Paid</span><span className="text-green-600 font-bold">-{payments.reduce((a, b) => a + Number(b.amount), 0).toFixed(2)}</span></div>
            <Separator />
            <div className="flex justify-between items-end"><span className="font-bold text-gray-700">BALANCE DUE</span><span className={`text-2xl font-bold ${(sales.grandTotal - payments.reduce((a, b) => a + Number(b.amount), 0)) > 0 ? "text-red-600" : "text-green-600"}`}>{(sales.grandTotal - payments.reduce((a, b) => a + Number(b.amount), 0)).toFixed(2)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8 border-t-4 border-purple-500">
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Invoice Notes / Remarks</CardTitle></CardHeader>
        <CardContent>
          <ReactQuill theme="snow" value={notes} onChange={setNotes} modules={quillModules} className="h-40 mb-12" />
        </CardContent>
      </Card>

      <Dialog open={chargeModalOpen} onOpenChange={setChargeModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentModalType === 'payment' ? 'Add Payment' : 'Add Charge'}</DialogTitle></DialogHeader>
          {currentModalType === 'payment' ? (
            <div className="space-y-4 py-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Date</Label><Input type="date" value={newPayment.date} onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })} /></div><div className="space-y-2"><Label>Amount</Label><Input type="number" placeholder="0.00" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} /></div></div><div className="space-y-2"><Label>Mode</Label><Select value={newPayment.mode} onValueChange={(val) => setNewPayment({ ...newPayment, mode: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Reference</Label><Input placeholder="Cheque No / Transaction ID" value={newPayment.reference} onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })} /></div></div>
          ) : (
            <div className="space-y-4 py-4"><div className="space-y-2"><Label>Charge Type</Label><div className="flex gap-2"><Select value={PREDEFINED_CHARGES.includes(newCharge.name) || INTERNAL_COST_TYPES.includes(newCharge.name) ? newCharge.name : "Custom"} onValueChange={(val) => val !== "Custom" && setNewCharge({ ...newCharge, name: val })}><SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{(currentModalType === 'internal' ? INTERNAL_COST_TYPES : PREDEFINED_CHARGES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}<SelectItem value="Custom">Custom...</SelectItem></SelectContent></Select></div><Input placeholder="Type charge name..." className="mt-2" value={newCharge.name} onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })} /></div><div className="space-y-2"><Label>Amount</Label><Input type="number" placeholder="0.00" value={newCharge.amount} onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })} /></div></div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setChargeModalOpen(false)}>Cancel</Button><Button onClick={currentModalType === 'payment' ? handleAddPayment : handleAddCharge}>{currentModalType === 'payment' ? 'Add' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}