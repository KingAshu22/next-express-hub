"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowLeft, CreditCard, History, CheckCircle2 } from "lucide-react"

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { year, billNo } = params

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bill, setBill] = useState(null)
  
  // Payment Form State
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
    mode: "Bank Transfer",
    reference: "",
    notes: ""
  })

  // Fetch Bill
  const fetchBill = async () => {
    try {
      const res = await fetch(`/api/billing/year/${year}/${billNo}`)
      if (!res.ok) throw new Error("Bill not found")
      const data = await res.json()
      setBill(data)
    } catch (error) {
      console.error(error)
      alert("Failed to load bill")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBill()
  }, [year, billNo])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || parseFloat(formData.amount) <= 0) return alert("Enter valid amount")
    
    // Optional: Prevent overpayment (remove if you allow credits)
    if (parseFloat(formData.amount) > (bill.balance + 1)) { // +1 for floating point tolerance
       if(!confirm("Amount exceeds balance. Continue?")) return;
    }

    setSubmitting(true)
    try {
      const payload = {
        payment: {
          amount: parseFloat(formData.amount),
          date: new Date(formData.date),
          mode: formData.mode,
          reference: formData.reference,
          notes: formData.notes
        }
      }

      // We assume the API endpoint handles adding this to history and updating 'paid'/'balance' fields
      const res = await fetch(`/api/billing/payment/${year}/${billNo}`, {
        method: "POST", // Using POST for adding a new payment record
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error(await res.text())
      
      alert("Payment recorded successfully")
      
      // Reset form and reload data
      setFormData({ ...formData, amount: "", reference: "", notes: "" })
      fetchBill() 
      
    } catch (error) {
      console.error(error)
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/billing/${year}/${billNo}`}>
              <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4"/></Button>
            </Link>
            <div>
               <h1 className="text-2xl font-bold">Record Payment</h1>
               <p className="text-gray-500">Bill #{bill?.billNumber} • {bill?.billingInfo?.name}</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-sm text-gray-500">Current Balance</p>
             <p className={`text-2xl font-bold ${bill?.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{bill?.balance?.toFixed(2)}
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Payment Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5"/> New Payment
              </CardTitle>
              <CardDescription>Enter details of received payment</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00"
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    required 
                  />
                  {bill?.balance > 0 && (
                    <p 
                      className="text-xs text-blue-600 cursor-pointer text-right"
                      onClick={() => setFormData({...formData, amount: bill.balance})}
                    >
                      Set to Full Balance
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={formData.mode} onValueChange={(val) => setFormData({...formData, mode: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer / NEFT</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reference No. / Transaction ID</Label>
                  <Input 
                    placeholder="e.g. IMPS123456789"
                    value={formData.reference} 
                    onChange={(e) => setFormData({...formData, reference: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input 
                    placeholder="Remarks..."
                    value={formData.notes} 
                    onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  />
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                  Record Payment
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 2. Payment History */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5"/> Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 <div className="flex justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-xs text-gray-500">Total Bill Amount</p>
                      <p className="font-semibold">₹{bill?.total?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total Paid</p>
                      <p className="font-semibold text-green-600">₹{bill?.paid?.toFixed(2)}</p>
                    </div>
                 </div>

                 <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Mode/Ref</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bill?.paymentHistory?.length > 0 ? (
                          [...bill.paymentHistory].reverse().map((pay, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs whitespace-nowrap">
                                {new Date(pay.date).toLocaleDateString("en-IN")}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-xs">{pay.mode}</div>
                                <div className="text-[10px] text-gray-500">{pay.reference || "-"}</div>
                              </TableCell>
                              <TableCell className="text-right font-medium text-green-600">
                                +₹{pay.amount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                              No payments recorded yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                 </div>
               </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}