// app/api/vendor-integrations/[id]/services/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"

export async function GET(request, { params }) {
  try {
    await connectToDB()
    
    const { id } = params
    
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
    
    let services = []
    
    if (vendor.softwareType === "xpression" && vendor.xpressionCredentials) {
      services = vendor.xpressionCredentials.services.map(s => ({
        serviceName: s.serviceName,
        serviceCode: s.serviceName,
        apiServiceCode: s.serviceName,
        vendorCode: s.vendorCode || "",
        productCode: s.productCode || "SPX",
      }))
    }
    
    if (vendor.softwareType === "itd" && vendor.itdCredentials) {
      services = vendor.itdCredentials.services.map(s => ({
        serviceName: s.serviceName,
        serviceCode: s.serviceCode,
        apiServiceCode: s.apiServiceCode,
      }))
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          vendorName: vendor.vendorName,
          vendorCode: vendor.vendorCode,
          softwareType: vendor.softwareType,
          services: services,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error fetching vendor services:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch vendor services",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}