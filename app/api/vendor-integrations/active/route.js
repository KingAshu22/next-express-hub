// app/api/vendor-integrations/active/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"

export async function GET(request) {
  try {
    await connectToDB()
    
    const vendors = await VendorIntegration.find({ isActive: true })
      .select("-xpressionCredentials.password -itdCredentials.password -itdCredentials.cachedToken")
      .sort({ vendorName: 1 })
    
    // Format vendors with their services
    const formattedVendors = vendors.map(vendor => {
      let services = []
      let credentials = {}
      
      if (vendor.softwareType === "xpression" && vendor.xpressionCredentials) {
        services = vendor.xpressionCredentials.services.map(s => ({
          serviceName: s.serviceName,
          serviceCode: s.serviceName,
          vendorCode: s.vendorCode || "",
          productCode: s.productCode || "SPX",
        }))
        credentials = {
          apiUrl: vendor.xpressionCredentials.apiUrl,
          originName: vendor.xpressionCredentials.originName,
        }
      }
      
      if (vendor.softwareType === "itd" && vendor.itdCredentials) {
        services = vendor.itdCredentials.services.map(s => ({
          serviceName: s.serviceName,
          serviceCode: s.serviceCode,
          apiServiceCode: s.apiServiceCode,
        }))
        credentials = {
          apiUrl: vendor.itdCredentials.apiUrl,
        }
      }
      
      return {
        _id: vendor._id,
        vendorName: vendor.vendorName,
        vendorCode: vendor.vendorCode,
        softwareType: vendor.softwareType,
        description: vendor.description,
        services: services,
        credentials: credentials,
        usageCount: vendor.usageCount || 0,
      }
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        data: formattedVendors,
        count: formattedVendors.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error fetching active vendors:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch active vendors",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}