"use client"

import { useState } from "react"
import Link from "next/link"
import { parseZipCodes } from "@/lib/utils"
import { Countries } from "../constants/country"
import { generateMultiCountryTemplate, generateSingleCountryTemplate, downloadExcelTemplate } from "@/lib/excelUtils"

export default function RateForm({ initialData, onSubmit, loading, submitLabel = "Create Rate" }) {
  const [rateMode, setRateMode] = useState(initialData?.rateMode || "multi-country")
  const [rateType, setRateType] = useState(initialData?.rateCategory || "purchase")
  const [countrySearch, setCountrySearch] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [selectedZoneCountries, setSelectedZoneCountries] = useState({})
  const [salesMarkupType, setSalesMarkupType] = useState("percentage")
  const [salesMarkupValue, setSalesMarkupValue] = useState(0)
  const [purchaseRateId, setPurchaseRateId] = useState(initialData?.purchaseRateId || "")
  const [purchaseRates, setPurchaseRates] = useState([])
  const [showPurchaseDropdown, setShowPurchaseDropdown] = useState(false)

  const [formData, setFormData] = useState({
    vendorName: initialData?.vendorName || "",
    originalName: initialData?.originalName || "",
    rateCategory: initialData?.rateCategory || "purchase",
    service: initialData?.service || "",
    status: initialData?.status || "hidden",
    targetCountry: initialData?.targetCountry || "",
    refCode: initialData?.refCode || "",
    type: initialData?.type || "",
    rateValueType: initialData?.rateValueType || "base", // "base" or "perKg"
    charges: initialData?.charges || [{ chargeName: "", chargeType: "percentage", chargeValue: 0 }],
    zones: initialData?.zones || [{ zone: "", countries: [], rates: {} }],
    postalZones: initialData?.postalZones || [{ zoneName: "", postalCodes: [], originalInput: "", rates: {} }],
    weightRanges: initialData?.weightRanges || [{ startWeight: 0.5, endWeight: 1, step: 0.5, ratePerKg: 0 }],
  })

  const [filteredCountries, setFilteredCountries] = useState([])

  // Fetch purchase rates when sales type is selected
  const fetchPurchaseRates = async () => {
    try {
      const response = await fetch("/api/rates?category=purchase")
      const data = await response.json()
      setPurchaseRates(data.data || [])
    } catch (error) {
      console.error("Error fetching purchase rates:", error)
    }
  }

  const handleCountrySearch = (value) => {
    setCountrySearch(value)
    if (value.trim()) {
      const filtered = Countries.filter((c) => c.toLowerCase().includes(value.toLowerCase()))
      setFilteredCountries(filtered)
    } else {
      setFilteredCountries([])
    }
  }

  const handleSelectCountry = (country, zoneIndex) => {
    setSelectedZoneCountries((prev) => ({
      ...prev,
      [zoneIndex]: [...(prev[zoneIndex] || []), country],
    }))
    setCountrySearch("")
    setShowCountryDropdown(false)
  }

  const handleRemoveCountry = (country, zoneIndex) => {
    setSelectedZoneCountries((prev) => ({
      ...prev,
      [zoneIndex]: prev[zoneIndex]?.filter((c) => c !== country) || [],
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleChargeChange = (index, field, value) => {
    const newCharges = [...formData.charges]
    newCharges[index][field] = field === "chargeValue" ? Number.parseFloat(value) || 0 : value
    setFormData((prev) => ({
      ...prev,
      charges: newCharges,
    }))
  }

  const addCharge = () => {
    setFormData((prev) => ({
      ...prev,
      charges: [...prev.charges, { chargeName: "", chargeType: "percentage", chargeValue: 0 }],
    }))
  }

  const removeCharge = (index) => {
    setFormData((prev) => ({
      ...prev,
      charges: prev.charges.filter((_, i) => i !== index),
    }))
  }

  const handleZoneChange = (index, field, value) => {
    const newZones = [...formData.zones]
    newZones[index][field] = value
    setFormData((prev) => ({
      ...prev,
      zones: newZones,
    }))
  }

  const handleZoneRateChange = (zoneIndex, weightIndex, value) => {
    const newZones = [...formData.zones]
    if (!newZones[zoneIndex].rates) {
      newZones[zoneIndex].rates = {}
    }
    newZones[zoneIndex].rates[weightIndex] = Number.parseFloat(value) || 0
    setFormData((prev) => ({
      ...prev,
      zones: newZones,
    }))
  }

  const addZone = () => {
    setFormData((prev) => ({
      ...prev,
      zones: [...prev.zones, { zone: "", countries: [], rates: {} }],
    }))
  }

  const removeZone = (index) => {
    setFormData((prev) => ({
      ...prev,
      zones: prev.zones.filter((_, i) => i !== index),
    }))
    setSelectedZoneCountries((prev) => {
      const updated = { ...prev }
      delete updated[index]
      return updated
    })
  }

  const handlePostalZoneChange = (index, field, value) => {
    const newZones = [...formData.postalZones]
    if (field === "originalInput") {
      newZones[index].originalInput = value
      newZones[index].postalCodes = parseZipCodes(value)
    } else {
      newZones[index][field] = value
    }
    setFormData((prev) => ({
      ...prev,
      postalZones: newZones,
    }))
  }

  const handlePostalZoneRateChange = (zoneIndex, weightIndex, value) => {
    const newZones = [...formData.postalZones]
    if (!newZones[zoneIndex].rates) {
      newZones[zoneIndex].rates = {}
    }
    newZones[zoneIndex].rates[weightIndex] = Number.parseFloat(value) || 0
    setFormData((prev) => ({
      ...prev,
      postalZones: newZones,
    }))
  }

  const addPostalZone = () => {
    setFormData((prev) => ({
      ...prev,
      postalZones: [...prev.postalZones, { zoneName: "", postalCodes: [], originalInput: "", rates: {} }],
    }))
  }

  const removePostalZone = (index) => {
    setFormData((prev) => ({
      ...prev,
      postalZones: prev.postalZones.filter((_, i) => i !== index),
    }))
  }

  const handleWeightRangeChange = (index, field, value) => {
    const newRanges = [...formData.weightRanges]
    newRanges[index][field] = Number.parseFloat(value) || 0
    setFormData((prev) => ({
      ...prev,
      weightRanges: newRanges,
    }))
  }

  const addWeightRange = () => {
    setFormData((prev) => ({
      ...prev,
      weightRanges: [...prev.weightRanges, { startWeight: 0.5, endWeight: 1, step: 0.5, ratePerKg: 0 }],
    }))
  }

  const removeWeightRange = (index) => {
    setFormData((prev) => ({
      ...prev,
      weightRanges: prev.weightRanges.filter((_, i) => i !== index),
    }))
  }

  const handleApplyPurchaseRate = async () => {
    const selectedRate = purchaseRates.find((r) => r._id === purchaseRateId)
    if (selectedRate) {
      // Copy all data from purchase rate
      setFormData((prev) => ({
        ...prev,
        zones: selectedRate.zones || [],
        postalZones: selectedRate.postalZones || [],
        weightRanges: selectedRate.weightRanges || [],
        charges: selectedRate.charges || [],
      }))
    }
  }

  const handleApplyMarkup = () => {
    if (!purchaseRateId) return

    const selectedRate = purchaseRates.find((r) => r._id === purchaseRateId)
    if (!selectedRate) return

    setFormData((prev) => {
      const updated = { ...prev }

      // Apply markup to zones
      if (selectedRate.zones && updated.zones) {
        updated.zones = selectedRate.zones.map((zone) => ({
          ...zone,
          rates: Object.entries(zone.rates || {}).reduce((acc, [key, value]) => {
            if (salesMarkupType === "percentage") {
              acc[key] = value * (1 + salesMarkupValue / 100)
            } else {
              acc[key] = value + salesMarkupValue
            }
            return acc
          }, {}),
        }))
      }

      // Apply markup to postal zones
      if (selectedRate.postalZones && updated.postalZones) {
        updated.postalZones = selectedRate.postalZones.map((zone) => ({
          ...zone,
          rates: Object.entries(zone.rates || {}).reduce((acc, [key, value]) => {
            if (salesMarkupType === "percentage") {
              acc[key] = value * (1 + salesMarkupValue / 100)
            } else {
              acc[key] = value + salesMarkupValue
            }
            return acc
          }, {}),
        }))
      }

      return updated
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const submitData = {
      ...formData,
      rateMode,
      rateCategory: rateType,
      purchaseRateId: rateType === "sales" ? purchaseRateId : null,
    }

    // If rateValueType is perKg, multiply rates by weight for storage
    if (formData.rateValueType === "perKg") {
      if (rateMode === "multi-country") {
        submitData.zones = submitData.zones.map((zone) => ({
          ...zone,
          rates: Object.entries(zone.rates || {}).reduce((acc, [key, value]) => {
            const weightIndex = Number.parseInt(key)
            const weight = formData.weightRanges[weightIndex]?.endWeight || 1
            acc[key] = value * weight
            return acc
          }, {}),
        }))
      } else {
        submitData.postalZones = submitData.postalZones.map((zone) => ({
          ...zone,
          rates: Object.entries(zone.rates || {}).reduce((acc, [key, value]) => {
            const weightIndex = Number.parseInt(key)
            const weight = formData.weightRanges[weightIndex]?.endWeight || 1
            acc[key] = value * weight
            return acc
          }, {}),
        }))
      }
    }

    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
      {/* Basic Information */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Vendor Name *</label>
            <input
              type="text"
              name="vendorName"
              value={formData.vendorName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Rate Name *</label>
            <input
              type="text"
              name="originalName"
              value={formData.originalName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Service *</label>
            <input
              type="text"
              name="service"
              value={formData.service}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Rate Type</label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              placeholder="e.g., standard, express"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Rate Category</label>
            <select
              value={rateType}
              onChange={(e) => {
                setRateType(e.target.value)
                if (e.target.value === "sales") {
                  fetchPurchaseRates()
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="purchase">Purchase</option>
              <option value="sales">Sales</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="hidden">Hidden</option>
              <option value="unlisted">Unlisted</option>
              <option value="live">Live</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Ref Code</label>
            <input
              type="text"
              name="refCode"
              value={formData.refCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Rate Category Section */}
      {rateType === "sales" && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Sales Rate Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Select Purchase Rate to Copy</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPurchaseDropdown(!showPurchaseDropdown)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-left focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {purchaseRateId
                    ? purchaseRates.find((r) => r._id === purchaseRateId)?.originalName
                    : "Select purchase rate"}
                </button>
                {showPurchaseDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg bg-background shadow-lg z-10 max-h-48 overflow-y-auto">
                    {purchaseRates.map((rate) => (
                      <div
                        key={rate._id}
                        onClick={() => {
                          setPurchaseRateId(rate._id)
                          setShowPurchaseDropdown(false)
                        }}
                        className="px-3 py-2 hover:bg-secondary/50 cursor-pointer text-foreground text-sm"
                      >
                        {rate.originalName} ({rate.vendorName})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyPurchaseRate}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              Copy Purchase Rate Data
            </button>

            <div className="border-t border-border pt-4 mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Apply Markup</h3>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-sm font-medium text-foreground mb-2">Markup Type</label>
                  <select
                    value={salesMarkupType}
                    onChange={(e) => setSalesMarkupType(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-sm font-medium text-foreground mb-2">Markup Value</label>
                  <input
                    type="number"
                    value={salesMarkupValue}
                    onChange={(e) => setSalesMarkupValue(Number.parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyMarkup}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Apply Markup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate Mode and Value Type */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Rate Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Rate Mode</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/30 transition-colors"
                style={{ borderColor: rateMode === "multi-country" ? "var(--primary)" : "var(--border)" }}
              >
                <input
                  type="radio"
                  value="multi-country"
                  checked={rateMode === "multi-country"}
                  onChange={(e) => setRateMode(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="ml-3">
                  <p className="font-medium text-foreground">Multi-Country</p>
                  <p className="text-sm text-muted-foreground">Multiple countries with zones</p>
                </div>
              </label>
              <label
                className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/30 transition-colors"
                style={{ borderColor: rateMode === "single-country-zip" ? "var(--primary)" : "var(--border)" }}
              >
                <input
                  type="radio"
                  value="single-country-zip"
                  checked={rateMode === "single-country-zip"}
                  onChange={(e) => setRateMode(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="ml-3">
                  <p className="font-medium text-foreground">Single Country (Zip Codes)</p>
                  <p className="text-sm text-muted-foreground">Single country divided by postal zones</p>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="block text-sm font-medium text-foreground mb-3">Rate Value Type</label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="base"
                  checked={formData.rateValueType === "base"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rateValueType: e.target.value }))}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-sm text-foreground">Base Rate (fixed rate)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="perKg"
                  checked={formData.rateValueType === "perKg"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rateValueType: e.target.value }))}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-sm text-foreground">Per Kg Rate (will be multiplied by weight)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Ranges */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Weight Ranges</h2>
          <button
            type="button"
            onClick={addWeightRange}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            + Add Range
          </button>
        </div>
        <div className="space-y-3 overflow-x-auto">
          <div className="inline-block min-w-full pb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-foreground font-medium">Start Weight (kg)</th>
                  <th className="text-left p-2 text-foreground font-medium">End Weight (kg)</th>
                  <th className="text-left p-2 text-foreground font-medium">Step</th>
                  <th className="text-left p-2 text-foreground font-medium">Rate per Kg</th>
                  <th className="text-left p-2 text-foreground font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.weightRanges.map((range, index) => (
                  <tr key={index} className="border-b border-border hover:bg-secondary/20">
                    <td className="p-2">
                      <input
                        type="number"
                        value={range.startWeight}
                        onChange={(e) => handleWeightRangeChange(index, "startWeight", e.target.value)}
                        step="0.1"
                        className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={range.endWeight}
                        onChange={(e) => handleWeightRangeChange(index, "endWeight", e.target.value)}
                        step="0.1"
                        className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={range.step}
                        onChange={(e) => handleWeightRangeChange(index, "step", e.target.value)}
                        step="0.1"
                        className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={range.ratePerKg}
                        onChange={(e) => handleWeightRangeChange(index, "ratePerKg", e.target.value)}
                        step="0.01"
                        className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </td>
                    <td className="p-2">
                      {formData.weightRanges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWeightRange(index)}
                          className="px-2 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-xs font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Multi-Country Mode */}
      {rateMode === "multi-country" && (
        <>
          {/* Charges */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold text-foreground">Charges (Optional)</h2>
              <button
                type="button"
                onClick={addCharge}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                + Add Charge
              </button>
            </div>
            <div className="space-y-4">
              {formData.charges.map((charge, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">Charge Name</label>
                    <input
                      type="text"
                      value={charge.chargeName}
                      onChange={(e) => handleChargeChange(index, "chargeName", e.target.value)}
                      placeholder="e.g., Fuel surcharge"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                    <select
                      value={charge.chargeType}
                      onChange={(e) => handleChargeChange(index, "chargeType", e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="perKg">Per Kg</option>
                      <option value="oneTime">One Time</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">Value</label>
                    <input
                      type="number"
                      value={charge.chargeValue}
                      onChange={(e) => handleChargeChange(index, "chargeValue", e.target.value)}
                      step="0.01"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCharge(index)}
                    className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Zones */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold text-foreground">Zones</h2>
              <button
                type="button"
                onClick={addZone}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                + Add Zone
              </button>
            </div>
            <div className="space-y-6">
              {formData.zones.map((zone, zoneIndex) => (
                <div key={zoneIndex} className="border border-border rounded-lg p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Zone Name</label>
                    <input
                      type="text"
                      value={zone.zone}
                      onChange={(e) => handleZoneChange(zoneIndex, "zone", e.target.value)}
                      placeholder="e.g., Zone 1"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Countries</label>
                    <div className="relative mb-2">
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => handleCountrySearch(e.target.value)}
                        onFocus={() => setShowCountryDropdown(true)}
                        placeholder="Search and select countries..."
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                      {showCountryDropdown && filteredCountries.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg bg-background shadow-lg z-10 max-h-40 overflow-y-auto">
                          {filteredCountries.map((country) => (
                            <div
                              key={country}
                              onClick={() => handleSelectCountry(country, zoneIndex)}
                              className="px-3 py-2 hover:bg-secondary/50 cursor-pointer text-foreground text-sm"
                            >
                              {country}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedZoneCountries[zoneIndex] && selectedZoneCountries[zoneIndex].length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedZoneCountries[zoneIndex].map((country) => (
                          <div
                            key={country}
                            className="bg-primary/10 text-primary px-2 py-1 rounded text-sm flex items-center gap-1"
                          >
                            {country}
                            <button
                              type="button"
                              onClick={() => handleRemoveCountry(country, zoneIndex)}
                              className="ml-1 font-bold hover:text-primary/80"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rates table for this zone */}
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-secondary/20">
                          <th className="p-2 text-left text-foreground font-medium">Weight Range</th>
                          <th className="p-2 text-left text-foreground font-medium">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.weightRanges.map((range, wIndex) => (
                          <tr key={wIndex} className="border-b border-border hover:bg-secondary/10">
                            <td className="p-2 text-foreground">
                              {range.startWeight} - {range.endWeight} kg
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={zone.rates?.[wIndex] || 0}
                                onChange={(e) => handleZoneRateChange(zoneIndex, wIndex, e.target.value)}
                                step="0.01"
                                className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeZone(zoneIndex)}
                    className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors font-medium text-sm"
                  >
                    Remove Zone
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Excel Upload for Multi-Country */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Excel Upload (Optional)</h2>
              <button
                type="button"
                onClick={() => {
                  const template = generateMultiCountryTemplate()
                  downloadExcelTemplate(template, "multi-country-rate-template.csv")
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                Download Template
              </button>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </>
      )}

      {/* Single Country Zip Code Mode */}
      {rateMode === "single-country-zip" && (
        <>
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Country *</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-left focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {formData.targetCountry || "Select country"}
              </button>
              {showCountryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg bg-background shadow-lg z-10 max-h-48 overflow-y-auto">
                  {Countries.map((country) => (
                    <div
                      key={country}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, targetCountry: country }))
                        setShowCountryDropdown(false)
                      }}
                      className="px-3 py-2 hover:bg-secondary/50 cursor-pointer text-foreground text-sm"
                    >
                      {country}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Postal Zones */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold text-foreground">Postal Zones</h2>
              <button
                type="button"
                onClick={addPostalZone}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                + Add Postal Zone
              </button>
            </div>
            <div className="space-y-6">
              {formData.postalZones.map((zone, zoneIndex) => (
                <div key={zoneIndex} className="border border-border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Zone Name</label>
                      <input
                        type="text"
                        value={zone.zoneName}
                        onChange={(e) => handlePostalZoneChange(zoneIndex, "zoneName", e.target.value)}
                        placeholder="e.g., Zone A"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Postal Codes (comma separated or ranges)
                      </label>
                      <input
                        type="text"
                        value={zone.originalInput}
                        onChange={(e) => handlePostalZoneChange(zoneIndex, "originalInput", e.target.value)}
                        placeholder="e.g., 2003,2005,2010-2015"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  {zone.postalCodes.length > 0 && (
                    <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Parsed Codes ({zone.postalCodes.length}):
                      </p>
                      <p className="text-xs text-muted-foreground break-words">{zone.postalCodes.join(", ")}</p>
                    </div>
                  )}

                  {/* Rates table for this postal zone */}
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-secondary/20">
                          <th className="p-2 text-left text-foreground font-medium">Weight Range</th>
                          <th className="p-2 text-left text-foreground font-medium">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.weightRanges.map((range, wIndex) => (
                          <tr key={wIndex} className="border-b border-border hover:bg-secondary/10">
                            <td className="p-2 text-foreground">
                              {range.startWeight} - {range.endWeight} kg
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={zone.rates?.[wIndex] || 0}
                                onChange={(e) => handlePostalZoneRateChange(zoneIndex, wIndex, e.target.value)}
                                step="0.01"
                                className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePostalZone(zoneIndex)}
                    className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors font-medium text-sm"
                  >
                    Remove Zone
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Excel Upload for Single Country */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Excel Upload (Optional)</h2>
              <button
                type="button"
                onClick={() => {
                  const template = generateSingleCountryTemplate()
                  downloadExcelTemplate(template, "single-country-rate-template.csv")
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                Download Template
              </button>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 mb-8 flex-col sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : submitLabel}
        </button>
        <Link
          href="/rates"
          className="flex-1 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-secondary/50 transition-colors font-medium text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
