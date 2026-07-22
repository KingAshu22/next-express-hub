// app/api/vendor-integrations/tracking/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"
import Awb from "@/models/Awb"

const joinUrl = (baseUrl, path = "") => {
  if (!baseUrl) return path || ""
  if (!path) return baseUrl
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
}

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const buildSKartHeaders = (creds) => {
  const headers = { "Content-Type": "application/json" }
  if (creds.apiKey) headers["x-api-key"] = creds.apiKey
  if (creds.authToken) headers.Authorization = `Bearer ${creds.authToken}`
  return headers
}

const SHREE_MARUTI_DEFAULT_TRACKING_URL = "https://apis-hubops.innofulfill.com/tracking/v2"
const SHREE_MARUTI_VENDOR_PATTERN = /shree\s*maruti/i
const SUNEX_ANDHERI_HUB = "SunEx Services - Andheri HUB"
const SHREE_MARUTI_PICKUP_LOCATION =
  "SHOP 34, KENORITA GARMENT HUB, CAVES ROAD, WES.EX. HIGHWAY JOGESHWARI. EAST MUMBAI - 400060, , 400060, JOGESHWARI, MAHARASHTRA, India"

const isShreeMarutiVendorName = (vendorName = "") =>
  SHREE_MARUTI_VENDOR_PATTERN.test(String(vendorName))

const SKYNET_TRACKING_URL = "https://www.skynetww.com/api/track-skylink"
const SKYNET_VENDOR_PATTERN = /sky\s*net/i

const isSkynetVendorName = (vendorName = "") =>
  SKYNET_VENDOR_PATTERN.test(String(vendorName))

const sanitizeShreeMarutiLocation = (location = "") => {
  const normalized = String(location || "").replace(/\s+/g, " ").trim()
  const pickupLocation = SHREE_MARUTI_PICKUP_LOCATION.replace(/\s+/g, " ").trim()
  return normalized === pickupLocation ? SUNEX_ANDHERI_HUB : location
}

const normalizeXpressionArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  return [value]
}

const pickFirst = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value
    }
  }
  return ""
}

const normalizeXpressionTrackingRow = (row = {}, awbNumber = "") => ({
  AWBNo: pickFirst(row, ["AWBNo", "AWBNO", "AwbNo", "awbNo", "AWB", "DocketNo"]) || awbNumber,
  BookingDate: pickFirst(row, ["BookingDate", "BookDate", "PickupDate", "ShipmentDate", "Date"]),
  Origin: pickFirst(row, ["Origin", "OriginName", "OriginCity", "From"]),
  Destination: pickFirst(row, ["Destination", "DestinationName", "DestinationCity", "To"]),
  Consignee: pickFirst(row, ["Consignee", "ConsigneeName", "ReceiverName"]),
  ServiceName: pickFirst(row, ["ServiceName", "Service", "ProductCode"]),
  Status: pickFirst(row, ["Status", "CurrentStatus", "ShipmentStatus", "LastStatus"]),
  DeliveryDate: pickFirst(row, ["DeliveryDate", "DeliveredDate", "PODDate"]),
  ForwardingNo: pickFirst(row, ["ForwardingNo", "ForwardingNumber", "ForwarderNo"]),
  ForwardingURL: pickFirst(row, ["ForwardingURL", "ForwardingLink", "ForwarderUrl"]),
  ShipperName: pickFirst(row, ["ShipperName", "SenderName"]),
  ShipperCity: pickFirst(row, ["ShipperCity", "SenderCity"]),
  ConsigneeCity: pickFirst(row, ["ConsigneeCity", "ReceiverCity"]),
  Weight: pickFirst(row, ["Weight", "ActualWeight", "ChargeableWeight"]),
  Pieces: pickFirst(row, ["Pieces", "Pcs", "NoOfPieces"]),
  RefNo: pickFirst(row, ["RefNo", "CustomerRefNo", "ReferenceNo"]),
  ExpectedDelivery: pickFirst(row, ["ExpectedDelivery", "EDD", "ExpectedDeliveryDate"]),
  PODImage: pickFirst(row, ["PODImage", "PodImage", "POD"]),
  ...row,
})

const normalizeXpressionEvent = (event = {}) => {
  const eventDate = pickFirst(event, ["EventDate", "Date", "ScanDate", "StatusDate", "ActivityDate"])
  const eventTime = pickFirst(event, ["EventTime", "Time", "ScanTime", "StatusTime", "ActivityTime"])
  const eventDateTime = pickFirst(event, ["EventDateTime", "DateTime", "ScanDateTime", "StatusDateTime", "timestamp"])
  const dateSource = eventDate || eventDateTime
  const timeSource = eventTime || eventDateTime

  return {
    EventDate: eventDate || eventDateTime,
    EventTime: eventTime,
    EventDate1: pickFirst(event, ["EventDate1", "FormattedDate"]) || formatDate(dateSource),
    EventTime1: pickFirst(event, ["EventTime1", "FormattedTime"]) || formatTime(timeSource),
    Location: pickFirst(event, ["Location", "City", "ScanLocation", "CurrentLocation"]),
    Status: pickFirst(event, ["Status", "ShipmentStatus", "Event", "Activity", "Description"]) || "Update",
    Remark: pickFirst(event, ["Remark", "Remarks", "Comment", "Details", "Description"]),
    ...event,
  }
}

// Fetch tracking from Xpression software
async function fetchXpressionTracking(awbNumber, credentials) {
  if (!credentials?.userId || !credentials?.password) {
    throw new Error("Xpression tracking credentials are not configured")
  }

  const trackingUrl = credentials.trackingUrl ||
    credentials.apiUrl?.replace("/Awbentry/Awbentry", "/Tracking/Tracking")

  if (!trackingUrl) {
    throw new Error("Xpression tracking URL is not configured")
  }

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
  const trackingRows = normalizeXpressionArray(
    responseData.Tracking ||
      responseData.TrackingData ||
      responseData.Shipment ||
      responseData.ShipmentData ||
      responseData.AWBTracking
  ).map((row) => normalizeXpressionTrackingRow(row, awbNumber))

  const eventRows = normalizeXpressionArray(
    responseData.Events ||
      responseData.Event ||
      responseData.TrackingEvents ||
      responseData.ScanDetails ||
      responseData.History ||
      responseData.TrackingHistory
  ).map(normalizeXpressionEvent)

  console.log("Xpression Tracking Response:", {
    ResponseCode: responseData.ResponseCode,
    ErrorCode: responseData.ErrorCode,
    TrackingCount: trackingRows.length,
    EventsCount: eventRows.length,
  })

  if (responseData.Status === "Fail" || (responseData.ResponseCode && responseData.ResponseCode !== "RT01")) {
    throw new Error(responseData.ErrorDisc || responseData.APIError || "Failed to fetch tracking")
  }

  if (trackingRows.length === 0 && eventRows.length === 0) {
    throw new Error("No Xpression tracking data found")
  }

  return {
    success: true,
    softwareType: "xpression",
    tracking: trackingRows,
    events: eventRows,
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
    AWBNo: data.tracking_code, 
    Status: data.status,
    Origin: "India", 
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

// Fetch tracking from SkyNet's public Skylink tracking API (no credentials required)
async function fetchSkyNetTracking(awbNumber) {
  const url = `${SKYNET_TRACKING_URL}?awbNo=${encodeURIComponent(awbNumber)}`

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  const result = await response.json().catch(() => ({}))
  const data = result?.data

  // result.stateCode is the API call status; data.status is the tracking lookup status
  // (both are "SUCCESS" on a valid AWB — data.shipmentDetails[0].status holds the actual shipment status)
  if (result?.stateCode !== "SUCCESS" || !data || data.status !== "SUCCESS") {
    throw new Error(result?.message || data?.message || "SkyNet tracking data not found")
  }

  const details = data.shipmentDetails?.[0] || {}

  // SkyNet gives Date: "30-JUN-2026", Time: "20:18:53"
  const events = (data.shipmentHistory || []).map((hist) => ({
    EventDate: hist.date,
    EventTime: hist.time,
    EventDate1: formatDate(hist.date),
    EventTime1: formatTime(hist.time),
    Location: hist.location,
    Status: hist.shipmentStatus, // e.g. "In transit"
    Remark: hist.shipmentDetails, // e.g. "SHIPMENT ARRIVED AT ORIGIN"
  }))

  const normalizedTracking = [{
    AWBNo: details.airwayBillNo || data.shipmentOrderID || awbNumber,
    Status: details.status || events[0]?.Status || "Unknown",
    Origin: details.originHub || "",
    Destination: details.destination || "",
    Weight: details.weight || "",
    Pieces: details.pieces || "",
    BookingDate: details.awbDate || "",
    DeliveryDate: details.deliveryDate || "",
    Consignee: details.consigneeName || "",
    ConsigneeCity: details.consigneeLocation || "",
    ShipperName: details.shipperName || "",
    ShipperCity: details.shipperLocation || "",
    ServiceName: details.serviceName || "",
    Forwarder: details.forwarder || "",
    ForwarderNo: details.forwarderNo || "",
  }]

  return {
    success: true,
    softwareType: "skynet",
    tracking: normalizedTracking,
    events,
    rawResponse: result,
  }
}

async function fetchSKartTracking(awbNumber, credentials) {
  const url = joinUrl(credentials.apiUrl, credentials.trackingApiPath)
  const payload = {
    awb_no: awbNumber,
    tracking_no: awbNumber,
    customer_code: credentials.customerCode || undefined,
    username: credentials.username || undefined,
    password: credentials.password || undefined,
  }

  const response = await fetch(url, {
    method: "POST",
    headers: buildSKartHeaders(credentials),
    body: JSON.stringify(payload),
  })

  const result = await response.json()
  if (!response.ok) {
    throw new Error(result?.message || result?.error || "SKart tracking request failed")
  }

  const data = result?.data || result?.result || result
  const eventsSource = data?.events || data?.tracking || data?.history || data?.scan || []
  const events = Array.isArray(eventsSource)
    ? eventsSource.map((evt) => ({
        timestamp: evt.timestamp || evt.date_time || evt.datetime || "",
        EventDate1: formatDate(evt.date || evt.event_date || evt.timestamp || ""),
        EventTime1: formatTime(evt.time || evt.event_time || evt.timestamp || ""),
        Location: evt.location || evt.city || evt.hub || "",
        Status: evt.status || evt.description || evt.remark || "Update",
        Remark: evt.remark || evt.details || "",
      }))
    : []

  const normalizedTracking = [{
    AWBNo: data?.awb_no || data?.tracking_no || data?.awbNumber || awbNumber,
    Status: data?.status || data?.current_status || "Unknown",
    Origin: data?.origin || "",
    Destination: data?.destination || "",
    Weight: data?.weight || "",
    Pieces: data?.pieces || data?.no_of_pieces || "",
    BookingDate: data?.booking_date || data?.created_at || "",
    ExpectedDelivery: data?.expected_delivery || data?.edd || "",
  }]

  return {
    success: true,
    softwareType: "skart",
    tracking: normalizedTracking,
    events,
    rawResponse: data,
  }
}

async function fetchShreeMarutiTracking(awbNumber, credentials = {}) {
  const baseUrl = credentials.trackingApiUrl || SHREE_MARUTI_DEFAULT_TRACKING_URL
  const url = joinUrl(baseUrl, encodeURIComponent(awbNumber))

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Shree Maruti tracking API error: ${response.status}`)
  }

  const order = data?.orderInformation || {}
  const statuses = Array.isArray(data?.statuses) ? data.statuses : []

  if (!order.trackingId && statuses.length === 0) {
    throw new Error("No Shree Maruti tracking data found")
  }

  const latestStatus = statuses[0] || {}
  const events = statuses.map((status) => {
    const timestamp = Number(status.statusTimestamp) || Date.parse(status.createdAt || status.updatedAt || "")
    const date = timestamp ? new Date(timestamp) : null
    const location = sanitizeShreeMarutiLocation(status.location || "")

    return {
      timestamp: timestamp || "",
      EventDate1: date ? formatDate(date.toISOString()) : "",
      EventTime1: date ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "",
      Location: location,
      Status: status.subcategory || status.category || status.status || "Update",
      Remark: status.event || status.status || "",
      Category: status.category || "",
      RawStatus: status.status || "",
    }
  })

  return {
    success: true,
    softwareType: "shree-maruti",
    tracking: [{
      AWBNo: order.trackingId || awbNumber,
      Status: latestStatus.subcategory || latestStatus.category || order.currentShipmentPhase || "Unknown",
      Origin: order.sourceLocation?.city || "",
      Destination: order.destinationLocation?.city || "",
      BookingDate: order.createdAt || "",
      ExpectedDelivery: "",
      Consignee: order.receiverDetails?.receiver_name || "",
      ShipperName: order.senderDetails?.sender_name || "",
      CurrentShipmentPhase: order.currentShipmentPhase || "",
      CurrentShipmentPhaseUpdatedAt: order.currentShipmentPhaseUpdatedAt || "",
      PODLinks: order.pod_links || [],
    }],
    events,
    rawResponse: data,
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
    const parsedDate = new Date(timeStr)
    if (!isNaN(parsedDate.getTime()) && /[T\s]\d{1,2}:\d{2}/.test(String(timeStr))) {
      return parsedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    }

    // Splits "19:21:45" -> hours=19, minutes=21
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
    let shouldUseShreeMarutiFallback = isShreeMarutiVendorName(vendorName)
    let shouldUseSkynetFallback = isSkynetVendorName(vendorName) || forceSoftwareType === "skynet"
    const supportedForcedSoftwareTypes = [
      "xpression",
      "itd",
      "dhl",
      "tech440",
      "skynet",
      "skart",
      "shree-maruti",
    ]

    if (vendorId) {
      vendor = await VendorIntegration.findById(vendorId)
    } else if (vendorName) {
      vendor = await VendorIntegration.findOne({
        vendorName: { $regex: new RegExp(escapeRegExp(vendorName), "i") },
        isActive: true
      })
      // A name match against the wrong softwareType (e.g. a vendor named
      // "SkyNet" that was mistakenly saved as "itd") is worse than no match —
      // it would silently route to the wrong fetcher. Discard it so the
      // forceSoftwareType-based lookups below get a chance to run instead.
      if (vendor && forceSoftwareType && vendor.softwareType !== forceSoftwareType) {
        vendor = null
      }
      if (!vendor && isShreeMarutiVendorName(vendorName)) {
        vendor = await VendorIntegration.findOne({ softwareType: "shree-maruti", isActive: true })
      }
    } else if (supportedForcedSoftwareTypes.includes(forceSoftwareType)) {
      vendor = await VendorIntegration.findOne({ softwareType: forceSoftwareType, isActive: true })
    }

    if (
      !vendor &&
      supportedForcedSoftwareTypes.includes(forceSoftwareType) &&
      forceSoftwareType !== "shree-maruti"
    ) {
      vendor = await VendorIntegration.findOne({ softwareType: forceSoftwareType, isActive: true })
    }

    // If no vendor found, try to find by AWB's integrated vendor
    if (!vendor && !vendorId && !vendorName) {
      const awb = await Awb.findOne({ cNoteNumber: awbNumber })
      if (awb?.integratedVendorId) {
        vendor = await VendorIntegration.findById(awb.integratedVendorId)
      } else if (awb?.cNoteVendorName) {
        shouldUseShreeMarutiFallback = shouldUseShreeMarutiFallback || isShreeMarutiVendorName(awb.cNoteVendorName)
        shouldUseSkynetFallback = shouldUseSkynetFallback || isSkynetVendorName(awb.cNoteVendorName)
        vendor = await VendorIntegration.findOne({
          vendorName: { $regex: new RegExp(escapeRegExp(awb.cNoteVendorName), "i") },
          isActive: true
        })
        if (!vendor && isShreeMarutiVendorName(awb.cNoteVendorName)) {
          vendor = await VendorIntegration.findOne({ softwareType: "shree-maruti", isActive: true })
        }
      }
    }

    if (!vendor) {
      if (shouldUseShreeMarutiFallback) {
        const result = await fetchShreeMarutiTracking(awbNumber)
        return new Response(
          JSON.stringify({
            success: true,
            vendorName: "SHREE MARUTI",
            vendorCode: "SHREE_MARUTI",
            softwareType: "shree-maruti",
            ...result,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      }

      if (shouldUseSkynetFallback) {
        const result = await fetchSkyNetTracking(awbNumber)
        return new Response(
          JSON.stringify({
            success: true,
            vendorName: "SKYNET",
            vendorCode: "SKYNET",
            softwareType: "skynet",
            ...result,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      }

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
    } else if (vendor.softwareType === "skynet") {
      result = await fetchSkyNetTracking(awbNumber)
    } else if (vendor.softwareType === "skart") {
      result = await fetchSKartTracking(awbNumber, vendor.skartCredentials)
    } else if (vendor.softwareType === "shree-maruti") {
      result = await fetchShreeMarutiTracking(awbNumber, vendor.shreeMarutiCredentials)
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
    const forceSoftwareType = searchParams.get("forceSoftwareType")

    // Reuse POST logic
    const fakeRequest = {
      json: async () => ({ awbNumber, vendorId, vendorName, forceSoftwareType })
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
