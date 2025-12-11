"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  AlertTriangle,
  Truck,
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Box,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react"
import PDFViewer from "@/app/_components/PdfViewer"
import axios from "axios"

export default function AWBTrackingPage({ params }) {
  const { trackingNumber } = use(params)

  // Core state
  const [awbData, setAwbData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [integrating, setIntegrating] = useState(false)
  const [showAwbPdf, setShowAwbPdf] = useState(false)
  const [showBoxPdf, setShowBoxPdf] = useState(false)
  const [copied, setCopied] = useState(false)

  // Vendor selection state
  const [selectedVendor, setSelectedVendor] = useState("")

  // Courier Journey state
  const [selectedCJService, setSelectedCJService] = useState("")
  const [otherCJService, setOtherCJService] = useState("")

  // Express Impex state
  const [selectedEIService, setSelectedEIService] = useState("")
  const [otherEIService, setOtherEIService] = useState("")
  const [selectedEIProductCode, setSelectedEIProductCode] = useState("NONDOX")

  // MYS state
  const [selectedMYSService, setSelectedMYSService] = useState("")
  const [otherMYSService, setOtherMYSService] = useState("")
  const [selectedMYSProductCode, setSelectedMYSProductCode] = useState("NONDOX")

  // Service options
  const courierJourneyServices = ["UK SELF", "AUS SELF", "DXB SELF", "SELF", "other"]
  const expressImpexServices = ["DPD CLASSIC", "DPD UK", "other"]
  const expressImpexProductCodes = [
    { code: "NONDOX", label: "Non-Document (Parcels)" },
    { code: "DOX", label: "Documents" },
  ]

  const mysServices = ["DPD_ECO_MYS", "DPD_MYS", "DPD SCOTLAND", "EX_AMS_DPD_MYS", "MYS_LHR_DPD_EUROPE", "MYS_LHR EUROPE UPS", "LHR_UPS ECO", "NIR_DPD", "SELF-SELF", "MYS_SELF", "SELF_DUTYPAID", "other"]
  const mysProductCodes = [
    { code: "NONDOX", label: "Non-Document (Parcels)" },
    { code: "DOX", label: "Documents" },
  ]

  useEffect(() => {
    if (trackingNumber) {
      fetchAWBData()
    }
  }, [trackingNumber])

  const fetchAWBData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/awb/${trackingNumber}`)
      setAwbData(response.data[0])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Courier Journey integration handler
  const handleSendToCourierJourney = async () => {
    const serviceName =
      selectedCJService === "other" ? otherCJService.trim() : selectedCJService

    if (!serviceName) {
      setError("Please select a service before proceeding.")
      return
    }

    try {
      setIntegrating(true)
      setError(null)
      const response = await fetch("/api/courier-journey/send-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awbId: awbData._id,
          trackingNumber,
          service: serviceName,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || "Failed to send to Courier Journey")
        return
      }

      setAwbData(result.updatedAwb)
      setError(null)
    } catch (err) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIntegrating(false)
    }
  }

  // Express Impex integration handler
  const handleSendToExpressImpex = async () => {
    const serviceName =
      selectedEIService === "other" ? otherEIService.trim() : selectedEIService

    if (!serviceName) {
      setError("Please select a service before proceeding.")
      return
    }

    try {
      setIntegrating(true)
      setError(null)
      const response = await fetch("/api/express-impex/send-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awbId: awbData._id,
          trackingNumber,
          service: serviceName,
          productCode: selectedEIProductCode,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || "Failed to send to Express Impex")
        return
      }

      setAwbData(result.updatedAwb)
      setError(null)
    } catch (err) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIntegrating(false)
    }
  }

  // MYS integration handler
  const handleSendToMYS = async () => {
    const serviceName =
      selectedMYSService === "other" ? otherMYSService.trim() : selectedMYSService

    if (!serviceName) {
      setError("Please select a service before proceeding.")
      return
    }

    try {
      setIntegrating(true)
      setError(null)
      const response = await fetch("/api/mys/send-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awbId: awbData._id,
          trackingNumber,
          service: serviceName,
          productCode: selectedMYSProductCode,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || "Failed to send to MYS")
        return
      }

      setAwbData(result.updatedAwb)
      setError(null)
    } catch (err) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIntegrating(false)
    }
  }

  // Validation helpers
  const isCJServiceValid =
    (selectedCJService && selectedCJService !== "other") ||
    (selectedCJService === "other" && otherCJService.trim() !== "")

  const isEIServiceValid =
    (selectedEIService && selectedEIService !== "other") ||
    (selectedEIService === "other" && otherEIService.trim() !== "")

  const isMYSServiceValid =
    (selectedMYSService && selectedMYSService !== "other") ||
    (selectedMYSService === "other" && otherMYSService.trim() !== "")

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 mx-auto rounded-full border-4 border-indigo-100"></div>
            <Loader2 className="absolute top-0 left-1/2 -translate-x-1/2 h-16 w-16 animate-spin text-indigo-600" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading shipment details...</p>
          <p className="text-sm text-gray-400 mt-1">Tracking: {trackingNumber}</p>
        </div>
      </div>
    )
  }

  // Not found state
  if (!awbData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="mx-auto max-w-2xl mt-20">
          <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-red-500 h-2"></div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Shipment Not Found</h2>
              <p className="text-gray-500 mb-6">
                We couldn't find a shipment with tracking number:
                <span className="block font-mono text-lg text-gray-700 mt-2">{trackingNumber}</span>
              </p>
              <Button
                onClick={() => window.history.back()}
                className="bg-gray-800 hover:bg-gray-900 text-white"
              >
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const isEligibleForIntegration = true
  const canIntegrate =
    isEligibleForIntegration && !awbData.cNoteNumber && !awbData.cNoteVendorName
  const isIntegrated = !!awbData.cNoteVendorName

  // Calculate totals
  const totalItems = awbData.boxes?.reduce(
    (acc, box) => acc + (box.items?.length || 0),
    0
  ) || 0

  const totalWeight = awbData.boxes?.reduce(
    (acc, box) => acc + (Number.parseFloat(box.actualWeight) || 0),
    0
  ) || 0

  const totalValue = awbData.boxes?.reduce((acc, box) => {
    return (
      acc +
      (box.items?.reduce((itemAcc, item) => {
        return itemAcc + (Number.parseFloat(item.price) || 0) * (Number.parseInt(item.quantity) || 0)
      }, 0) || 0)
    )
  }, 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Package className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Shipment Details
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">Tracking:</span>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                      {trackingNumber}
                    </code>
                    <button
                      onClick={() => copyToClipboard(trackingNumber)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAWBData}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {isIntegrated ? (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Integrated</span>
                </div>
              ) : canIntegrate ? (
                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Pending Integration</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">Not Eligible</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Card className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
            <div className="p-4 flex gap-3">
              <div className="p-2 bg-red-100 rounded-lg h-fit">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800">Error Occurred</h4>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Box className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Boxes</p>
                <p className="text-xl font-bold text-gray-900">{awbData.boxes?.length || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Items</p>
                <p className="text-xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Weight</p>
                <p className="text-xl font-bold text-gray-900">{totalWeight.toFixed(2)} kg</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Value</p>
                <p className="text-xl font-bold text-gray-900">₹{totalValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Integration Status Card */}
        {isIntegrated && (
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Successfully Integrated</h3>
                    <p className="text-green-100 text-sm mt-1">
                      Vendor: {awbData.cNoteVendorName}
                    </p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                  <p className="text-xs text-green-100 uppercase tracking-wide">AWB / C-Note Number</p>
                  <p className="font-mono text-lg font-bold">{awbData.cNoteNumber}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Vendor Integration Section */}
        {canIntegrate && (
          <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Courier Integration
              </h3>
              <p className="text-indigo-100 text-sm mt-1">
                Select a vendor and service to generate AWB labels
              </p>
            </div>

            <div className="p-6">
              {/* Vendor Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Vendor
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setSelectedVendor("courier-journey")}
                    className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
                      selectedVendor === "courier-journey"
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedVendor === "courier-journey" ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Courier Journey</p>
                      <p className="text-xs opacity-70">International Shipping</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedVendor("express-impex")}
                    className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
                      selectedVendor === "express-impex"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedVendor === "express-impex" ? "bg-emerald-100" : "bg-gray-100"
                    }`}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Express Impex</p>
                      <p className="text-xs opacity-70">DPD Services</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedVendor("mys")}
                    className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
                      selectedVendor === "mys"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedVendor === "mys" ? "bg-emerald-100" : "bg-gray-100"
                    }`}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">MYS</p>
                      <p className="text-xs opacity-70">DPD Services</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Courier Journey Options */}
              {selectedVendor === "courier-journey" && (
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Select Service
                      </label>
                      <select
                        value={selectedCJService}
                        onChange={(e) => {
                          setSelectedCJService(e.target.value)
                          if (e.target.value !== "other") setOtherCJService("")
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-blue-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">Choose service...</option>
                        {courierJourneyServices.map((option) => (
                          <option key={option} value={option}>
                            {option === "other" ? "Other (Custom)" : option}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCJService === "other" && (
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Custom Service Name
                        </label>
                        <input
                          type="text"
                          value={otherCJService}
                          onChange={(e) => setOtherCJService(e.target.value)}
                          placeholder="Enter service name"
                          className="w-full px-4 py-2.5 rounded-lg border border-blue-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    )}

                    <div>
                      <Button
                        onClick={handleSendToCourierJourney}
                        disabled={integrating || !isCJServiceValid}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      >
                        {integrating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Send to Courier Journey
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Express Impex Options */}
              {selectedVendor === "express-impex" && (
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-emerald-900 mb-2">
                        Product Type
                      </label>
                      <select
                        value={selectedEIProductCode}
                        onChange={(e) => setSelectedEIProductCode(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-emerald-200 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      >
                        {expressImpexProductCodes.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-emerald-900 mb-2">
                        Select Service
                      </label>
                      <select
                        value={selectedEIService}
                        onChange={(e) => {
                          setSelectedEIService(e.target.value)
                          if (e.target.value !== "other") setOtherEIService("")
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-emerald-200 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      >
                        <option value="">Choose service...</option>
                        {expressImpexServices.map((option) => (
                          <option key={option} value={option}>
                            {option === "other" ? "Other (Custom)" : option}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedEIService === "other" && (
                      <div>
                        <label className="block text-sm font-medium text-emerald-900 mb-2">
                          Custom Service Code
                        </label>
                        <input
                          type="text"
                          value={otherEIService}
                          onChange={(e) => setOtherEIService(e.target.value)}
                          placeholder="Enter service code"
                          className="w-full px-4 py-2.5 rounded-lg border border-emerald-200 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    )}

                    <div>
                      <Button
                        onClick={handleSendToExpressImpex}
                        disabled={integrating || !isEIServiceValid}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      >
                        {integrating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Send to Express Impex
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                      <Button
                        onClick={handleSendToExpressImpex}
                        disabled={integrating || !isEIServiceValid}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      >
                        {integrating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Send to Express Impex
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>

              {/* MYS Options */}
              {selectedVendor === "mys" && (
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-emerald-900 mb-2">
                        Product Type
                      </label>
                      <select
                        value={selectedMYSProductCode}
                        onChange={(e) => setSelectedMYSProductCode(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-emerald-200 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      >
                        {mysProductCodes.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-emerald-900 mb-2">
                        Select Service
                      </label>
                      <select
                        value={selectedMYSService}
                        onChange={(e) => {
                          setSelectedMYSService(e.target.value)
                          if (e.target.value !== "other") setOtherMYSService("")
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-emerald-200 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      >
                        <option value="">Choose service...</option>
                        {mysServices.map((option) => (
                          <option key={option} value={option}>
                            {option === "other" ? "Other (Custom)" : option}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedMYSService === "other" && (
                      <div>
                        <label className="block text-sm font-medium text-emerald-900 mb-2">
                          Custom Service Code
                        </label>
                        <input
                          type="text"
                          value={otherMYSService}
                          onChange={(e) => setOtherMYSService(e.target.value)}
                          placeholder="Enter service code"
                          className="w-full px-4 py-2.5 rounded-lg border border-emerald-200 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    )}

                    <div>
                      <Button
                        onClick={handleSendToMYS}
                        disabled={integrating || !isMYSServiceValid}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      >
                        {integrating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Send to MYS
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Sender & Receiver */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sender & Receiver Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sender Card */}
              <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-white" />
                  <h3 className="font-semibold text-white text-sm">Sender Details</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900">{awbData.sender?.name || "N/A"}</p>
                    {awbData.sender?.company && (
                      <p className="text-sm text-gray-500">{awbData.sender.company}</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-600">
                      <p>{awbData.sender?.address}</p>
                      {awbData.sender?.address2 && <p>{awbData.sender.address2}</p>}
                      <p>
                        {awbData.sender?.city}, {awbData.sender?.state} {awbData.sender?.zip}
                      </p>
                      <p className="font-medium">{awbData.sender?.country}</p>
                    </div>
                  </div>
                  {awbData.sender?.contact && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {awbData.sender.contact}
                    </div>
                  )}
                  {awbData.sender?.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {awbData.sender.email}
                    </div>
                  )}
                </div>
              </Card>

              {/* Receiver Card */}
              <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-white" />
                  <h3 className="font-semibold text-white text-sm">Receiver Details</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900">{awbData.receiver?.name || "N/A"}</p>
                    {awbData.receiver?.company && (
                      <p className="text-sm text-gray-500">{awbData.receiver.company}</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-600">
                      <p>{awbData.receiver?.address}</p>
                      {awbData.receiver?.address2 && <p>{awbData.receiver.address2}</p>}
                      <p>
                        {awbData.receiver?.city}, {awbData.receiver?.state} {awbData.receiver?.zip}
                      </p>
                      <p className="font-medium">{awbData.receiver?.country}</p>
                    </div>
                  </div>
                  {awbData.receiver?.contact && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {awbData.receiver.contact}
                    </div>
                  )}
                  {awbData.receiver?.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {awbData.receiver.email}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Boxes & Items */}
            <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center gap-2">
                <Box className="h-4 w-4 text-white" />
                <h3 className="font-semibold text-white text-sm">Packages & Items</h3>
              </div>
              <div className="p-4">
                {awbData.boxes?.length > 0 ? (
                  <div className="space-y-4">
                    {awbData.boxes.map((box, boxIndex) => (
                      <div
                        key={boxIndex}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-orange-600">
                                {boxIndex + 1}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">Box {boxIndex + 1}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span className="bg-white px-2 py-1 rounded border">
                              {box.length}×{box.breadth}×{box.height} cm
                            </span>
                            <span className="bg-white px-2 py-1 rounded border">
                              {box.actualWeight} kg
                            </span>
                            <span className="bg-white px-2 py-1 rounded border">
                              {box.items?.length || 0} items
                            </span>
                          </div>
                        </div>
                        {box.items?.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium">Item</th>
                                  <th className="px-4 py-2 text-left font-medium">HSN</th>
                                  <th className="px-4 py-2 text-center font-medium">Qty</th>
                                  <th className="px-4 py-2 text-right font-medium">Price</th>
                                  <th className="px-4 py-2 text-right font-medium">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {box.items.map((item, itemIndex) => (
                                  <tr key={itemIndex} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-900">{item.name}</td>
                                    <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                                      {item.hsnCode || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-center text-gray-600">
                                      {item.quantity}
                                    </td>
                                    <td className="px-4 py-2 text-right text-gray-600">
                                      ₹{Number.parseFloat(item.price || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-gray-900">
                                      ₹{(
                                        Number.parseFloat(item.price || 0) *
                                        Number.parseInt(item.quantity || 0)
                                      ).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No packages found</p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Quick Info & Labels */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-3">
                <h3 className="font-semibold text-white text-sm">Quick Information</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Tracking No.</span>
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {awbData.trackingNumber}
                  </span>
                </div>
                {awbData.cNoteNumber && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">AWB / C-Note</span>
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {awbData.cNoteNumber}
                    </span>
                  </div>
                )}
                {awbData.cNoteVendorName && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Vendor</span>
                    <span className="text-sm font-medium text-gray-900">
                      {awbData.cNoteVendorName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Origin</span>
                  <span className="text-sm font-medium text-gray-900">
                    {awbData.sender?.country || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Destination</span>
                  <span className="text-sm font-medium text-gray-900">
                    {awbData.receiver?.country || "N/A"}
                  </span>
                </div>
                {awbData.sender?.kyc?.type && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">KYC Type</span>
                    <span className="text-sm font-medium text-gray-900">
                      {awbData.sender.kyc.type}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {awbData.createdAt
                      ? new Date(awbData.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Labels Section */}
            {isIntegrated && (awbData.awbLabel || awbData.boxLabel) && (
              <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-3">
                  <h3 className="font-semibold text-white text-sm">Generated Labels</h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* AWB Label */}
                  {awbData.awbLabel && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">AWB Label</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAwbPdf(!showAwbPdf)}
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                        >
                          {showAwbPdf ? "Hide" : "Preview"}
                        </Button>
                      </div>
                      {showAwbPdf && (
                        <div className="p-4 bg-gray-100">
                          {awbData.awbLabel.startsWith("http") ? (
                            <iframe
                              src={awbData.awbLabel}
                              className="w-full h-64 rounded border"
                              title="AWB Label"
                            />
                          ) : (
                            <PDFViewer base64Data={awbData.awbLabel} />
                          )}
                        </div>
                      )}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        {awbData.awbLabel.startsWith("http") ? (
                          <a
                            href={awbData.awbLabel}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Download AWB Label
                          </a>
                        ) : (
                          <a
                            href={`data:application/pdf;base64,${awbData.awbLabel}`}
                            download={`${trackingNumber}-awb-label.pdf`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Download AWB Label
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Box Label */}
                  {awbData.boxLabel && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Box Label</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBoxPdf(!showBoxPdf)}
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                        >
                          {showBoxPdf ? "Hide" : "Preview"}
                        </Button>
                      </div>
                      {showBoxPdf && (
                        <div className="p-4 bg-gray-100">
                          {awbData.boxLabel.startsWith("http") ? (
                            <iframe
                              src={awbData.boxLabel}
                              className="w-full h-64 rounded border"
                              title="Box Label"
                            />
                          ) : (
                            <PDFViewer base64Data={awbData.boxLabel} />
                          )}
                        </div>
                      )}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        {awbData.boxLabel.startsWith("http") ? (
                          <a
                            href={awbData.boxLabel}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Download Box Label
                          </a>
                        ) : (
                          <a
                            href={`data:application/pdf;base64,${awbData.boxLabel}`}
                            download={`${trackingNumber}-box-label.pdf`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Download Box Label
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2024 Express Hub. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Need help?</span>
              <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}