import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"
import iso from "iso-3166-1-alpha-2"

export async function POST(request) {
  try {
    await connectToDB()
    const { vendorId, awbData, packageCode } = await request.json()

    const vendor = await VendorIntegration.findById(vendorId)
    if (!vendor || vendor.softwareType !== "tech440") {
      return new Response(JSON.stringify({ success: false, error: "Invalid vendor" }), { status: 400 })
    }

    const creds = vendor.tech440Credentials
    
    // 1. Sanitize API URL (Remove trailing slash if present)
    const baseUrl = creds.apiUrl.replace(/\/$/, "")
    const rateEndpoint = `${baseUrl}/rates/check`
    const zipLookupEndpoint = `${baseUrl}/location/zipcode`

    // 2. Generate Auth Header
    const authHeader = `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`

    // 3. Prepare Common Data
    const destCountry = iso.getCode(awbData.receiver.country) || "US"
    
    // --- START: ZIPCODE LOOKUP LOGIC ---
    const rawZip = awbData.receiver.zip || ""
    
    // 1. Remove spaces, 2. Take first 3 characters
    const searchZip = rawZip.replace(/\s+/g, '').substring(0, 3)

    let finalZipcodeId = rawZip // Default fallback to full zip if lookup fails or returns empty
    
    try {
      console.log(`Looking up zipcode ID for search term: "${searchZip}" (Original: "${rawZip}")`)
      
      const lookupPayload = {
        api_key: creds.apiKey,
        country: destCountry,
        search: searchZip
      }

      // Using POST because we are sending a JSON body
      const lookupResponse = await fetch(zipLookupEndpoint, {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          "Authorization": authHeader,
          "Accept": "application/json"
        },
        body: JSON.stringify(lookupPayload)
      })

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json()
        
        // Check if data array exists and has items
        if (lookupData.status === "success" && Array.isArray(lookupData.data) && lookupData.data.length > 0) {
          // Use the zipcode_id from the first result
          finalZipcodeId = lookupData.data[0].zipcode_id
          console.log(`Zipcode Lookup Success. Mapped "${searchZip}" to ID: ${finalZipcodeId}`)
        } else {
          console.log("Zipcode Lookup: No data found for search term, using original zip.")
        }
      } else {
        console.warn(`Zipcode Lookup API returned status: ${lookupResponse.status}`)
      }
    } catch (zipError) {
      console.error("Zipcode Lookup Failed (falling back to original zip):", zipError)
    }
    // --- END: ZIPCODE LOOKUP LOGIC ---

    // Calculate total weight (default to 0.5 if 0 to avoid API errors)
    const totalWeight = awbData.boxes?.reduce((sum, box) => sum + Number(box.actualWeight || 0), 0) || 0.5
    
    // Map dimensions
    const dimensions = awbData.boxes?.map(box => ({
      units: "cm",
      length: Number(box.length) || 1,
      width: Number(box.breadth) || 1,
      height: Number(box.height) || 1,
      weightb: Number(box.actualWeight) || 1
    })) || []

    // Format Date DD-MM-YYYY
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    const shipDate = `${dd}-${mm}-${yyyy}`

    const payload = {
      api_key: creds.apiKey,
      rate_request: {
        ship_date: shipDate,
        package_code: packageCode || "NDX",
        to_country: destCountry,
        zipcode_id: finalZipcodeId, // This now holds the ID from API or the Original Zip
        weight: {
          value: totalWeight,
          units: "kg"
        },
        dimensions: dimensions
      }
    }

    console.log("Tech440 Rate Endpoint:", rateEndpoint)
    console.log("Tech440 Rate Payload:", JSON.stringify(payload))

    // 4. Make the Rate Request
    const response = await fetch(rateEndpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    })

    // 5. READ RAW TEXT FIRST
    const responseText = await response.text()
    console.log(`Tech440 Status: ${response.status}`)
    
    // 6. Check HTTP Status
    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${responseText || response.statusText}`)
    }

    // 7. Safe Parse
    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      throw new Error(`Invalid JSON received from Tech440. Raw: ${responseText}`)
    }

    if (result.status !== "success") {
      throw new Error(result.message || "Failed to fetch rates (API returned error)")
    }

    // Transform response for frontend
    const rates = (result.data || []).map(item => ({
      serviceName: item.company.name,
      serviceCode: item.company.service_code,
      branchName: item.company.branch_name,
      totalPrice: item.rate["Grand Total"] || item.rate.Total || item.company.total,
      breakdown: item.rate
    }))

    return new Response(JSON.stringify({ success: true, rates }), { status: 200 })

  } catch (error) {
    console.error("Rate check error:", error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Rate fetch failed" 
    }), { status: 500 })
  }
}