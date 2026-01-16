// components/VendorIntegrationForm.jsx
"use client"

import { useState, useEffect } from "react"

// Default ITD services
const DEFAULT_ITD_SERVICES = [
  { serviceName: "DPD CLASSIC", serviceCode: "DPD CLASSIC", apiServiceCode: "DPD CLASSIC" },
  { serviceName: "DPD UK NEXT DAY", serviceCode: "DPD UK NEXT DAY", apiServiceCode: "DPD UK NEXT DAY" },
  { serviceName: "USA SELF", serviceCode: "USA SELF", apiServiceCode: "USA SELF" },
  { serviceName: "VIA LHR", serviceCode: "VIA LHR PL", apiServiceCode: "VIA LHR PL" },
]

export default function VendorIntegrationForm({ 
  onSuccess, 
  editData = null,
  onCancel 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    vendorName: "",
    vendorCode: "",
    softwareType: "xpression",
    description: "",
    // Xpression fields
    xpression: {
      apiUrl: "http://courierjourney.xpresion.in/api/v1/Awbentry/Awbentry",
      trackingUrl: "http://courierjourney.xpresion.in/api/v1/Tracking/Tracking",
      userId: "",
      password: "",
      customerCode: "",
      originName: "BOM",
      services: [{ serviceName: "", vendorCode: "", productCode: "SPX" }],
    },
    // ITD fields
    itd: {
      apiUrl: "https://online.expressimpex.com/docket_api",
      companyId: "",
      email: "",
      password: "",
      services: [...DEFAULT_ITD_SERVICES],
    },
  })
  
  // Load edit data if provided
  useEffect(() => {
    if (editData) {
      setFormData({
        vendorName: editData.vendorName || "",
        vendorCode: editData.vendorCode || "",
        softwareType: editData.softwareType || "xpression",
        description: editData.description || "",
        xpression: editData.xpressionCredentials || formData.xpression,
        itd: editData.itdCredentials || formData.itd,
      })
    }
  }, [editData])
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleCredentialChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }))
  }
  
  // Xpression service handlers
  const handleXpressionServiceChange = (index, field, value) => {
    const newServices = [...formData.xpression.services]
    newServices[index] = { ...newServices[index], [field]: value }
    handleCredentialChange("xpression", "services", newServices)
  }
  
  const addXpressionService = () => {
    handleCredentialChange("xpression", "services", [
      ...formData.xpression.services,
      { serviceName: "", vendorCode: "", productCode: "SPX" },
    ])
  }
  
  const removeXpressionService = (index) => {
    if (formData.xpression.services.length > 1) {
      const newServices = formData.xpression.services.filter((_, i) => i !== index)
      handleCredentialChange("xpression", "services", newServices)
    }
  }
  
  // ITD service handlers
  const handleITDServiceChange = (index, field, value) => {
    const newServices = [...formData.itd.services]
    newServices[index] = { ...newServices[index], [field]: value }
    handleCredentialChange("itd", "services", newServices)
  }
  
  const addITDService = () => {
    handleCredentialChange("itd", "services", [
      ...formData.itd.services,
      { serviceName: "", serviceCode: "", apiServiceCode: "" },
    ])
  }
  
  const removeITDService = (index) => {
    if (formData.itd.services.length > 1) {
      const newServices = formData.itd.services.filter((_, i) => i !== index)
      handleCredentialChange("itd", "services", newServices)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        vendorName: formData.vendorName,
        vendorCode: formData.vendorCode,
        softwareType: formData.softwareType,
        description: formData.description,
      }
      
      if (formData.softwareType === "xpression") {
        payload.xpressionCredentials = {
          apiUrl: formData.xpression.apiUrl,
          trackingUrl: formData.xpression.trackingUrl,
          userId: formData.xpression.userId,
          password: formData.xpression.password,
          customerCode: formData.xpression.customerCode,
          originName: formData.xpression.originName,
          services: formData.xpression.services.filter(s => s.serviceName),
        }
      } else {
        payload.itdCredentials = {
          apiUrl: formData.itd.apiUrl,
          companyId: parseInt(formData.itd.companyId, 10),
          email: formData.itd.email,
          password: formData.itd.password,
          services: formData.itd.services.filter(s => s.serviceName),
        }
      }
      
      const url = editData 
        ? `/api/vendor-integrations/${editData._id}`
        : "/api/vendor-integrations"
      
      const response = await fetch(url, {
        method: editData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to save vendor integration")
      }
      
      if (onSuccess) {
        onSuccess(result.data)
      }
      
      // Reset form if not editing
      if (!editData) {
        setFormData({
          vendorName: "",
          vendorCode: "",
          softwareType: "xpression",
          description: "",
          xpression: {
            apiUrl: "http://courierjourney.xpresion.in/api/v1/Awbentry/Awbentry",
            trackingUrl: "http://courierjourney.xpresion.in/api/v1/Tracking/Tracking",
            userId: "",
            password: "",
            customerCode: "",
            originName: "BOM",
            services: [{ serviceName: "", vendorCode: "", productCode: "SPX" }],
          },
          itd: {
            apiUrl: "https://online.expressimpex.com/docket_api",
            companyId: "",
            email: "",
            password: "",
            services: [...DEFAULT_ITD_SERVICES],
          },
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-800">
        {editData ? "Edit Vendor Integration" : "Add New Vendor Integration"}
      </h2>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vendor Name *
          </label>
          <input
            type="text"
            name="vendorName"
            value={formData.vendorName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Courier Journey Express"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vendor Code *
          </label>
          <input
            type="text"
            name="vendorCode"
            value={formData.vendorCode}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="e.g., CJE001"
          />
        </div>
      </div>
      
      {/* Software Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Software Type *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="softwareType"
              value="xpression"
              checked={formData.softwareType === "xpression"}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm">Xpression Software</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="softwareType"
              value="itd"
              checked={formData.softwareType === "itd"}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm">ITD Software (Express Impex)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional description..."
        />
      </div>
      
      {/* Xpression Credentials */}
      {formData.softwareType === "xpression" && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Xpression Credentials</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API URL *
              </label>
              <input
                type="url"
                value={formData.xpression.apiUrl}
                onChange={(e) => handleCredentialChange("xpression", "apiUrl", e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracking URL
              </label>
              <input
                type="url"
                value={formData.xpression.trackingUrl}
                onChange={(e) => handleCredentialChange("xpression", "trackingUrl", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID *
              </label>
              <input
                type="text"
                value={formData.xpression.userId}
                onChange={(e) => handleCredentialChange("xpression", "userId", e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., CJEH065"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.xpression.password}
                onChange={(e) => handleCredentialChange("xpression", "password", e.target.value)}
                required={!editData}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={editData ? "(unchanged)" : "Enter password"}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Code *
              </label>
              <input
                type="text"
                value={formData.xpression.customerCode}
                onChange={(e) => handleCredentialChange("xpression", "customerCode", e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., CJEH065"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origin Name
              </label>
              <input
                type="text"
                value={formData.xpression.originName}
                onChange={(e) => handleCredentialChange("xpression", "originName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., BOM"
              />
            </div>
          </div>
          
          {/* Xpression Services */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Services
              </label>
              <button
                type="button"
                onClick={addXpressionService}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Service
              </button>
            </div>
            
            {formData.xpression.services.map((service, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={service.serviceName}
                  onChange={(e) => handleXpressionServiceChange(index, "serviceName", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Service Name (e.g., DHL EXPRESS)"
                />
                <input
                  type="text"
                  value={service.vendorCode}
                  onChange={(e) => handleXpressionServiceChange(index, "vendorCode", e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Vendor"
                />
                <input
                  type="text"
                  value={service.productCode}
                  onChange={(e) => handleXpressionServiceChange(index, "productCode", e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product"
                />
                {formData.xpression.services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeXpressionService(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* ITD Credentials */}
      {formData.softwareType === "itd" && (
        <div className="space-y-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">ITD Software Credentials</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API URL *
              </label>
              <input
                type="url"
                value={formData.itd.apiUrl}
                onChange={(e) => handleCredentialChange("itd", "apiUrl", e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company ID *
              </label>
              <input
                type="number"
                value={formData.itd.companyId}
                onChange={(e) => handleCredentialChange("itd", "companyId", e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 7"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="text"
                value={formData.itd.email}
                onChange={(e) => handleCredentialChange("itd", "email", e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., USER@EI.COM"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.itd.password}
                onChange={(e) => handleCredentialChange("itd", "password", e.target.value)}
                required={!editData}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={editData ? "(unchanged)" : "Enter password"}
              />
            </div>
          </div>
          
          {/* ITD Services */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Services
              </label>
              <button
                type="button"
                onClick={addITDService}
                className="text-sm text-green-600 hover:text-green-800"
              >
                + Add Service
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.itd.services.map((service, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={service.serviceName}
                    onChange={(e) => handleITDServiceChange(index, "serviceName", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Service Name"
                  />
                  <input
                    type="text"
                    value={service.serviceCode}
                    onChange={(e) => handleITDServiceChange(index, "serviceCode", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Service Code"
                  />
                  <input
                    type="text"
                    value={service.apiServiceCode}
                    onChange={(e) => handleITDServiceChange(index, "apiServiceCode", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="API Service Code"
                  />
                  {formData.itd.services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeITDService(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : (editData ? "Update Vendor" : "Add Vendor")}
        </button>
      </div>
    </form>
  )
}