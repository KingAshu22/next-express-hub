import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"
import iso from "iso-3166-1-alpha-2"

export async function POST(request) {
  try {
    await connectToDB()
    const { vendorId, awbData, packageCode } = await request.json()

    // 1. Fetch Vendor
    const vendor = await VendorIntegration.findById(vendorId)
    if (!vendor) {
      return new Response(JSON.stringify({ success: false, error: "Vendor not found" }), { status: 404 })
    }

    // 2. Prepare Common Data
    const destCountry = iso.getCode(awbData.receiver.country) || "US"
    const originCountry = iso.getCode(awbData.sender?.country) || "IN" // Default to IN if not provided
    
    // Calculate total weight
    const totalWeight = awbData.boxes?.reduce((sum, box) => sum + Number(box.actualWeight || 0), 0) || 0.5
    const totalPcs = awbData.boxes?.length || 1

    let rates = []

    // ==========================================
    // LOGIC FOR TECH440
    // ==========================================
    if (vendor.softwareType === "tech440") {
      const creds = vendor.tech440Credentials
      
      const baseUrl = creds.apiUrl.replace(/\/$/, "")
      const rateEndpoint = `${baseUrl}/rates/check`
      const zipLookupEndpoint = `${baseUrl}/location/zipcode`
      const authHeader = `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`

      // --- TECH440 ZIPCODE LOOKUP ---
      const rawZip = awbData.receiver.zip || ""
      const searchZip = rawZip.replace(/\s+/g, '').substring(0, 3)
      let finalZipcodeId = rawZip 
      
      try {
        const lookupPayload = { api_key: creds.apiKey, country: destCountry, search: searchZip }
        const lookupResponse = await fetch(zipLookupEndpoint, {
          method: "POST", 
          headers: { "Content-Type": "application/json", "Authorization": authHeader, "Accept": "application/json" },
          body: JSON.stringify(lookupPayload)
        })

        if (lookupResponse.ok) {
          const lookupData = await lookupResponse.json()
          if (lookupData.status === "success" && Array.isArray(lookupData.data) && lookupData.data.length > 0) {
            finalZipcodeId = lookupData.data[0].zipcode_id
          }
        }
      } catch (zipError) {
        console.error("Tech440 Zip lookup failed:", zipError)
      }

      // Format Date for Tech440 (DD-MM-YYYY)
      const today = new Date()
      const t_dd = String(today.getDate()).padStart(2, '0')
      const t_mm = String(today.getMonth() + 1).padStart(2, '0')
      const t_yyyy = today.getFullYear()
      const shipDate = `${t_dd}-${t_mm}-${t_yyyy}`

      const dimensions = awbData.boxes?.map(box => ({
        units: "cm", length: Number(box.length) || 1, width: Number(box.breadth) || 1, height: Number(box.height) || 1, weightb: Number(box.actualWeight) || 1
      })) || []

      const payload = {
        api_key: creds.apiKey,
        rate_request: {
          ship_date: shipDate,
          package_code: packageCode || "NDX",
          to_country: destCountry,
          zipcode_id: finalZipcodeId,
          weight: { value: totalWeight, units: "kg" },
          dimensions: dimensions
        }
      }

      const response = await fetch(rateEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify(payload)
      })

      const responseText = await response.text()
      if (!response.ok) throw new Error(`Tech440 API Error: ${responseText}`)
      
      const result = JSON.parse(responseText)
      if (result.status !== "success") throw new Error(result.message || "Tech440 Error")

      rates = (result.data || []).map(item => ({
        serviceName: item.company.name,
        serviceCode: item.company.service_code,
        branchName: item.company.branch_name,
        totalPrice: item.rate["Grand Total"] || item.rate.Total || item.company.total,
        breakdown: item.rate
      }))
    }

    // ==========================================
    // LOGIC FOR ITD SOFTWARE
    // ==========================================
    else if (vendor.softwareType === "itd") {
      // Assuming you have an 'itdCredentials' object in your Schema
      const creds = vendor.itdCredentials 
      
      // Clean URL
      const baseUrl = creds.apiUrl.replace(/\/$/, "")
      const companyId = creds.companyId || "2" // Default to 2 if not in DB, or require it
      const endpoint = `${baseUrl}/docket_api/customer_rate_cals?api_company_id=${companyId}`

      // Format Date for ITD (YYYY-MM-DD)
      const today = new Date()
      const i_yyyy = today.getFullYear()
      const i_mm = String(today.getMonth() + 1).padStart(2, '0')
      const i_dd = String(today.getDate()).padStart(2, '0')
      const bookingDate = `${i_yyyy}-${i_mm}-${i_dd}`

      // Base64 Encode Credentials (as per docs)
      const encodedUser = Buffer.from(creds.email).toString('base64')
      const encodedPass = Buffer.from(creds.password).toString('base64')

      // Prepare Form Data (application/x-www-form-urlencoded)
      const formData = new URLSearchParams()
      formData.append("product_code", packageCode || "DOX") // Default DOX or SPX
      formData.append("destination_code", destCountry)
      formData.append("booking_date", bookingDate)
      formData.append("origin_code", originCountry)
      formData.append("pcs", totalPcs)
      formData.append("actual_weight", totalWeight)
      formData.append("customer_code", creds.customerCode) // e.g., T001
      formData.append("username", encodedUser)
      formData.append("password", encodedPass)

      console.log("ITD Payload:", formData.toString())

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded" // Standard for form data
        },
        body: formData
      })

      const responseText = await response.text()
      console.log("ITD Response:", responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`Invalid JSON from ITD: ${responseText}`)
      }

      if (result.success === false) {
        // Handle ITD specific error array
        const errorMsg = Array.isArray(result.error) ? result.error.join(", ") : "Unknown ITD Error"
        throw new Error(errorMsg)
      }

      // Map ITD response to unified format
      rates = (result.data || []).map(item => ({
        serviceName: item.code, // ITD returns 'code' like 'UPS'
        serviceCode: item.code,
        branchName: "", // ITD doesn't seem to return branch name in this endpoint
        totalPrice: item.total,
        breakdown: item // Store full object as breakdown (has igst, fsc, etc)
      }))

    } else {
      return new Response(JSON.stringify({ success: false, error: "Unsupported vendor software type" }), { status: 400 })
    }

    // ==========================================
    // FINAL RESPONSE
    // ==========================================
    return new Response(JSON.stringify({ success: true, rates }), { status: 200 })

  } catch (error) {
    console.error("Rate check error:", error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Rate fetch failed" 
    }), { status: 500 })
  }
}