"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MultiProductForm from "@/app/_components/MultiProductForm"
import EnhancedStockTable from "@/app/_components/EnhancedStockTable"
import FilterPanel from "@/app/_components/FilterPanel"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const { toast } = useToast()
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    partyName: "",
    productName: "",
    fromDate: "",
    toDate: "",
    type: "",
  })

  const fetchStocks = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/stock?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setStocks(result.data)
      }
    } catch (error) {
      console.error("Error fetching stocks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStocks()
  }, [filters])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleStockSubmit = async (formData) => {
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
          description: `${formData.type} stock entry added successfully!`,
        })
        fetchStocks()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Advanced Stock Register Management</h1>
          <p className="text-gray-600 mt-2">
            Complete inventory management with multi-product entries and tax calculations
          </p>
        </div>

        <FilterPanel onFilterChange={handleFilterChange} filters={filters} />

        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="register">Stock Register</TabsTrigger>
            <TabsTrigger value="opening">Opening Stock</TabsTrigger>
            <TabsTrigger value="inward">Stock Inward</TabsTrigger>
            <TabsTrigger value="outward">Stock Outward</TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <EnhancedStockTable stocks={stocks} onStockDeleted={fetchStocks} filters={filters} />
            )}
          </TabsContent>

          <TabsContent value="opening" className="space-y-4">
            <MultiProductForm type="opening" onSubmit={handleStockSubmit} />
          </TabsContent>

          <TabsContent value="inward" className="space-y-4">
            <MultiProductForm type="inward" onSubmit={handleStockSubmit} />
          </TabsContent>

          <TabsContent value="outward" className="space-y-4">
            <MultiProductForm type="outward" onSubmit={handleStockSubmit} />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}
