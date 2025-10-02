"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function MultiProductForm({ type = "opening", onSubmit }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [parties, setParties] = useState([])
  const [selectedParty, setSelectedParty] = useState(null)
  const [partyProducts, setPartyProducts] = useState([])
  const [partySearch, setPartySearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [showPartyDropdown, setShowPartyDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  const [showCreateParty, setShowCreateParty] = useState(false)
  const [newPartyData, setNewPartyData] = useState({
    partyName: "",
    gstNo: "",
    address: "",
    phone: "",
    email: "",
  })

  const [formData, setFormData] = useState({
    partyName: "",
    gstNo: "",
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    products: [
      {
        productName: "",
        hsnCode: "",
        qty: 0,
        rate: 0,
        discount: 0,
        discountAmount: 0,
        taxableAmount: 0,
        amount: 0,
      },
    ],
    tax: {
      cgst: 0,
      sgst: 0,
      igst: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTaxAmount: 0,
    },
    subtotal: 0,
    totalDiscountAmount: 0,
    taxableAmount: 0,
    totalAmount: 0,
    type: type,
  })

  useEffect(() => {
    fetchParties()
  }, [])

  useEffect(() => {
    if (selectedParty) {
      fetchPartyProducts(selectedParty._id)
    }
  }, [selectedParty])

  useEffect(() => {
    calculateTotals()
  }, [
    formData.products.map((p) => `${p.qty}-${p.rate}-${p.discount}`).join(","),
    formData.tax.cgst,
    formData.tax.sgst,
    formData.tax.igst,
  ])

  const fetchParties = async (search = "") => {
    try {
      const response = await fetch(`/api/parties?search=${search}`)
      const result = await response.json()
      if (result.success) {
        setParties(result.data)
      }
    } catch (error) {
      console.error("Error fetching parties:", error)
    }
  }

  const fetchPartyProducts = async (partyId, search = "") => {
    try {
      const response = await fetch(`/api/parties/${partyId}/products?search=${search}`)
      const result = await response.json()
      if (result.success) {
        setPartyProducts(result.data)
      }
    } catch (error) {
      console.error("Error fetching party products:", error)
    }
  }

  const handlePartySearch = (value) => {
    setPartySearch(value)
    setShowPartyDropdown(true)
    fetchParties(value)
  }

  const handlePartySelect = (party) => {
    setSelectedParty(party)
    setFormData((prev) => ({
      ...prev,
      partyName: party.partyName,
      gstNo: party.gstNo,
    }))
    setPartySearch(party.partyName)
    setShowPartyDropdown(false)
  }

  const handleCreateParty = async () => {
    try {
      const response = await fetch("/api/parties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPartyData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Party created successfully!",
        })

        // Set the newly created party as selected
        setSelectedParty(result.data)
        setFormData((prev) => ({
          ...prev,
          partyName: result.data.partyName,
          gstNo: result.data.gstNo,
        }))
        setPartySearch(result.data.partyName)

        // Reset new party form
        setNewPartyData({
          partyName: "",
          gstNo: "",
          address: "",
          phone: "",
          email: "",
        })
        setShowCreateParty(false)
        setShowPartyDropdown(false)

        // Refresh parties list
        fetchParties()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleProductSearch = (value, index) => {
    setProductSearch(value)
    setShowProductDropdown(true)
    if (selectedParty) {
      fetchPartyProducts(selectedParty._id, value)
    }
  }

  const handleProductSelect = (product, index) => {
    const updatedProducts = [...formData.products]
    updatedProducts[index] = {
      ...updatedProducts[index],
      productName: product.productName,
      hsnCode: product.hsnCode,
      rate: type === "inward" ? product.lastRate : updatedProducts[index].rate,
    }

    setFormData((prev) => ({
      ...prev,
      products: updatedProducts,
    }))
    setShowProductDropdown(false)
    calculateProductAmount(index, updatedProducts[index])
  }

  const calculateProductAmount = (index, product = null) => {
    const updatedProducts = [...formData.products]
    const currentProduct = product || updatedProducts[index]

    const baseAmount = currentProduct.qty * currentProduct.rate
    const discountAmount = (baseAmount * currentProduct.discount) / 100
    const taxableAmount = baseAmount - discountAmount
    const amount = taxableAmount

    // Only update if values have changed
    if (
      currentProduct.discountAmount !== discountAmount ||
      currentProduct.taxableAmount !== taxableAmount ||
      currentProduct.amount !== amount
    ) {
      currentProduct.discountAmount = discountAmount
      currentProduct.taxableAmount = taxableAmount
      currentProduct.amount = amount

      updatedProducts[index] = currentProduct

      setFormData((prev) => ({
        ...prev,
        products: updatedProducts,
      }))
    }
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalDiscountAmount = 0
    let taxableAmount = 0

    formData.products.forEach((product) => {
      const baseAmount = product.qty * product.rate
      subtotal += baseAmount
      totalDiscountAmount += (baseAmount * product.discount) / 100
      taxableAmount += baseAmount - (baseAmount * product.discount) / 100
    })

    const cgstAmount = (taxableAmount * formData.tax.cgst) / 100
    const sgstAmount = (taxableAmount * formData.tax.sgst) / 100
    const igstAmount = (taxableAmount * formData.tax.igst) / 100
    const totalTaxAmount = cgstAmount + sgstAmount + igstAmount
    const totalAmount = taxableAmount + totalTaxAmount

    // Only update if values have actually changed
    if (
      formData.subtotal !== subtotal ||
      formData.totalDiscountAmount !== totalDiscountAmount ||
      formData.taxableAmount !== taxableAmount ||
      formData.tax.cgstAmount !== cgstAmount ||
      formData.tax.sgstAmount !== sgstAmount ||
      formData.tax.igstAmount !== igstAmount ||
      formData.tax.totalTaxAmount !== totalTaxAmount ||
      formData.totalAmount !== totalAmount
    ) {
      setFormData((prev) => ({
        ...prev,
        subtotal,
        totalDiscountAmount,
        taxableAmount,
        tax: {
          ...prev.tax,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalTaxAmount,
        },
        totalAmount,
      }))
    }
  }

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products]
    updatedProducts[index][field] =
      field === "qty" || field === "rate" || field === "discount" ? Number.parseFloat(value) || 0 : value

    setFormData((prev) => ({
      ...prev,
      products: updatedProducts,
    }))

    if (field === "qty" || field === "rate" || field === "discount") {
      calculateProductAmount(index, updatedProducts[index])
    }
  }

  const handleTaxChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      tax: {
        ...prev.tax,
        [field]: Number.parseFloat(value) || 0,
      },
    }))
  }

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productName: "",
          hsnCode: "",
          qty: 0,
          rate: 0,
          discount: 0,
          discountAmount: 0,
          taxableAmount: 0,
          amount: 0,
        },
      ],
    }))
  }

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      const updatedProducts = formData.products.filter((_, i) => i !== index)
      setFormData((prev) => ({
        ...prev,
        products: updatedProducts,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        partyName: "",
        gstNo: "",
        invoiceNo: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        products: [
          {
            productName: "",
            hsnCode: "",
            qty: 0,
            rate: 0,
            discount: 0,
            discountAmount: 0,
            taxableAmount: 0,
            amount: 0,
          },
        ],
        tax: {
          cgst: 0,
          sgst: 0,
          igst: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalTaxAmount: 0,
        },
        subtotal: 0,
        totalDiscountAmount: 0,
        taxableAmount: 0,
        totalAmount: 0,
        type: type,
      })
      setSelectedParty(null)
      setPartySearch("")
      setShowPartyDropdown(false)
      setShowCreateParty(false)
      setNewPartyData({
        partyName: "",
        gstNo: "",
        address: "",
        phone: "",
        email: "",
      })
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
        <CardTitle>
          {type === "opening" && "Add Opening Stock"}
          {type === "inward" && "Stock Inward Entry"}
          {type === "outward" && "Stock Outward Entry"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Party and Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label htmlFor="partyName">Party Name</Label>
              <div className="relative">
                <Input
                  id="partyName"
                  value={partySearch}
                  onChange={(e) => handlePartySearch(e.target.value)}
                  onFocus={() => setShowPartyDropdown(true)}
                  placeholder="Search party name..."
                  required
                />
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>

              {showPartyDropdown && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {/* Create New Party Option */}
                  <div
                    className="p-2 hover:bg-blue-50 cursor-pointer border-b bg-blue-25 text-blue-700 font-medium"
                    onClick={() => {
                      setShowCreateParty(true)
                      setShowPartyDropdown(false)
                      setNewPartyData((prev) => ({ ...prev, partyName: partySearch }))
                    }}
                  >
                    + Create New Party: "{partySearch}"
                  </div>

                  {/* Existing Parties */}
                  {parties.map((party) => (
                    <div
                      key={party._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handlePartySelect(party)}
                    >
                      <div className="font-medium">{party.partyName}</div>
                      <div className="text-sm text-gray-500">{party.gstNo}</div>
                    </div>
                  ))}

                  {parties.length === 0 && !partySearch && (
                    <div className="p-2 text-gray-500 text-center">Start typing to search parties</div>
                  )}
                </div>
              )}

              {/* Create Party Modal */}
              {showCreateParty && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
                    <h3 className="text-lg font-semibold mb-4">Create New Party</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="newPartyName">Party Name</Label>
                        <Input
                          id="newPartyName"
                          value={newPartyData.partyName}
                          onChange={(e) => setNewPartyData((prev) => ({ ...prev, partyName: e.target.value }))}
                          placeholder="Enter party name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newGstNo">GST Number</Label>
                        <Input
                          id="newGstNo"
                          value={newPartyData.gstNo}
                          onChange={(e) => setNewPartyData((prev) => ({ ...prev, gstNo: e.target.value }))}
                          placeholder="Enter GST number"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newAddress">Address</Label>
                        <Input
                          id="newAddress"
                          value={newPartyData.address}
                          onChange={(e) => setNewPartyData((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter address (optional)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPhone">Phone</Label>
                        <Input
                          id="newPhone"
                          value={newPartyData.phone}
                          onChange={(e) => setNewPartyData((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number (optional)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newEmail">Email</Label>
                        <Input
                          id="newEmail"
                          type="email"
                          value={newPartyData.email}
                          onChange={(e) => setNewPartyData((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email (optional)"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button
                        onClick={handleCreateParty}
                        disabled={!newPartyData.partyName || !newPartyData.gstNo}
                        className="flex-1"
                      >
                        Create Party
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCreateParty(false)
                          setNewPartyData({
                            partyName: "",
                            gstNo: "",
                            address: "",
                            phone: "",
                            email: "",
                          })
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstNo">GST Number</Label>
              <Input id="gstNo" value={formData.gstNo} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNo">Invoice Number</Label>
              <Input
                id="invoiceNo"
                value={formData.invoiceNo}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNo: e.target.value }))}
                placeholder="Enter invoice number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Products Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Products</h3>
              <Button type="button" onClick={addProduct} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {formData.products.map((product, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="space-y-2 relative">
                    <Label>Product Name</Label>
                    <div className="relative">
                      <Input
                        value={product.productName}
                        onChange={(e) => {
                          handleProductChange(index, "productName", e.target.value)
                          handleProductSearch(e.target.value, index)
                        }}
                        placeholder="Search product..."
                        required
                      />
                      <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                    {showProductDropdown && partyProducts.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {partyProducts.map((prod) => (
                          <div
                            key={prod._id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleProductSelect(prod, index)}
                          >
                            <div className="font-medium">{prod.productName}</div>
                            <div className="text-sm text-gray-500">HSN: {prod.hsnCode}</div>
                            {type === "inward" && (
                              <div className="text-sm text-blue-600">Last Rate: ₹{prod.lastRate}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>HSN Code</Label>
                    <Input
                      value={product.hsnCode}
                      onChange={(e) => handleProductChange(index, "hsnCode", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={product.qty}
                      onChange={(e) => handleProductChange(index, "qty", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={product.rate}
                      onChange={(e) => handleProductChange(index, "rate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={product.discount}
                      onChange={(e) => handleProductChange(index, "discount", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 flex flex-col">
                    <Label>Amount</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">₹{product.amount.toFixed(2)}</Badge>
                      {formData.products.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeProduct(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Tax Section */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Tax Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CGST %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tax.cgst}
                  onChange={(e) => handleTaxChange("cgst", e.target.value)}
                />
                <Badge variant="outline">₹{formData.tax.cgstAmount.toFixed(2)}</Badge>
              </div>
              <div className="space-y-2">
                <Label>SGST %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tax.sgst}
                  onChange={(e) => handleTaxChange("sgst", e.target.value)}
                />
                <Badge variant="outline">₹{formData.tax.sgstAmount.toFixed(2)}</Badge>
              </div>
              <div className="space-y-2">
                <Label>IGST %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tax.igst}
                  onChange={(e) => handleTaxChange("igst", e.target.value)}
                />
                <Badge variant="outline">₹{formData.tax.igstAmount.toFixed(2)}</Badge>
              </div>
            </div>
          </Card>

          {/* Summary Section */}
          <Card className="p-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Subtotal</Label>
                <div className="text-lg font-semibold">₹{formData.subtotal.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Total Discount</Label>
                <div className="text-lg font-semibold text-red-600">-₹{formData.totalDiscountAmount.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Total Tax</Label>
                <div className="text-lg font-semibold text-blue-600">₹{formData.tax.totalTaxAmount.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Grand Total</Label>
                <div className="text-xl font-bold text-green-600">₹{formData.totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </Card>

          <Button type="submit" disabled={loading || !selectedParty} className="w-full">
            {loading
              ? "Processing..."
              : `Add ${type === "opening" ? "Opening Stock" : type === "inward" ? "Inward Stock" : "Outward Stock"}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
