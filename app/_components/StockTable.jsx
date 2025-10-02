"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StockTable({ stocks, onStockDeleted, filters }) {
  const { toast } = useToast()

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this stock?")) return

    try {
      const response = await fetch(`/api/stock/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Stock deleted successfully!",
        })
        onStockDeleted()
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

  const handleExportCSV = () => {
    const params = new URLSearchParams(filters)
    window.open(`/api/export/csv?${params.toString()}`, "_blank")
  }

  const handleExportPDF = () => {
    // For PDF export, you would typically use a library like jsPDF or puppeteer
    // For now, we'll show a placeholder
    toast({
      title: "PDF Export",
      description: "PDF export functionality would be implemented here",
    })
  }

  const calculateTotals = (stock) => {
    const totalInward = stock.transactions.filter((t) => t.type === "inward").reduce((sum, t) => sum + t.qty, 0)

    const totalOutward = stock.transactions.filter((t) => t.type === "outward").reduce((sum, t) => sum + t.qty, 0)

    return { totalInward, totalOutward }
  }

  return (
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
                <TableHead>Party Name</TableHead>
                <TableHead>GST No</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>HSN Code</TableHead>
                <TableHead>Opening Stock</TableHead>
                <TableHead>Stock Inward</TableHead>
                <TableHead>Stock Outward</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => {
                const { totalInward, totalOutward } = calculateTotals(stock)
                const isLowStock = stock.currentStock.qty < 10

                return (
                  <TableRow key={stock._id}>
                    <TableCell className="font-medium">{stock.partyName}</TableCell>
                    <TableCell>{stock.gstNo}</TableCell>
                    <TableCell>{stock.productName}</TableCell>
                    <TableCell>{stock.hsnCode}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Qty: {stock.openingStock.qty}</div>
                        <div>Rate: ₹{stock.openingStock.rate}</div>
                        <div>Amount: ₹{stock.openingStock.amount}</div>
                      </div>
                    </TableCell>
                    <TableCell>{totalInward}</TableCell>
                    <TableCell>{totalOutward}</TableCell>
                    <TableCell>{stock.currentStock.qty}</TableCell>
                    <TableCell>₹{stock.currentStock.value.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={isLowStock ? "destructive" : "default"}>
                        {isLowStock ? "Low Stock" : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleDelete(stock._id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {stocks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No stock records found. Add some stock to get started.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
