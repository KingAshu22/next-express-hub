// app/api/vendor-integrations/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"

// GET - List all vendor integrations
export async function GET(request) {
  try {
    await connectToDB()

    const { searchParams } = new URL(request.url)
    const softwareType = searchParams.get("softwareType")
    const isActive = searchParams.get("isActive")

    // Build query
    const query = {}
    if (softwareType) query.softwareType = softwareType
    if (isActive !== null) query.isActive = isActive === "true"

    const vendors = await VendorIntegration.find(query)
      .select("-xpressionCredentials.password -itdCredentials.password -itdCredentials.cachedToken")
      .sort({ createdAt: -1 })

    return new Response(
      JSON.stringify({
        success: true,
        data: vendors,
        count: vendors.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error fetching vendor integrations:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch vendor integrations",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

// POST - Create new vendor integration
export async function POST(request) {
  try {
    await connectToDB()

    const body = await request.json()
    const {
      vendorName,
      vendorCode,
      softwareType,
      description,
      xpressionCredentials,
      itdCredentials,
      tech440Credentials,
    } = body

    // Validation
    if (!vendorName || !vendorCode || !softwareType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vendor name, vendor code, and software type are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check for duplicate vendor code
    const existingVendor = await VendorIntegration.findOne({
      vendorCode: vendorCode.toUpperCase()
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

    // Validate credentials based on software type
    if (softwareType === "xpression") {
      if (!xpressionCredentials?.userId ||
        !xpressionCredentials?.password ||
        !xpressionCredentials?.customerCode) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Xpression credentials (userId, password, customerCode) are required",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    if (softwareType === "itd") {
      if (!itdCredentials?.companyId ||
        !itdCredentials?.email ||
        !itdCredentials?.password) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "ITD credentials (companyId, email, password) are required",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    if (softwareType === "dhl") {
      if (!body.dhlCredentials?.apiKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "DHL Credentials (apiKey) are required",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    if (softwareType === "tech440") {
    if (!tech440Credentials?.username || !tech440Credentials?.password || !tech440Credentials?.apiKey) {
       return new Response(JSON.stringify({ success: false, error: "Tech440 username, password and api_key are required" }), { status: 400 })
    }
  }

    // Create vendor integration
    const vendorData = {
      vendorName,
      vendorCode: vendorCode.toUpperCase(),
      softwareType,
      description: description || "",
      isActive: true,
    }

    if (softwareType === "xpression") {
      vendorData.xpressionCredentials = {
        apiUrl: xpressionCredentials.apiUrl || "http://courierjourney.xpresion.in/api/v1/Awbentry/Awbentry",
        trackingUrl: xpressionCredentials.trackingUrl || "http://courierjourney.xpresion.in/api/v1/Tracking/Tracking",
        userId: xpressionCredentials.userId,
        password: xpressionCredentials.password,
        customerCode: xpressionCredentials.customerCode,
        originName: xpressionCredentials.originName || "BOM",
        services: xpressionCredentials.services || [],
      }
    }

    if (softwareType === "itd") {
      vendorData.itdCredentials = {
        apiUrl: itdCredentials.apiUrl || "https://online.expressimpex.com/docket_api",
        trackingApiUrl: itdCredentials.trackingApiUrl || "",
        trackingCompanyId: itdCredentials.trackingCompanyId ? parseInt(itdCredentials.trackingCompanyId, 10) : null,
        trackingCustomerCode: itdCredentials.trackingCustomerCode || "",
        companyId: itdCredentials.companyId,
        email: itdCredentials.email,
        password: itdCredentials.password,
        services: itdCredentials.services || [],
      }
    }

    if (softwareType === "dhl") {
      vendorData.dhlCredentials = {
        apiKey: body.dhlCredentials.apiKey
      }
    }

    if (softwareType === "tech440") {
    vendorData.tech440Credentials = {
      apiUrl: tech440Credentials.apiUrl || "https://transitpl.com/api",
      username: tech440Credentials.username,
      password: tech440Credentials.password,
      apiKey: tech440Credentials.apiKey,
      services: tech440Credentials.services || []
    }
  }

    const vendor = await VendorIntegration.create(vendorData)

    // Remove sensitive data from response
    const responseData = vendor.toObject()
    if (responseData.xpressionCredentials) {
      delete responseData.xpressionCredentials.password
    }
    if (responseData.itdCredentials) {
      delete responseData.itdCredentials.password
      delete responseData.itdCredentials.cachedToken
    }
    if (responseData.tech440Credentials) {
      delete responseData.tech440Credentials.password
      delete responseData.tech440Credentials.apiKey // optional to strip api key
  }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Vendor integration created successfully",
        data: responseData,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error creating vendor integration:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create vendor integration",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}