// app/awb/[trackingNumber]/page.jsx
"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Pencil,
  Banknote,
  MapPinned,
} from "lucide-react"
import axios from "axios"

// ============================================
// LabelCard Component
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
// IntegrationSuccessModal Component
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
              <p className="text-lg font-bold">{result.serviceName || "Selected Service"}</p>
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
// Edit Sender Details Modal
// ============================================
function EditSenderModal({ isOpen, onClose, senderData, onSave }) {
  const [formData, setFormData] = useState(senderData || {})

  useEffect(() => {
    if (senderData) {
      setFormData({
        name: senderData.name || "",
        company: senderData.company || "",
        email: senderData.email || "",
        contact: senderData.contact || "",
        address: senderData.address || "",
        address2: senderData.address2 || "",
        city: senderData.city || "",
        state: senderData.state || "",
        zip: senderData.zip || "",
        country: senderData.country || "",
      })
    }
  }, [senderData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900">Edit Sender Details for Vendor</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sender Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" name="company" value={formData.company} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Phone Number</Label>
              <Input id="contact" name="contact" value={formData.contact} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address Line 1</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input id="address2" name="address2" value={formData.address2} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" value={formData.state} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP / Postal Code</Label>
              <Input id="zip" name="zip" value={formData.zip} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" value={formData.country} onChange={handleChange} />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// Manual Service Input Modal for Tech440
// ============================================
function ManualServiceInputModal({ isOpen, onClose, onSubmit, loading, originalReceiverZip }) {
  const [serviceCode, setServiceCode] = useState("")
  const [branchName, setBranchName] = useState("")
  const [serviceName, setServiceName] = useState("")
  const [receiverZipCode, setReceiverZipCode] = useState("")
  const [zipcodeId, setZipcodeId] = useState("")

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setServiceCode("")
      setBranchName("")
      setServiceName("")
      setReceiverZipCode(originalReceiverZip || "")
      setZipcodeId("")
    }
  }, [isOpen, originalReceiverZip])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (serviceCode.trim() && branchName.trim() && zipcodeId.trim()) {
      onSubmit({
        serviceCode: serviceCode.trim(),
        branchName: branchName.trim(),
        serviceName: serviceName.trim() || serviceCode.trim(),
        receiverZipCode: receiverZipCode.trim() || originalReceiverZip,
        zipcodeId: zipcodeId.trim()
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Manual Service Entry</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <p className="text-purple-100 text-sm mt-1">
            Enter service details manually for Tech440
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Service Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b pb-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Service Details
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceCode" className="text-sm font-medium text-gray-700">
                  Service Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="serviceCode"
                  value={serviceCode}
                  onChange={(e) => setServiceCode(e.target.value)}
                  placeholder="e.g., AIR, SURFACE"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchName" className="text-sm font-medium text-gray-700">
                  Branch Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="branchName"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g., DELHI, MUMBAI"
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceName" className="text-sm font-medium text-gray-700">
                Service Name (Optional)
              </Label>
              <Input
                id="serviceName"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Display name (defaults to service code)"
                className="w-full"
              />
            </div>
          </div>

          {/* Location Details Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b pb-2">
              <MapPinned className="h-4 w-4 text-purple-600" />
              Receiver Location Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiverZipCode" className="text-sm font-medium text-gray-700">
                  Receiver Postal Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receiverZipCode"
                  value={receiverZipCode}
                  onChange={(e) => setReceiverZipCode(e.target.value)}
                  placeholder="e.g., 10001, W1A 1AA"
                  required
                  className="w-full"
                />
                {originalReceiverZip && (
                  <p className="text-xs text-gray-500">
                    Original: <span className="font-mono bg-gray-100 px-1 rounded">{originalReceiverZip}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipcodeId" className="text-sm font-medium text-gray-700">
                  Zipcode ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="zipcodeId"
                  value={zipcodeId}
                  onChange={(e) => setZipcodeId(e.target.value)}
                  placeholder="e.g., 12345, ABC123"
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Tech440 mapped zipcode ID from rate sheet
                </p>
              </div>
            </div>

            {/* Help Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">How to find Zipcode ID?</p>
                  <p>Contact Tech440 support or check your rate sheet for the correct zipcode_id mapping for the destination postal code.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={loading || !serviceCode.trim() || !branchName.trim() || !zipcodeId.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Generate
                </>
              )}
            </Button>
          </div>
        </form>
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
  const [selectedProductCode, setSelectedProductCode] = useState("SPX")

  // Tech440 State
  const [tech440Rates, setTech440Rates] = useState([])
  const [tech440Loading, setTech440Loading] = useState(false)
  const [tech440RateError, setTech440RateError] = useState(null)

  // Manual Service Input State (for Tech440)
  const [showManualInputModal, setShowManualInputModal] = useState(false)
  const [manualServiceCode, setManualServiceCode] = useState("")
  const [manualBranchName, setManualBranchName] = useState("")
  const [manualServiceName, setManualServiceName] = useState("")
  const [manualReceiverZipCode, setManualReceiverZipCode] = useState("")
  const [manualZipcodeId, setManualZipcodeId] = useState("")

  // Custom Sender Details State
  const [customSenderDetails, setCustomSenderDetails] = useState(null)
  const [showEditSenderModal, setShowEditSenderModal] = useState(false)

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
      // Initialize custom sender details with original data
      if (response.data[0]?.sender) {
        setCustomSenderDetails(response.data[0].sender)
      }
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
      } else {
        console.error("Failed to fetch vendors:", result.error)
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
    setTech440Rates([])
    setTech440RateError(null)
    setManualServiceCode("")
    setManualBranchName("")
    setManualServiceName("")
    setManualReceiverZipCode("")
    setManualZipcodeId("")
    
    // Set default product code
    if (vendor.softwareType === "tech440") {
      setSelectedProductCode("NDX")
    } else if (vendor.softwareType === "xpression") {
      setSelectedProductCode("SPX")
    } else {
      setSelectedProductCode("NONDOX")
    }
  }

  const handleServiceSelect = (service) => {
    if (service === "other") {
      setSelectedService({ serviceName: "other" })
    } else {
      setSelectedService(service)
    }
    setCustomService("")
  }

  // Tech440 Logic - Fetch Rates
  const handleFetchTech440Rates = async () => {
    if (!selectedVendor || selectedVendor.softwareType !== "tech440") return
    
    setTech440Loading(true)
    setTech440RateError(null)
    setSelectedService(null)

    try {
      const response = await fetch("/api/vendor-integrations/check-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendor._id,
          awbData: awbData,
          packageCode: selectedProductCode
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTech440Rates(result.rates)
        if (result.rates.length === 0) {
          setTech440RateError("No rates found for this shipment configuration. You can enter service details manually.")
        }
      } else {
        setTech440RateError(result.error || "Failed to fetch rates. You can enter service details manually.")
      }
    } catch (err) {
      setTech440RateError("Error connecting to rate server. You can enter service details manually.")
    } finally {
      setTech440Loading(false)
    }
  }

  const handleTech440RateSelect = (rate) => {
    setSelectedService({
      serviceName: rate.serviceName,
      serviceCode: rate.serviceCode,
      branchName: rate.branchName,
      packageCode: selectedProductCode,
      zipcodeId: rate.zipcodeId || null, // Include if available from rate
      isManual: false
    })
  }

  // Handle Manual Service Submission for Tech440
  const handleManualServiceSubmit = async (manualData) => {
    setManualServiceCode(manualData.serviceCode)
    setManualBranchName(manualData.branchName)
    setManualServiceName(manualData.serviceName)
    setManualReceiverZipCode(manualData.receiverZipCode)
    setManualZipcodeId(manualData.zipcodeId)
    
    // Set the selected service with manual data including receiver zip and zipcode ID
    setSelectedService({
      serviceName: manualData.serviceName || manualData.serviceCode,
      serviceCode: manualData.serviceCode,
      branchName: manualData.branchName,
      packageCode: selectedProductCode,
      receiverZipCode: manualData.receiverZipCode,
      zipcodeId: manualData.zipcodeId,
      isManual: true
    })
    
    setShowManualInputModal(false)
  }

  // Clear manual service selection
  const handleClearManualService = () => {
    setSelectedService(null)
    setManualServiceCode("")
    setManualBranchName("")
    setManualServiceName("")
    setManualReceiverZipCode("")
    setManualZipcodeId("")
  }

  const isIntegrationValid = () => {
    if (!selectedVendor) return false
    
    // Tech440 Validation
    if (selectedVendor.softwareType === "tech440") {
      return !!selectedService
    }

    // Standard Validation
    if (!selectedService) return false
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

      let serviceData

      // Handle Tech440 (both rate-selected and manual)
      if (selectedVendor.softwareType === "tech440") {
        serviceData = {
          serviceName: selectedService.serviceName,
          serviceCode: selectedService.serviceCode,
          branchName: selectedService.branchName,
          packageCode: selectedProductCode,
          isManual: selectedService.isManual || false,
          // Include receiver zip code and zipcode ID if manual entry
          ...(selectedService.isManual && {
            receiverZipCode: selectedService.receiverZipCode,
            zipcodeId: selectedService.zipcodeId
          }),
          // Include zipcodeId even if from rate selection (if available)
          ...(!selectedService.isManual && selectedService.zipcodeId && {
            zipcodeId: selectedService.zipcodeId
          })
        }
      } else {
        // Standard vendors
        serviceData =
          selectedService.serviceName === "other"
            ? {
                serviceName: customService.trim(),
                serviceCode: customService.trim(),
                apiServiceCode: customService.trim(),
              }
            : selectedService
      }

      const response = await fetch("/api/vendor-integrations/send-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awbId: awbData._id,
          vendorId: selectedVendor._id,
          serviceData: serviceData,
          productCode: selectedProductCode,
          customSenderDetails: customSenderDetails,
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
      setTech440Rates([])
      setManualServiceCode("")
      setManualBranchName("")
      setManualServiceName("")
      setManualReceiverZipCode("")
      setManualZipcodeId("")
      setError(null)
    } catch (err) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIntegrating(false)
    }
  }

  const getVendorColor = (softwareType, isSelected) => {
    if (softwareType === "tech440") {
      return isSelected 
        ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md"
        : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50/50"
    }
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
    if (softwareType === "tech440") return isSelected ? "bg-purple-100" : "bg-gray-100"
    return softwareType === "xpression"
      ? isSelected ? "bg-blue-100" : "bg-gray-100"
      : isSelected ? "bg-emerald-100" : "bg-gray-100"
  }

  const getServiceBgColor = (softwareType) => {
    if (softwareType === "tech440") return "bg-purple-50 border-purple-100"
    return softwareType === "xpression"
      ? "bg-blue-50 border-blue-100"
      : "bg-emerald-50 border-emerald-100"
  }

  const getButtonColor = (softwareType) => {
    if (softwareType === "tech440") return "bg-purple-600 hover:bg-purple-700"
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
      {/* Manual Service Input Modal */}
      <ManualServiceInputModal
        isOpen={showManualInputModal}
        onClose={() => setShowManualInputModal(false)}
        onSubmit={handleManualServiceSubmit}
        loading={integrating}
        originalReceiverZip={awbData?.receiver?.zip || ""}
      />

      {/* Integration Success Modal */}
      <IntegrationSuccessModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        result={integrationResult}
        trackingNumber={trackingNumber}
      />

      {/* Edit Sender Modal */}
      <EditSenderModal 
        isOpen={showEditSenderModal}
        onClose={() => setShowEditSenderModal(false)}
        senderData={customSenderDetails}
        onSave={(newData) => setCustomSenderDetails(newData)}
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
                              {vendor.softwareType === "tech440" ? <Zap className="h-5 w-5"/> : (vendor.softwareType === "xpression" ? <Truck className="h-5 w-5" /> : <Package className="h-5 w-5" />)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{vendor.vendorName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  vendor.softwareType === "tech440" ? "bg-purple-100 text-purple-700" :
                                  vendor.softwareType === "xpression" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {vendor.softwareType === "tech440" ? "Tech440" : (vendor.softwareType === "xpression" ? "Xpression" : "ITD")}
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
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Type
                        </label>
                        <select
                          value={selectedProductCode}
                          onChange={(e) => setSelectedProductCode(e.target.value)}
                          className="w-full md:w-1/3 px-4 py-2.5 rounded-lg border border-gray-200 bg-white"
                        >
                          {selectedVendor.softwareType === "tech440" ? (
                            <>
                              <option value="NDX">NDX (Non-Doc)</option>
                              <option value="DOC">DOC (Document)</option>
                            </>
                          ) : (
                            productCodeOptions.map((option) => (
                              <option key={option.code} value={option.code}>
                                {option.label}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* --- TECH440 SPECIFIC: FETCH RATES --- */}
                      {selectedVendor.softwareType === "tech440" ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              onClick={handleFetchTech440Rates} 
                              disabled={tech440Loading}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              {tech440Loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Banknote className="h-4 w-4 mr-2" />
                              )}
                              Fetch Available Rates
                            </Button>
                            
                            <Button 
                              onClick={() => setShowManualInputModal(true)} 
                              variant="outline"
                              className="border-purple-300 text-purple-700 hover:bg-purple-100"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Manual Entry
                            </Button>
                          </div>

                          {/* Error with manual entry option */}
                          {tech440RateError && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm text-amber-800 font-medium">{tech440RateError}</p>
                                  <button
                                    onClick={() => setShowManualInputModal(true)}
                                    className="text-sm text-purple-700 underline hover:text-purple-900 mt-2 font-medium inline-flex items-center gap-1"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Click here to enter service details manually →
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Manual Service Selected Display */}
                          {selectedService?.isManual && (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-purple-900">Manual Service Selected</p>
                                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-purple-700">
                                    <p><span className="font-medium">Service Code:</span> {selectedService.serviceCode}</p>
                                    <p><span className="font-medium">Branch Name:</span> {selectedService.branchName}</p>
                                    <p><span className="font-medium">Service Name:</span> {selectedService.serviceName}</p>
                                    <p><span className="font-medium">Zipcode ID:</span> <span className="font-mono">{selectedService.zipcodeId}</span></p>
                                    {selectedService.receiverZipCode && (
                                      <p className="col-span-2"><span className="font-medium">Receiver Postal Code:</span> <span className="font-mono">{selectedService.receiverZipCode}</span></p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={handleClearManualService}
                                  className="p-1 hover:bg-purple-100 rounded transition-colors"
                                  title="Clear selection"
                                >
                                  <X className="h-4 w-4 text-purple-600" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Rates Grid */}
                          {tech440Rates.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {tech440Rates.map((rate, idx) => {
                                const isRateSelected = selectedService?.serviceCode === rate.serviceCode && !selectedService?.isManual
                                return (
                                  <div 
                                    key={idx} 
                                    onClick={() => handleTech440RateSelect(rate)}
                                    className={`cursor-pointer border rounded-lg p-3 flex justify-between items-center transition-all ${
                                      isRateSelected 
                                        ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500" 
                                        : "border-gray-200 bg-white hover:border-purple-300"
                                    }`}
                                  >
                                    <div>
                                      <p className="font-bold text-gray-800">{rate.serviceName}</p>
                                      <p className="text-xs text-gray-500">
                                        Code: {rate.serviceCode} | Branch: {rate.branchName}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-green-600">₹{rate.totalPrice}</p>
                                      {isRateSelected && <CheckCircle className="h-4 w-4 text-purple-600 ml-auto mt-1" />}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        // --- STANDARD VENDOR SERVICES ---
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
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
                        </div>
                      )}

                      {/* Common Footer: Edit Sender & Create Label */}
                      <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col md:flex-row justify-between gap-4">
                        <div className="text-sm text-gray-600 self-center">
                          <span className="font-medium">Sender:</span> {customSenderDetails?.name || awbData?.sender?.name}
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowEditSenderModal(true)}
                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-2" />
                            Edit Sender Details for Vendor
                          </Button>
                          <Button
                            onClick={handleIntegration}
                            disabled={integrating || !isIntegrationValid()}
                            className={`flex-1 md:flex-none ${getButtonColor(selectedVendor.softwareType)} text-white disabled:bg-gray-300`}
                          >
                            {integrating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                              </>
                            ) : (
                              <>
                                {selectedVendor.softwareType === 'tech440' ? 'Generate Label' : `Send to ${selectedVendor.vendorName}`}
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