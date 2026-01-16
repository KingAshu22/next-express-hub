// app/api/vendor-integrations/[id]/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"

// GET - Get single vendor integration
export async function GET(request, { params }) {
  try {
    await connectToDB()
    
    const { id } = params
    
    const vendor = await VendorIntegration.findById(id)
      .select("-xpressionCredentials.password -itdCredentials.password -itdCredentials.cachedToken")
    
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
    
    const { id } = params
    const body = await request.json()
    
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
    
    // Update fields
    if (body.vendorName) vendor.vendorName = body.vendorName
    if (body.vendorCode) vendor.vendorCode = body.vendorCode.toUpperCase()
    if (body.description !== undefined) vendor.description = body.description
    if (body.isActive !== undefined) vendor.isActive = body.isActive
    
    // Update credentials based on software type
    if (vendor.softwareType === "xpression" && body.xpressionCredentials) {
      vendor.xpressionCredentials = {
        ...vendor.xpressionCredentials.toObject(),
        ...body.xpressionCredentials,
        // Keep existing password if not provided
        password: body.xpressionCredentials.password || vendor.xpressionCredentials.password,
      }
    }
    
    if (vendor.softwareType === "itd" && body.itdCredentials) {
      vendor.itdCredentials = {
        ...vendor.itdCredentials.toObject(),
        ...body.itdCredentials,
        // Keep existing password if not provided
        password: body.itdCredentials.password || vendor.itdCredentials.password,
        // Clear token cache if credentials changed
        cachedToken: null,
        cachedCustomerId: null,
        tokenExpiresAt: null,
      }
    }
    
    await vendor.save()
    
    // Remove sensitive data from response
    const responseData = vendor.toObject()
    if (responseData.xpressionCredentials) {
      delete responseData.xpressionCredentials.password
    }
    if (responseData.itdCredentials) {
      delete responseData.itdCredentials.password
      delete responseData.itdCredentials.cachedToken
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
    
    const { id } = params
    
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