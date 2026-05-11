import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"
import { ITDRateFetcher } from "@/lib/itd-rate-fetcher"
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
      const fetcher = new ITDRateFetcher(vendor)
      await fetcher.initialize()
      const itdRates = await fetcher.fetchRates({
        destinationCode: destCountry,
        originCode: originCountry,
        weight: totalWeight,
        pcs: totalPcs,
        productCode: packageCode,
      })

      rates = itdRates.map(rate => ({
        serviceName: rate.originalName,
        serviceCode: rate.serviceCode,
        branchName: "",
        totalPrice: rate.total,
        breakdown: rate.rawRate || rate.chargesBreakdown,
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
