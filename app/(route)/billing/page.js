"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  FileText, 
  DollarSign, 
  Package, 
  Printer, 
  RefreshCw, 
  Loader2, 
  Edit, 
  CreditCard 
} from "lucide-react"
import isAdminAuth from "@/lib/isAdminAuth"

function BillingListPage() {
  const [bills, setBills] = useState([])
  const [filteredBills, setFilteredBills] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)

  // Fetch all bills on component mount
  useEffect(() => {
    fetchBills()
  }, [])

  // Update filtered bills when search or filter changes
  useEffect(() => {
    applyFilters()
  }, [bills, searchQuery, filterStatus])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/billing")
      if (response.ok) {
        const result = await response.json()
        
        // Check if result is an array or if the array is inside 'data'
        const billsArray = Array.isArray(result) ? result : (result.data || [])
        
        // Sort bills by creation date descending (newest first)
        const sortedBills = billsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        setBills(sortedBills)
      } else {
        console.error("Failed to fetch bills")
        setBills([])
      }
    } catch (error) {
      console.error("Error fetching bills:", error)
      setBills([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (!Array.isArray(bills)) {
      setFilteredBills([])
      return
    }

    let result = [...bills]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (bill) =>
          bill.billNumber?.toLowerCase().includes(query) ||
          bill.billingInfo?.name?.toLowerCase().includes(query) ||
          bill.billingInfo?.gst?.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (filterStatus === "paid") {
      result = result.filter((bill) => bill.balance <= 0) // Paid means balance is 0 or less
    } else if (filterStatus === "pending") {
      result = result.filter((bill) => bill.balance > 0)
    }

    setFilteredBills(result)
  }

  const handleDeleteBill = async (id) => {
    if (!confirm("Are you sure you want to delete this bill? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/billing/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setBills(prevBills => prevBills.filter((b) => b._id !== id))
        alert("Bill deleted successfully")
      } else {
        alert("Failed to delete bill")
      }
    } catch (error) {
      console.error("Error deleting bill:", error)
      alert("Error deleting bill")
    }
  }

  const handlePrintBill = (bill) => {
    const billNumberPart = bill.billNumber.split("/")[1]
    window.open(`/billing/${bill.financialYear}/${billNumberPart}`, "_blank")
  }

  // Helper to safely calculate totals
  const calculateTotal = (items, field) => {
    if (!Array.isArray(items)) return 0
    return items.reduce((sum, item) => sum + (item[field] || 0), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading bills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Billing Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400">View, manage, and track invoices</p>
          </div>
          <Link href="/billing/create">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Create New Bill
            </Button>
          </Link>
        </div>

        {/* Filters Section */}
        <Card className="mb-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Search className="w-4 h-4" />
                  Search Bills
                </label>
                <Input
                  type="text"
                  placeholder="Search by bill number, client name, or GST..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-gray-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="all">All Bills</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={fetchBills} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bills Table */}
        <Card className="shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
          <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  Showing {filteredBills.length} of {bills.length} bills
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="bg-white dark:bg-gray-900 py-1 px-3">
                  Total: ₹{calculateTotal(filteredBills, 'total').toFixed(2)}
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 py-1 px-3">
                  Pending: ₹{calculateTotal(filteredBills, 'balance').toFixed(2)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Bill No.</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Client Name</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-center">Items</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-center">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.length > 0 ? (
                    filteredBills.map((bill) => (
                      <TableRow key={bill._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                        <TableCell className="font-mono font-medium text-blue-600">
                          {bill.billNumber}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(bill.createdAt).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          {bill.billingInfo?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-normal">
                            {bill.awbs?.length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{(bill.total || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {bill.balance <= 0 ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                              Paid
                            </Badge>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
                                Pending
                              </Badge>
                              <span className="text-[10px] text-red-500 font-semibold mt-1">
                                Bal: ₹{(bill.balance || 0).toFixed(0)}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end items-center gap-1">
                            {/* View Bill */}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              title="View Invoice"
                              onClick={() => handlePrintBill(bill)}
                              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Record Payment */}
                            <Link href={`/billing/payment/${bill.financialYear}/${bill.billNumber.split('/')[1]}`}>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                title="Record Payment"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50"
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>
                            </Link>

                            {/* Edit Bill */}
                            <Link href={`/billing/edit/${bill.financialYear}/${bill.billNumber.split('/')[1]}`}>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                title="Edit Bill"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>

                            {/* Delete Bill */}
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Delete Bill"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteBill(bill._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="7" className="text-center py-16 text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="w-16 h-16 text-gray-200 mb-4" />
                          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No invoices found</p>
                          <p className="text-sm text-gray-500 mb-6">Try adjusting your filters or create a new invoice.</p>
                          <Link href="/billing/create">
                            <Button>
                              <Plus className="w-4 h-4 mr-2" />
                              Create First Bill
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {filteredBills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Card className="shadow-sm border border-blue-100 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-gray-600 text-sm font-medium">Total Invoices</p>
                  <p className="text-3xl font-bold text-gray-900">{filteredBills.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-gray-600 text-sm font-medium">Total Billed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{calculateTotal(filteredBills, 'total').toLocaleString('en-IN')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-green-100 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-green-700 text-sm font-medium">Total Collected</p>
                  <p className="text-2xl font-bold text-green-700">
                    ₹{calculateTotal(filteredBills, 'paid').toLocaleString('en-IN')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-red-100 bg-red-50/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <p className="text-red-700 text-sm font-medium">Outstanding</p>
                  <p className="text-2xl font-bold text-red-700">
                    ₹{calculateTotal(filteredBills, 'balance').toLocaleString('en-IN')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default isAdminAuth(BillingListPage)