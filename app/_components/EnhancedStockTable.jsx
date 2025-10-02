"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Trash2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function EnhancedStockTable({ stocks, onStockDeleted, filters }) {
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this stock entry?")) return
    setDeletingId(id)

    try {
      const response = await fetch(`/api/stock/${id}`, { method: "DELETE" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "Success", description: "Stock entry deleted successfully!" })
        onStockDeleted()
      } else {
        throw new Error(result.error || "Failed to delete stock entry")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete stock entry",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportCSV = () => {
    const params = new URLSearchParams()
    if (filters?.partyName) params.append("partyName", filters.partyName)
    if (filters?.productName) params.append("productName", filters.productName)
    if (filters?.fromDate) params.append("fromDate", filters.fromDate)
    if (filters?.toDate) params.append("toDate", filters.toDate)
    if (filters?.type) params.append("type", filters.type)
    window.open(`/api/export/csv?${params.toString()}`, "_blank")
  }

  const handleExportPDF = () => {
    toast({
      title: "PDF Export",
      description: "PDF export functionality will be implemented soon",
    })
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "opening": return "bg-blue-100 text-blue-800"
      case "inward": return "bg-green-100 text-green-800"
      case "outward": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStockSummary = () => {
    const summary = {}
    stocks?.forEach((stock) => {
      stock.products?.forEach((product) => {
        const key = `${stock.partyName}___${product.productName}`
        const qty = Number(product.qty || 0)
        if (!summary[key]) {
          summary[key] = {
            partyName: stock.partyName,
            productName: product.productName,
            inward: 0,
            outward: 0,
          }
        }
        if (stock.type === "inward" || stock.type === "opening") {
          summary[key].inward += qty
        } else if (stock.type === "outward") {
          summary[key].outward += qty
        }
      })
    })

    return Object.values(summary).map((item) => ({
      ...item,
      balance: item.inward - item.outward,
    }))
  }

  const StockDetailDialog = ({ stock }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Entry Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div><strong>Party:</strong> {stock.partyName}</div>
            <div><strong>GST No:</strong> {stock.gstNo}</div>
            <div><strong>Invoice No:</strong> {stock.invoiceNo || "N/A"}</div>
            <div><strong>Date:</strong> {new Date(stock.invoiceDate).toLocaleDateString()}</div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-2">Products</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.products?.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>{product.hsnCode}</TableCell>
                    <TableCell>{product.qty}</TableCell>
                    <TableCell>₹{product.rate}</TableCell>
                    <TableCell>{product.discount}%</TableCell>
                    <TableCell>₹{product.amount?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Movement History */}
          <div>
            <h4 className="font-semibold mt-4">Product Movement History</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks
                  .filter((entry) => entry.partyName === stock.partyName)
                  .flatMap((entry) =>
                    entry.products?.map((p) => ({
                      productName: p.productName,
                      qty: p.qty,
                      type: entry.type,
                      invoice: entry.invoiceNo,
                      date: new Date(entry.invoiceDate).toLocaleDateString(),
                    }))
                  )
                  .filter((p) => stock.products?.some((sp) => sp.productName === p.productName))
                  .map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{p.productName}</TableCell>
                      <TableCell>{p.qty}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(p.type)}>{p.type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{p.invoice || "N/A"}</TableCell>
                      <TableCell>{p.date}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const stockSummary = getStockSummary()

  return (
    <>
      {/* Summary Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Stock Balance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party Name</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Inward</TableHead>
                <TableHead>Outward</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockSummary.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.partyName}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.inward}</TableCell>
                  <TableCell>{item.outward}</TableCell>
                  <TableCell className={item.balance < 0 ? "text-red-600" : "text-green-600"}>
                    {item.balance}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Main Stock Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stock Register</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Tax Amount</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks?.map((stock) => (
                  <TableRow key={stock._id}>
                    <TableCell>{new Date(stock.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(stock.type)}>{stock.type?.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{stock.partyName}</TableCell>
                    <TableCell>{stock.invoiceNo || "N/A"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {stock.products?.slice(0, 2).map((product, index) => (
                          <div key={index}>{product.productName}</div>
                        ))}
                        {stock.products?.length > 2 && (
                          <div className="text-gray-500">+{stock.products.length - 2} more</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>₹{stock.subtotal?.toFixed(2)}</TableCell>
                    <TableCell>₹{stock.tax?.totalTaxAmount?.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">₹{stock.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <StockDetailDialog stock={stock} />
                        <Button
                          onClick={() => handleDelete(stock._id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={deletingId === stock._id}
                        >
                          {deletingId === stock._id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {stocks?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No stock records found. Add some stock entries to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
