"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, X } from "lucide-react"

export default function FilterPanel({ onFilterChange, filters }) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleApplyFilters = () => {
    onFilterChange(localFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      partyName: "",
      productName: "",
      fromDate: "",
      toDate: "",
    }
    setLocalFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="partyName">Party Name</Label>
            <Input
              id="partyName"
              name="partyName"
              value={localFilters.partyName}
              onChange={handleInputChange}
              placeholder="Search by party name..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              name="productName"
              value={localFilters.productName}
              onChange={handleInputChange}
              placeholder="Search by product name..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromDate">From Date</Label>
            <Input
              id="fromDate"
              name="fromDate"
              type="date"
              value={localFilters.fromDate}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate">To Date</Label>
            <Input id="toDate" name="toDate" type="date" value={localFilters.toDate} onChange={handleInputChange} />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleApplyFilters}>
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          <Button onClick={handleClearFilters} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
