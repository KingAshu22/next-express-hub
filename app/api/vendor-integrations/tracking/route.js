// app/api/vendor-integrations/tracking/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"
import Awb from "@/models/Awb"

// Fetch tracking from Xpression software
async function fetchXpressionTracking(awbNumber, credentials) {
  const trackingUrl = credentials.trackingUrl ||
    credentials.apiUrl.replace("/Awbentry/Awbentry", "/Tracking/Tracking")

  const payload = {
    UserID: credentials.userId,
    Password: credentials.password,
    AWBNo: awbNumber,
    Type: "A"
  }

  console.log("Xpression Tracking Request:", { url: trackingUrl, awbNumber })

  const response = await fetch(trackingUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Xpression tracking API error: ${response.statusText}`)
  }

  const data = await response.json()

  // Handle nested Response format
  const responseData = data.Response || data

  console.log("Xpression Tracking Response:", {
    ResponseCode: responseData.ResponseCode,
    ErrorCode: responseData.ErrorCode,
    TrackingCount: responseData.Tracking?.length,
    EventsCount: responseData.Events?.length,
  })

  if (responseData.ResponseCode !== "RT01") {
    throw new Error(responseData.ErrorDisc || responseData.APIError || "Failed to fetch tracking")
  }

  return {
    success: true,
    softwareType: "xpression",
    tracking: responseData.Tracking || [],
    events: responseData.Events || [],
    additionalData: responseData.AdditionalData || [],
    rawResponse: responseData,
  }
}

// Fetch tracking from ITD software
async function fetchITDTracking(awbNumber, credentials) {
  // Build tracking URL
  const baseUrl = credentials.trackingApiUrl ||
    credentials.apiUrl.replace("/docket_api", "/api/tracking_api")

  const companyId = credentials.trackingCompanyId || credentials.companyId
  const customerCode = credentials.trackingCustomerCode || ""

  const trackingUrl = `${baseUrl}/get_tracking_data?api_company_id=${companyId}&customer_code=${customerCode}&tracking_no=${awbNumber}`

  console.log("ITD Tracking Request:", trackingUrl)

  const response = await fetch(trackingUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  if (!response.ok) {
    throw new Error(`ITD tracking API error: ${response.statusText}`)
  }

  const data = await response.json()

  console.log("ITD Tracking Response:", {
    isArray: Array.isArray(data),
    length: Array.isArray(data) ? data.length : 0,
    hasErrors: data[0]?.errors,
  })

  // ITD returns an array
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("No tracking data found")
  }

  const trackingData = data[0]

  if (trackingData.errors) {
    throw new Error(typeof trackingData.errors === 'string' ? trackingData.errors : "Tracking data not found")
  }

  // Parse docket_info array into object
  const docketInfo = {}
  if (trackingData.docket_info && Array.isArray(trackingData.docket_info)) {
    trackingData.docket_info.forEach(([key, value]) => {
      docketInfo[key.replace(/\s+/g, "_").replace(/\./g, "")] = value
    })
  }

  return {
    success: true,
    softwareType: "itd",
    tracking: [{
      AWBNo: trackingData.tracking_no,
      BookingDate: docketInfo.Booking_Date,
      Origin: docketInfo.Origin,
      Destination: docketInfo.Destination,
      Consignee: docketInfo.Consignee_Name,
      ServiceName: docketInfo.Service_Name,
      Status: docketInfo.Status,
      DeliveryDate: docketInfo.Delivery_Date_and_Time,
      ForwardingNo: trackingData.forwarding_no,
      ForwardingNo2: trackingData.forwarding_no2,
      ForwardingURL: trackingData.forwarding_url,
      ShipperName: docketInfo.Shipper_Name,
      ShipperCity: docketInfo.Shipper_City,
      ShipperCountry: docketInfo.Shipper_Country,
      ConsigneeCity: docketInfo.Consignee_City,
      ConsigneeCountry: docketInfo.Consignee_Country,
      Weight: trackingData.chargeable_weight,
      Pieces: trackingData.pcs,
      RefNo: trackingData.reference_no,
      JobNo: trackingData.job_no,
      ExpectedDelivery: trackingData.expected_datetime,
      PODImage: trackingData.pod_image,
      PODSignature: trackingData.pod_signature,
    }],
    events: (trackingData.docket_events || []).map(event => ({
      EventDate: event.event_at?.split(" ")[0],
      EventTime: event.event_at?.split(" ")[1],
      EventDate1: formatDate(event.event_at?.split(" ")[0]),
      EventTime1: formatTime(event.event_at?.split(" ")[1]),
      Location: event.event_location || event.add_city || "",
      Status: event.event_description,
      EventType: event.event_type,
      EventState: event.event_state,
      Remark: event.event_remark,
    })),
    docketInfo: docketInfo,
    rawResponse: trackingData,
  }
}

async function fetchDHLTracking(awbNumber, credentials) {
  if (!credentials?.apiKey) throw new Error("DHL API Key missing")

  // Remove spaces from tracking number (e.g. "59 8335 4101" -> "5983354101")
  const cleanNumber = awbNumber.replace(/\s/g, "")

  const response = await fetch(
    `https://api-eu.dhl.com/track/shipments?trackingNumber=${cleanNumber}`,
    {
      method: "GET",
      headers: { "DHL-API-KEY": credentials.apiKey, "Accept": "application/json" }
    }
  )

  if (!response.ok) throw new Error(`DHL API Error: ${response.status}`)

  const data = await response.json()
  if (!data.shipments?.[0]) throw new Error("No DHL shipment found")

  const shipment = data.shipments[0]

  // NORMALIZE DHL DATA TO MATCH YOUR FRONTEND EXPECTATIONS
  const normalizedEvents = (shipment.events || []).map(event => ({
    // ISO string for sorting
    timestamp: event.timestamp,
    // Format required by your UI logic
    EventDate1: new Date(event.timestamp).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }),
    EventTime1: new Date(event.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    Location: event.location?.address?.addressLocality || "",
    Status: event.description || event.status || "Update",
    Remark: event.statusCode === "delivered" ? "Delivered" : ""
  }))

  return {
    success: true,
    softwareType: "dhl",
    tracking: [{
      AWBNo: shipment.id,
      Status: shipment.status?.description,
      Origin: shipment.origin?.address?.addressLocality,
      Destination: shipment.destination?.address?.addressLocality,
      Weight: shipment.details?.totalWeight,
      Pieces: shipment.details?.totalNumberOfPieces
    }],
    events: normalizedEvents,
    rawResponse: data
  }
}

async function fetchTech440Tracking(awbNumber, credentials) {
  const url = `${credentials.apiUrl}/track`
  const authHeader = `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`

  // Docs say "GET" but Body with JSON. We will use POST to ensure body is sent.
  // If strict GET is required, change method to "GET".
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader
    },
    body: JSON.stringify({
      api_key: credentials.apiKey,
      awb_no: awbNumber
    })
  })

  if (!response.ok) throw new Error(`Tech440 API Error: ${response.status}`)

  const result = await response.json()

  if (result.status !== "success") {
    throw new Error(result.message || "Tracking failed")
  }

  const data = result.data || {}

  // Normalize Events
  // Input: "2024-03-02 06:47:00"
  const events = (data.tracking_details || []).map(evt => {
    let timestamp = 0
    let datePart = ""
    let timePart = ""

    if (evt.timestamp) {
      try {
        const dateObj = new Date(evt.timestamp)
        timestamp = dateObj.getTime()

        // Format for UI
        datePart = dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
        timePart = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
      } catch (e) { }
    }

    return {
      timestamp: timestamp,
      EventDate1: datePart,
      EventTime1: timePart,
      Location: evt.location,
      Status: evt.message,
      Remark: ""
    }
  })

  // Normalize Tracking Info
  const normalizedTracking = [{
    AWBNo: data.tracking_code, // Or fwd_awb_no
    Status: data.status,
    Origin: "India", // Usually inferred
    Destination: data.destination,
    Weight: data.weight,
    Pieces: data.number_of_box,
    BookingDate: data.created_at,
    ExpectedDelivery: data.est_delivery_date
  }]

  return {
    success: true,
    softwareType: "tech440",
    tracking: normalizedTracking,
    events: events,
    rawResponse: data
  }
}

// Helper to format date like "8th March 2023"
function formatDate(dateStr) {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr

    const day = date.getDate()
    const month = date.toLocaleString("en-US", { month: "long" })
    const year = date.getFullYear()

    const suffix = (d) => {
      if (d > 3 && d < 21) return "th"
      switch (d % 10) {
        case 1: return "st"
        case 2: return "nd"
        case 3: return "rd"
        default: return "th"
      }
    }

    return `${day}${suffix(day)} ${month} ${year}`
  } catch {
    return dateStr
  }
}

// Helper to format time like "12:50 PM"
function formatTime(timeStr) {
  if (!timeStr) return ""
  try {
    const [hours, minutes] = timeStr.split(":")
    const h = parseInt(hours, 10)
    const m = minutes || "00"
    const period = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    return `${hour12}:${m} ${period}`
  } catch {
    return timeStr
  }
}

export async function POST(request) {
  try {
    await connectToDB()

    const { awbNumber, vendorId, vendorName, forceSoftwareType } = await request.json()

    if (!awbNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "AWB number is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    let vendor = null

    // 1. If we explicitly asked for DHL (from frontend logic)
    if (forceSoftwareType === "dhl") {
      vendor = await VendorIntegration.findOne({ softwareType: "dhl", isActive: true })
    } else if (vendorId) {
      vendor = await VendorIntegration.findById(vendorId)
    } else if (vendorName) {
      vendor = await VendorIntegration.findOne({
        vendorName: { $regex: new RegExp(vendorName, "i") },
        isActive: true
      })
    }

    // If no vendor found, try to find by AWB's integrated vendor
    if (!vendor && !vendorId && !vendorName) {
      const awb = await Awb.findOne({ cNoteNumber: awbNumber })
      if (awb?.integratedVendorId) {
        vendor = await VendorIntegration.findById(awb.integratedVendorId)
      } else if (awb?.cNoteVendorName) {
        vendor = await VendorIntegration.findOne({
          vendorName: { $regex: new RegExp(awb.cNoteVendorName, "i") },
          isActive: true
        })
      }
    }

    if (!vendor) {
      return new Response(
        JSON.stringify({ success: false, error: "Vendor not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!vendor.isActive) {
      return new Response(
        JSON.stringify({ success: false, error: "Vendor is not active" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    let result

    if (vendor.softwareType === "xpression") {
      result = await fetchXpressionTracking(awbNumber, vendor.xpressionCredentials)
    } else if (vendor.softwareType === "itd") {
      result = await fetchITDTracking(awbNumber, vendor.itdCredentials)
    } else if (vendor.softwareType === "dhl") {
      result = await fetchDHLTracking(awbNumber, vendor.dhlCredentials)
    } else if (vendor.softwareType === "tech440") {
      result = await fetchTech440Tracking(awbNumber, vendor.tech440Credentials)
    } else {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown software type: ${vendor.softwareType}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        vendorName: vendor.vendorName,
        vendorCode: vendor.vendorCode,
        softwareType: vendor.softwareType,
        ...result,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Error fetching tracking:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch tracking data",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

// GET method for simple tracking lookups
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const awbNumber = searchParams.get("awbNumber")
    const vendorId = searchParams.get("vendorId")
    const vendorName = searchParams.get("vendorName")

    // Reuse POST logic
    const fakeRequest = {
      json: async () => ({ awbNumber, vendorId, vendorName })
    }

    return POST(fakeRequest)

  } catch (error) {
    console.error("Error in GET tracking:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch tracking data",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}