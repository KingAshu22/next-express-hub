// app/api/vendor-integrations/[id]/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"

// GET - Get single vendor integration
export async function GET(request, { params }) {
  try {
    await connectToDB()
    
    const { id } = await params
    
    // Updated select to exclude Tech440 password as well
    const vendor = await VendorIntegration.findById(id)
      .select("-xpressionCredentials.password -itdCredentials.password -itdCredentials.cachedToken -tech440Credentials.password")
    
    if (!vendor) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vendor integration not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: vendor,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error fetching vendor integration:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch vendor integration",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

// PUT - Update vendor integration
export async function PUT(request, { params }) {
  try {
    await connectToDB()
    
    const { id } = await params
    const body = await request.json()
    
    // Debug: Log what we received
    console.log("Update request body:", JSON.stringify(body, null, 2))
    
    const vendor = await VendorIntegration.findById(id)
    
    if (!vendor) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vendor integration not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }
    
    // Check if vendor code is being changed and if new code already exists
    if (body.vendorCode && body.vendorCode.toUpperCase() !== vendor.vendorCode) {
      const existingVendor = await VendorIntegration.findOne({
        vendorCode: body.vendorCode.toUpperCase(),
        _id: { $ne: id },
      })
      
      if (existingVendor) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Vendor code already exists",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }
    }
    
    // Update basic fields
    if (body.vendorName !== undefined) vendor.vendorName = body.vendorName
    if (body.vendorCode !== undefined) vendor.vendorCode = body.vendorCode.toUpperCase()
    if (body.description !== undefined) vendor.description = body.description
    if (body.isActive !== undefined) vendor.isActive = body.isActive
    
    // Update Xpression credentials
    if (vendor.softwareType === "xpression" && body.xpressionCredentials) {
      const newCreds = body.xpressionCredentials
      
      // Update each field explicitly
      if (newCreds.apiUrl !== undefined) vendor.xpressionCredentials.apiUrl = newCreds.apiUrl
      if (newCreds.trackingUrl !== undefined) vendor.xpressionCredentials.trackingUrl = newCreds.trackingUrl
      if (newCreds.userId !== undefined) vendor.xpressionCredentials.userId = newCreds.userId
      
      if (newCreds.password && newCreds.password.trim() !== "") {
        vendor.xpressionCredentials.password = newCreds.password
      }
      
      if (newCreds.customerCode !== undefined) vendor.xpressionCredentials.customerCode = newCreds.customerCode
      if (newCreds.originName !== undefined) vendor.xpressionCredentials.originName = newCreds.originName
      if (newCreds.services !== undefined) vendor.xpressionCredentials.services = newCreds.services
      
      // Mark as modified for Mongoose to detect changes
      vendor.markModified("xpressionCredentials")
    }
    
    // Update ITD credentials
    if (vendor.softwareType === "itd" && body.itdCredentials) {
      const newCreds = body.itdCredentials
      
      if (!vendor.itdCredentials) vendor.itdCredentials = {}
      
      if (newCreds.apiUrl !== undefined) vendor.itdCredentials.apiUrl = newCreds.apiUrl
      
      // Tracking fields
      if (newCreds.trackingApiUrl !== undefined) {
        vendor.itdCredentials.trackingApiUrl = newCreds.trackingApiUrl
      }
      
      if (newCreds.trackingCompanyId !== undefined) {
        const companyId = newCreds.trackingCompanyId === "" || newCreds.trackingCompanyId === null 
          ? null 
          : parseInt(newCreds.trackingCompanyId, 10)
        vendor.itdCredentials.trackingCompanyId = isNaN(companyId) ? null : companyId
      }
      
      if (newCreds.trackingCustomerCode !== undefined) {
        vendor.itdCredentials.trackingCustomerCode = newCreds.trackingCustomerCode
      }
      
      if (newCreds.companyId !== undefined) vendor.itdCredentials.companyId = parseInt(newCreds.companyId, 10)
      if (newCreds.email !== undefined) vendor.itdCredentials.email = newCreds.email
      
      // Only update password if provided and not empty
      if (newCreds.password && newCreds.password.trim() !== "") {
        vendor.itdCredentials.password = newCreds.password
      }
      
      if (newCreds.services !== undefined) vendor.itdCredentials.services = newCreds.services
      
      // Clear token cache if main credentials changed
      if (newCreds.companyId !== undefined || 
          newCreds.email !== undefined || 
          (newCreds.password && newCreds.password.trim() !== "")) {
        vendor.itdCredentials.cachedToken = null
        vendor.itdCredentials.cachedCustomerId = null
        vendor.itdCredentials.tokenExpiresAt = null
      }
      
      vendor.markModified("itdCredentials")
    }

    // ------------------------------------------------------------------
    // NEW: Update Tech440 credentials
    // ------------------------------------------------------------------
    if (vendor.softwareType === "tech440" && body.tech440Credentials) {
      const newCreds = body.tech440Credentials
      
      if (!vendor.tech440Credentials) vendor.tech440Credentials = {}

      if (newCreds.apiUrl !== undefined) vendor.tech440Credentials.apiUrl = newCreds.apiUrl
      if (newCreds.username !== undefined) vendor.tech440Credentials.username = newCreds.username
      if (newCreds.apiKey !== undefined) vendor.tech440Credentials.apiKey = newCreds.apiKey
      
      // Only update password if provided and not empty
      if (newCreds.password && newCreds.password.trim() !== "") {
        vendor.tech440Credentials.password = newCreds.password
      }

      if (newCreds.services !== undefined) vendor.tech440Credentials.services = newCreds.services

      vendor.markModified("tech440Credentials")
    }

    // ------------------------------------------------------------------
    // NEW: Update DHL credentials (Good practice to keep consistent)
    // ------------------------------------------------------------------
    if (vendor.softwareType === "dhl" && body.dhlCredentials) {
      const newCreds = body.dhlCredentials
      if (!vendor.dhlCredentials) vendor.dhlCredentials = {}
      
      if (newCreds.apiKey !== undefined) vendor.dhlCredentials.apiKey = newCreds.apiKey
      
      vendor.markModified("dhlCredentials")
    }
    
    // Debug: Log what we're saving
    console.log("Saving vendor...", {
      type: vendor.softwareType,
      tech440Updated: !!body.tech440Credentials
    })
    
    await vendor.save()
    
    // Fetch fresh data to confirm save
    const updatedVendor = await VendorIntegration.findById(id)
    
    // Remove sensitive data from response
    const responseData = updatedVendor.toObject()
    
    if (responseData.xpressionCredentials) {
      delete responseData.xpressionCredentials.password
    }
    if (responseData.itdCredentials) {
      delete responseData.itdCredentials.password
      delete responseData.itdCredentials.cachedToken
    }
    // Remove Tech440 sensitive data
    if (responseData.tech440Credentials) {
      delete responseData.tech440Credentials.password
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Vendor integration updated successfully",
        data: responseData,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error updating vendor integration:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to update vendor integration",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

// DELETE - Delete vendor integration
export async function DELETE(request, { params }) {
  try {
    await connectToDB()
    
    const { id } = await params
    
    const vendor = await VendorIntegration.findByIdAndDelete(id)
    
    if (!vendor) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vendor integration not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Vendor integration deleted successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error deleting vendor integration:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to delete vendor integration",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}