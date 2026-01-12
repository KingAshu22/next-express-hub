"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, ChevronDown } from "lucide-react"

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const containerRef = useRef(null)

  const filteredOptions = options.filter(
    (option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()) && !selected.includes(option.value),
  )

  const selectedLabels = selected.map((val) => options.find((opt) => opt.value === val)?.label || val)

  const handleSelectOption = (value) => {
    onChange([...selected, value])
    setSearchTerm("")
  }

  const handleRemoveOption = (value) => {
    onChange(selected.filter((item) => item !== value))
  }

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-10 cursor-pointer"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            !disabled && setIsOpen(!isOpen)
          }
        }}
      >
        {selectedLabels.length > 0 ? (
          selectedLabels.map((label, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveOption(selected[index])
                }}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-background shadow-lg z-50">
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 border-b rounded-none"
            autoFocus
          />
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelectOption(option.value)}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matching options</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
