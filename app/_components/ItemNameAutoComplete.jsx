"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function ItemNameAutocomplete({ value, onChange, onHsnSelect, id, required, className }) {
  const [searchTerm, setSearchTerm] = useState(value || "")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState("below")
  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value || "")
    }
  }, [value])

  // Search for HSN codes when search term changes
  useEffect(() => {
    const searchHsn = async () => {
      if (searchTerm.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await axios.get(`/api/hsn?query=${encodeURIComponent(searchTerm)}`)

        if (Array.isArray(response.data)) {
          setResults(response.data)
        } else {
          console.error("Unexpected response format:", response.data)
          setResults([])
        }
      } catch (error) {
        console.error("Error searching HSN codes:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchHsn, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm])

  // Calculate dropdown position based on available space
  const calculateDropdownPosition = () => {
    if (!inputRef.current) return

    const inputRect = inputRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const dropdownHeight = 240 // max-h-60 = 240px

    const spaceBelow = viewportHeight - inputRect.bottom
    const spaceAbove = inputRect.top

    // If there's not enough space below but enough space above, position above
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition("above")
    } else {
      setDropdownPosition("below")
    }
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (item) => {
    setSearchTerm(item.item)
    onChange(item.item)
    onHsnSelect && onHsnSelect(item)
    setShowResults(false)
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    onChange(newValue)
    setShowResults(true)
    // Calculate position when showing results
    setTimeout(calculateDropdownPosition, 0)
  }

  const handleFocus = () => {
    setShowResults(true)
    // Calculate position when showing results
    setTimeout(calculateDropdownPosition, 0)
  }

  // Get dropdown positioning classes
  const getDropdownClasses = () => {
    const baseClasses = "absolute z-50 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"

    if (dropdownPosition === "above") {
      return `${baseClasses} bottom-full mb-1`
    } else {
      return `${baseClasses} top-full mt-1`
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        placeholder="Item Name"
        value={searchTerm}
        autoComplete="off"
        onChange={handleInputChange}
        onFocus={handleFocus}
        required={required}
        className={className}
      />

      {showResults && (results.length > 0 || loading) && (
        <div ref={resultsRef} className={getDropdownClasses()}>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              {searchTerm.length < 2 ? "Type at least 2 characters to search" : "No HSN codes found"}
            </div>
          ) : (
            <div className="divide-y">
              {results.map((item, index) => (
                <div
                  key={item._id || item.code || index}
                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-900 flex-1 mr-2">{item.item}</span>
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">{item.code}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="absolute z-50 w-full mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}
    </div>
  )
}
