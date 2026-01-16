// app/awb/[trackingNumber]/page.jsx
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
  Building2,
  Zap,
  Eye,
  EyeOff,
  Printer,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import axios from "axios"

// ============================================
// PDF Label Card Component
// ============================================
function LabelCard({ label, trackingNumber }) {
  const [showPreview, setShowPreview] = useState(false)

  if (!label || !label.data) return null

  const getColorClass = (type) => {
    switch (type) {
      case "awb_label":
        return "from-blue-500 to-blue-600"
      case "box_label":
        return "from-orange-500 to-orange-600"
      case "performa":
        return "from-purple-500 to-purple-600"
      case "shipping_label":
        return "from-teal-500 to-teal-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case "awb_label":
        return <FileText className="h-5 w-5" />
      case "box_label":
        return <Box className="h-5 w-5" />
      case "performa":
        return <FileText className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = `data:application/pdf;base64,${label.data}`
    link.download = `${trackingNumber}-${label.filename || label.type}.pdf`
    link.click()
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    printWindow.document.write(`
      <html>
        <head><title>${label.name}</title></head>
        <body style="margin:0;padding:0;">
          <iframe 
            src="data:application/pdf;base64,${label.data}" 
            style="width:100%;height:100%;border:none;"
          ></iframe>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${getColorClass(label.type)} px-4 py-3 flex items-center justify-between cursor-pointer`}
        onClick={() => setShowPreview(!showPreview)}
      >
        <div className="flex items-center gap-3 text-white">
          {getIcon(label.type)}
          <div>
            <p className="font-medium">{label.name}</p>
            <p className="text-xs opacity-80">{label.filename}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white">
          {showPreview ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="p-4 bg-gray-50">
          <iframe
            src={`data:application/pdf;base64,${label.data}`}
            className="w-full h-[500px] rounded-lg border border-gray-200 bg-white"
            title={label.name}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="text-gray-600"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" /> Hide
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="text-gray-600"
        >
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
        <Button
          size="sm"
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="h-4 w-4 mr-1" /> Download
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Integration Success Modal with Labels
// ============================================
function IntegrationSuccessModal({ isOpen, onClose, result, trackingNumber }) {
  const [expandedLabels, setExpandedLabels] = useState({})

  if (!isOpen || !result) return null

  const handleDownloadAll = () => {
    result.labels?.forEach((label, index) => {
      setTimeout(() => {
        const link = document.createElement("a")
        link.href = `data:application/pdf;base64,${label.data}`
        link.download = `${trackingNumber}-${label.filename || label.type}.pdf`
        link.click()
      }, index * 300)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              <CheckCircle className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Integration Successful!</h2>
              <p className="text-green-100 mt-1">
                AWB has been sent to {result.vendorName}
              </p>
            </div>
          </div>

          {/* AWB Info */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg px-4 py-3">
              <p className="text-xs text-green-100 uppercase">AWB Number</p>
              <p className="text-lg font-bold font-mono">{result.awbNumber}</p>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-3">
              <p className="text-xs text-green-100 uppercase">Vendor</p>
              <p className="text-lg font-bold">{result.vendorName}</p>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-3">
              <p className="text-xs text-green-100 uppercase">Service</p>
              <p className="text-lg font-bold">{result.serviceName}</p>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-3">
              <p className="text-xs text-green-100 uppercase">Software</p>
              <p className="text-lg font-bold capitalize">{result.softwareType}</p>
            </div>
          </div>
        </div>

        {/* Labels Section */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Generated Documents ({result.labels?.length || 0})
            </h3>
            {result.labels?.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-1" /> Download All
              </Button>
            )}
          </div>

          {result.labels?.length > 0 ? (
            <div className="space-y-4">
              {result.labels.map((label, index) => (
                <LabelCard
                  key={`${label.type}-${index}`}
                  label={label}
                  trackingNumber={trackingNumber}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No documents were generated</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
          <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-900 text-white">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Page Component
// ============================================
export default function AWBTrackingPage({ params }) {
  const { trackingNumber } = use(params)

  // Core state
  const [awbData, setAwbData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [integrating, setIntegrating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Vendors state
  const [vendors, setVendors] = useState([])
  const [vendorsLoading, setVendorsLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [customService, setCustomService] = useState("")
  const [selectedProductCode, setSelectedProductCode] = useState("NONDOX")

  // Integration result modal
  const [showResultModal, setShowResultModal] = useState(false)
  const [integrationResult, setIntegrationResult] = useState(null)

  const productCodeOptions = [
    { code: "SPX", label: "Non-Document (Parcels)" },
    { code: "DOX", label: "Documents" },
  ]

  useEffect(() => {
    if (trackingNumber) {
      fetchAWBData()
    }
  }, [trackingNumber])

  useEffect(() => {
    fetchVendors()
  }, [])

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

  const fetchVendors = async () => {
    try {
      setVendorsLoading(true)
      const response = await fetch("/api/vendor-integrations/active")
      const result = await response.json()

      if (result.success) {
        setVendors(result.data)
      }
    } catch (err) {
      console.error("Error fetching vendors:", err)
    } finally {
      setVendorsLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor)
    setSelectedService(null)
    setCustomService("")
    setSelectedProductCode(vendor.softwareType === "xpression" ? "SPX" : "NONDOX")
  }

  const handleServiceSelect = (service) => {
    if (service === "other") {
      setSelectedService({ serviceName: "other" })
    } else {
      setSelectedService(service)
    }
    setCustomService("")
  }

  const isIntegrationValid = () => {
    if (!selectedVendor || !selectedService) return false
    if (selectedService.serviceName === "other" && !customService.trim()) return false
    return true
  }

  const handleIntegration = async () => {
    if (!isIntegrationValid()) {
      setError("Please select a vendor and service before proceeding.")
      return
    }

    try {
      setIntegrating(true)
      setError(null)

      const serviceData =
        selectedService.serviceName === "other"
          ? {
              serviceName: customService.trim(),
              serviceCode: customService.trim(),
              apiServiceCode: customService.trim(),
            }
          : selectedService

      const response = await fetch("/api/vendor-integrations/send-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awbId: awbData._id,
          vendorId: selectedVendor._id,
          serviceData: serviceData,
          productCode: selectedProductCode,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || "Failed to integrate with vendor")
        return
      }

      // Store result and show modal with labels
      setIntegrationResult(result)
      setShowResultModal(true)

      // Update AWB data
      setAwbData((prev) => ({
        ...prev,
        cNoteNumber: result.awbNumber,
        cNoteVendorName: result.vendorName,
        integratedService: result.serviceName,
      }))

      // Reset selection
      setSelectedVendor(null)
      setSelectedService(null)
      setError(null)
    } catch (err) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIntegrating(false)
    }
  }

  const getVendorColor = (softwareType, isSelected) => {
    if (softwareType === "xpression") {
      return isSelected
        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50"
    }
    return isSelected
      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
      : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50"
  }

  const getVendorIconBg = (softwareType, isSelected) => {
    return softwareType === "xpression"
      ? isSelected ? "bg-blue-100" : "bg-gray-100"
      : isSelected ? "bg-emerald-100" : "bg-gray-100"
  }

  const getServiceBgColor = (softwareType) => {
    return softwareType === "xpression"
      ? "bg-blue-50 border-blue-100"
      : "bg-emerald-50 border-emerald-100"
  }

  const getButtonColor = (softwareType) => {
    return softwareType === "xpression"
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-emerald-600 hover:bg-emerald-700"
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-indigo-600 mx-auto" />
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
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Shipment Not Found</h2>
              <p className="text-gray-500 mb-6">
                Tracking number: <span className="font-mono">{trackingNumber}</span>
              </p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const canIntegrate = !awbData.cNoteNumber && !awbData.cNoteVendorName
  const isIntegrated = !!awbData.cNoteVendorName

  const totalItems = awbData.boxes?.reduce((acc, box) => acc + (box.items?.length || 0), 0) || 0
  const totalWeight = awbData.boxes?.reduce((acc, box) => acc + (Number.parseFloat(box.actualWeight) || 0), 0) || 0
  const totalValue = awbData.boxes?.reduce((acc, box) => {
    return acc + (box.items?.reduce((itemAcc, item) => {
      return itemAcc + (Number.parseFloat(item.price) || 0) * (Number.parseInt(item.quantity) || 0)
    }, 0) || 0)
  }, 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Integration Success Modal */}
      <IntegrationSuccessModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        result={integrationResult}
        trackingNumber={trackingNumber}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shipment Details</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">Tracking:</span>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {trackingNumber}
                  </code>
                  <button onClick={() => copyToClipboard(trackingNumber)} className="p-1 hover:bg-gray-100 rounded">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchAWBData}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              {isIntegrated ? (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Integrated</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Card className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-800">Error</h4>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Box className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Boxes</p>
                <p className="text-xl font-bold">{awbData.boxes?.length || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Items</p>
                <p className="text-xl font-bold">{totalItems}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Weight</p>
                <p className="text-xl font-bold">{totalWeight.toFixed(2)} kg</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Value</p>
                <p className="text-xl font-bold">₹{totalValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Integration Status */}
        {isIntegrated && (
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Successfully Integrated</h3>
                    <p className="text-green-100 text-sm">Vendor: {awbData.cNoteVendorName}</p>
                    {awbData.integratedService && (
                      <p className="text-green-100 text-xs">Service: {awbData.integratedService}</p>
                    )}
                  </div>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-3 text-right">
                  <p className="text-xs text-green-100 uppercase">AWB Number</p>
                  <p className="font-mono text-lg font-bold">{awbData.cNoteNumber}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Vendor Integration Section */}
        {canIntegrate && (
          <Card className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="h-5 w-5" /> Courier Integration
              </h3>
              <p className="text-indigo-100 text-sm mt-1">
                Select a vendor and service to generate AWB labels
              </p>
            </div>

            <div className="p-6">
              {vendorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <span className="ml-3 text-gray-600">Loading vendors...</span>
                </div>
              ) : vendors.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No active vendors available</p>
                </div>
              ) : (
                <>
                  {/* Vendor Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Vendor ({vendors.length} available)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {vendors.map((vendor) => {
                        const isSelected = selectedVendor?._id === vendor._id
                        return (
                          <button
                            key={vendor._id}
                            onClick={() => handleVendorSelect(vendor)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${getVendorColor(vendor.softwareType, isSelected)}`}
                          >
                            <div className={`p-2 rounded-lg ${getVendorIconBg(vendor.softwareType, isSelected)}`}>
                              {vendor.softwareType === "xpression" ? (
                                <Truck className="h-5 w-5" />
                              ) : (
                                <Package className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{vendor.vendorName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  vendor.softwareType === "xpression"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {vendor.softwareType === "xpression" ? "Xpression" : "ITD"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {vendor.services?.length || 0} services
                                </span>
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Service Selection */}
                  {selectedVendor && (
                    <div className={`rounded-xl p-5 border ${getServiceBgColor(selectedVendor.softwareType)}`}>
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                        <div className="lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Type
                          </label>
                          <select
                            value={selectedProductCode}
                            onChange={(e) => setSelectedProductCode(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
                          >
                            {productCodeOptions.map((option) => (
                              <option key={option.code} value={option.code}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="lg:col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Service
                          </label>
                          <select
                            value={selectedService?.serviceName || ""}
                            onChange={(e) => {
                              if (e.target.value === "other") {
                                handleServiceSelect("other")
                              } else {
                                const service = selectedVendor.services.find(
                                  (s) => s.serviceName === e.target.value
                                )
                                handleServiceSelect(service)
                              }
                            }}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
                          >
                            <option value="">Choose service...</option>
                            {selectedVendor.services?.map((service, idx) => (
                              <option key={idx} value={service.serviceName}>
                                {service.serviceName}
                              </option>
                            ))}
                            <option value="other">Other (Custom)</option>
                          </select>
                        </div>

                        {selectedService?.serviceName === "other" && (
                          <div className="lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Service
                            </label>
                            <input
                              type="text"
                              value={customService}
                              onChange={(e) => setCustomService(e.target.value)}
                              placeholder="Enter service name"
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
                            />
                          </div>
                        )}

                        <div className={selectedService?.serviceName === "other" ? "lg:col-span-2" : "lg:col-span-5"}>
                          <Button
                            onClick={handleIntegration}
                            disabled={integrating || !isIntegrationValid()}
                            className={`w-full text-white py-2.5 ${getButtonColor(selectedVendor.softwareType)} disabled:bg-gray-300`}
                          >
                            {integrating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                              </>
                            ) : (
                              <>
                                Send to {selectedVendor.vendorName}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Sender & Receiver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-white" />
                  <h3 className="font-semibold text-white text-sm">Sender</h3>
                </div>
                <div className="p-4 space-y-3">
                  <p className="font-semibold">{awbData.sender?.name}</p>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p>{awbData.sender?.address}</p>
                      <p>{awbData.sender?.city}, {awbData.sender?.state} {awbData.sender?.zip}</p>
                      <p className="font-medium">{awbData.sender?.country}</p>
                    </div>
                  </div>
                  {awbData.sender?.contact && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {awbData.sender.contact}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-white" />
                  <h3 className="font-semibold text-white text-sm">Receiver</h3>
                </div>
                <div className="p-4 space-y-3">
                  <p className="font-semibold">{awbData.receiver?.name}</p>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p>{awbData.receiver?.address}</p>
                      <p>{awbData.receiver?.city}, {awbData.receiver?.state} {awbData.receiver?.zip}</p>
                      <p className="font-medium">{awbData.receiver?.country}</p>
                    </div>
                  </div>
                  {awbData.receiver?.contact && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {awbData.receiver.contact}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Boxes */}
            <Card className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center gap-2">
                <Box className="h-4 w-4 text-white" />
                <h3 className="font-semibold text-white text-sm">Packages & Items</h3>
              </div>
              <div className="p-4">
                {awbData.boxes?.map((box, boxIndex) => (
                  <div key={boxIndex} className="border rounded-lg overflow-hidden mb-4 last:mb-0">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-600">{boxIndex + 1}</span>
                        </div>
                        <span className="font-medium">Box {boxIndex + 1}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="bg-white px-2 py-1 rounded border">
                          {box.length}×{box.breadth}×{box.height} cm
                        </span>
                        <span className="bg-white px-2 py-1 rounded border">{box.actualWeight} kg</span>
                      </div>
                    </div>
                    {box.items?.length > 0 && (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">Item</th>
                            <th className="px-4 py-2 text-left font-medium">HSN</th>
                            <th className="px-4 py-2 text-center font-medium">Qty</th>
                            <th className="px-4 py-2 text-right font-medium">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {box.items.map((item, itemIndex) => (
                            <tr key={itemIndex} className="border-t">
                              <td className="px-4 py-2">{item.name}</td>
                              <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.hsnCode || "-"}</td>
                              <td className="px-4 py-2 text-center">{item.quantity}</td>
                              <td className="px-4 py-2 text-right">₹{Number.parseFloat(item.price || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Info */}
          <div className="space-y-6">
            <Card className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-3">
                <h3 className="font-semibold text-white text-sm">Quick Information</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Tracking No.</span>
                  <span className="font-mono text-sm font-medium">{awbData.trackingNumber}</span>
                </div>
                {awbData.cNoteNumber && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-500">AWB No.</span>
                    <span className="font-mono text-sm font-medium">{awbData.cNoteNumber}</span>
                  </div>
                )}
                {awbData.cNoteVendorName && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-500">Vendor</span>
                    <span className="text-sm font-medium">{awbData.cNoteVendorName}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Origin</span>
                  <span className="text-sm font-medium">{awbData.sender?.country}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-500">Destination</span>
                  <span className="text-sm font-medium">{awbData.receiver?.country}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}