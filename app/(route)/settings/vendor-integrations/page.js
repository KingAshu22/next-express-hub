// app/settings/vendor-integrations/page.jsx
"use client"

import { useState } from "react"
import VendorIntegrationForm from "@/app/_components/VendorIntegrationForm"
import VendorIntegrationList from "@/app/_components/VendorIntegrationList"

export default function VendorIntegrationsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const handleSuccess = () => {
    setShowForm(false)
    setEditData(null)
    setRefreshKey(prev => prev + 1)
  }
  
  const handleEdit = (vendor) => {
    setEditData(vendor)
    setShowForm(true)
  }
  
  const handleCancel = () => {
    setShowForm(false)
    setEditData(null)
  }
  
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Vendor API Integrations
          </h1>
          
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Add New Vendor
            </button>
          )}
        </div>
        
        {showForm && (
          <div className="mb-6">
            <VendorIntegrationForm
              editData={editData}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}
        
        <VendorIntegrationList
          onEdit={handleEdit}
          onRefresh={refreshKey}
        />
      </div>
    </div>
  )
}