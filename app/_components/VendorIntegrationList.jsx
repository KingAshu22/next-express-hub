// components/VendorIntegrationList.jsx
"use client"

import { useState, useEffect } from "react"

export default function VendorIntegrationList({ onEdit, onRefresh }) {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all") // all, xpression, itd
  
  const fetchVendors = async () => {
    setLoading(true)
    try {
      const queryParams = filter !== "all" ? `?softwareType=${filter}` : ""
      const response = await fetch(`/api/vendor-integrations${queryParams}`)
      const result = await response.json()
      
      if (result.success) {
        setVendors(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchVendors()
  }, [filter, onRefresh])
  
  const handleToggleStatus = async (vendorId, currentStatus) => {
    try {
      const response = await fetch(`/api/vendor-integrations/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchVendors()
      } else {
        alert(result.error)
      }
    } catch (err) {
      alert(err.message)
    }
  }
  
  const handleDelete = async (vendorId, vendorName) => {
    if (!confirm(`Are you sure you want to delete "${vendorName}"?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/vendor-integrations/${vendorId}`, {
        method: "DELETE",
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchVendors()
      } else {
        alert(result.error)
      }
    } catch (err) {
      alert(err.message)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Vendor Integrations ({vendors.length})
        </h2>
        
        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded text-sm ${
              filter === "all" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("xpression")}
            className={`px-3 py-1 rounded text-sm ${
              filter === "xpression" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Xpression
          </button>
          <button
            onClick={() => setFilter("itd")}
            className={`px-3 py-1 rounded text-sm ${
              filter === "itd" 
                ? "bg-green-600 text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ITD
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600">{error}</div>
      )}
      
      {/* Vendor List */}
      {vendors.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No vendor integrations found. Add your first vendor above.
        </div>
      ) : (
        <div className="divide-y">
          {vendors.map((vendor) => (
            <div key={vendor._id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-800">
                      {vendor.vendorName}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                      {vendor.vendorCode}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      vendor.softwareType === "xpression"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {vendor.softwareType === "xpression" ? "Xpression" : "ITD"}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      vendor.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {vendor.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  
                  {vendor.description && (
                    <p className="text-sm text-gray-500 mt-1">{vendor.description}</p>
                  )}
                  
                  {/* Services count */}
                  <div className="mt-2 text-sm text-gray-500">
                    {vendor.softwareType === "xpression" && vendor.xpressionCredentials && (
                      <span>
                        {vendor.xpressionCredentials.services?.length || 0} services configured
                      </span>
                    )}
                    {vendor.softwareType === "itd" && vendor.itdCredentials && (
                      <span>
                        {vendor.itdCredentials.services?.length || 0} services configured
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(vendor._id, vendor.isActive)}
                    className={`px-3 py-1 text-sm rounded ${
                      vendor.isActive
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {vendor.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => onEdit(vendor)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(vendor._id, vendor.vendorName)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}