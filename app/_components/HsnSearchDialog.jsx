"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function HsnSearchDialog({ open, onOpenChange, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const searchHsn = async () => {
      if (searchTerm.length < 4) {
        setResults([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        console.log("Searching for HSN with query:", searchTerm)
        const response = await axios.get(`/api/hsn?query=${encodeURIComponent(searchTerm)}`)
        console.log("HSN search response:", response.data)

        if (Array.isArray(response.data)) {
          setResults(response.data)
        } else {
          console.error("Unexpected response format:", response.data)
          setError("Received invalid data format from server")
          setResults([])
        }
      } catch (error) {
        console.error("Error searching HSN codes:", error)
        setError(error.message || "Failed to search HSN codes")
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchHsn, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm])

  const handleSelect = (item) => {
    console.log("Selected HSN item:", item)
    onSelect(item)
    onOpenChange(false)
  }

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm("")
      setResults([])
      setError(null)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Search HSN Code</DialogTitle>
          <DialogDescription className="text-xs">Search for an item to get its HSN code</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <input
              className="flex h-6 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-xs text-red-500 p-2 border border-red-200 rounded-md bg-red-50">Error: {error}</div>
          )}

          <div className="border rounded-md min-h-[200px] max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">Searching...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">
                {searchTerm.length < 4 ? "Type at least 4 characters to search" : "No HSN codes found for this item"}
              </div>
            ) : (
              <div className="divide-y">
                {results.map((item) => (
                  <div
                    key={item._id || item.code}
                    className="p-3 hover:bg-muted cursor-pointer flex justify-between"
                    onClick={() => handleSelect(item)}
                  >
                    <span className="text-xs">{item.item}</span>
                    <span className="text-xs text-muted-foreground font-mono">{item.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-6 text-xs px-2">
            Cancel
          </Button>
          {results.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
