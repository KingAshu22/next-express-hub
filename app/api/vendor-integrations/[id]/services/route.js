// app/api/vendor-integrations/[id]/services/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"
import axios from "axios"

const joinUrl = (baseUrl, path = "") => {
  if (!baseUrl) return path || ""
  if (!path) return baseUrl
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
}

async function getM5CToken(vendor) {
  const creds = vendor.m5cCredentials

  if (
    creds.cachedToken &&
    creds.tokenExpiresAt &&
    Date.now() < new Date(creds.tokenExpiresAt).getTime() - 300000
  ) {
    return creds.cachedToken
  }

  const response = await fetch(joinUrl(creds.apiUrl, "/token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      UserName: creds.username,
      Password: creds.password,
      grant_type: "password",
    }).toString(),
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok || !result.access_token) {
    throw new Error(
      result.error_description ||
        result.error ||
        `M5C token API error: ${response.statusText}`
    )
  }

  const expiresInSeconds = Number(result.expires_in || 86400)
  await VendorIntegration.findByIdAndUpdate(vendor._id, {
    "m5cCredentials.cachedToken": result.access_token,
    "m5cCredentials.tokenExpiresAt": new Date(
      Date.now() + expiresInSeconds * 1000
    ),
  })

  return result.access_token
}

async function fetchM5CServices(vendor) {
  const creds = vendor.m5cCredentials
  const token = await getM5CToken(vendor)
  const endpoint = joinUrl(creds.apiUrl, "/api/GetService/GetServiceList")

  const response = await axios.request({
    method: "GET",
    url: endpoint,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    data: {
      AccountCode: creds.accountCode,
    },
  })

  const services = Array.isArray(response.data)
    ? response.data
    : response.data?.data || response.data?.Services || []

  return services.map((service) => ({
    serviceName: service.Name || service.name || service.Code || "",
    serviceCode: service.Code || service.code || "",
    apiServiceCode: service.Code || service.code || "",
    sector: service.Sector || service.sector || "",
    goodsDesc: "NDox",
    thirdPartyLabel: false,
    raw: service,
  })).filter((service) => service.serviceName && service.serviceCode)
}

export async function GET(request, { params }) {
  try {
    await connectToDB()
    
    // Await params in Next.js 15+
    const { id } = await params
    
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

    if (vendor.softwareType === "m5c" && vendor.m5cCredentials) {
      services = await fetchM5CServices(vendor)
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
