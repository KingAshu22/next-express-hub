"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function StockForm({ onStockAdded }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    partyName: "",
    gstNo: "",
    productName: "",
    hsnCode: "",
    openingStock: {
      qty: 0,
      rate: 0,
      amount: 0,
    },
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: Number.parseFloat(value) || 0,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const calculateAmount = () => {
    const qty = formData.openingStock.qty
    const rate = formData.openingStock.rate
    const amount = qty * rate

    setFormData((prev) => ({
      ...prev,
      openingStock: {
        ...prev.openingStock,
        amount: amount,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Stock added successfully!",
        })
        setFormData({
          partyName: "",
          gstNo: "",
          productName: "",
          hsnCode: "",
          openingStock: {
            qty: 0,
            rate: 0,
            amount: 0,
          },
        })
        onStockAdded()
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
        <CardTitle>Add New Stock</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partyName">Party Name</Label>
              <Input id="partyName" name="partyName" value={formData.partyName} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstNo">GST Number</Label>
              <Input id="gstNo" name="gstNo" value={formData.gstNo} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input id="hsnCode" name="hsnCode" value={formData.hsnCode} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Opening Stock Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingStock.qty">Quantity</Label>
                <Input
                  id="openingStock.qty"
                  name="openingStock.qty"
                  type="number"
                  value={formData.openingStock.qty}
                  onChange={handleInputChange}
                  onBlur={calculateAmount}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingStock.rate">Rate</Label>
                <Input
                  id="openingStock.rate"
                  name="openingStock.rate"
                  type="number"
                  step="0.01"
                  value={formData.openingStock.rate}
                  onChange={handleInputChange}
                  onBlur={calculateAmount}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingStock.amount">Amount</Label>
                <Input
                  id="openingStock.amount"
                  name="openingStock.amount"
                  type="number"
                  step="0.01"
                  value={formData.openingStock.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Stock"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
