"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function TransactionForm({ stocks, onTransactionAdded }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    stockId: "",
    type: "",
    qty: 0,
    rate: 0,
    amount: 0,
    remarks: "",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "qty" || name === "rate" || name === "amount" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const calculateAmount = () => {
    const amount = formData.qty * formData.rate
    setFormData((prev) => ({
      ...prev,
      amount: amount,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/stock/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockId: formData.stockId,
          transaction: {
            type: formData.type,
            qty: formData.qty,
            rate: formData.rate,
            amount: formData.amount,
            remarks: formData.remarks,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Stock ${formData.type} added successfully!`,
        })
        setFormData({
          stockId: "",
          type: "",
          qty: 0,
          rate: 0,
          amount: 0,
          remarks: "",
        })
        onTransactionAdded()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Stock Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockId">Select Product</Label>
              <Select
                value={formData.stockId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, stockId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {stocks.map((stock) => (
                    <SelectItem key={stock._id} value={stock._id}>
                      {stock.productName} - {stock.partyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inward">Stock Inward</SelectItem>
                  <SelectItem value="outward">Stock Outward</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                name="qty"
                type="number"
                value={formData.qty}
                onChange={handleInputChange}
                onBlur={calculateAmount}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                name="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={handleInputChange}
                onBlur={calculateAmount}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Optional remarks..."
            />
          </div>

          <Button type="submit" disabled={loading || !formData.stockId || !formData.type} className="w-full">
            {loading ? "Adding..." : `Add ${formData.type === "inward" ? "Inward" : "Outward"}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
