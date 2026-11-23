// lib/vendor-tracking.js
// Shared vendor tracking lookups, used by the website track page
// (/api/vendor-integrations/tracking) and the public /api/tracking API.
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"
import Awb from "@/models/Awb"
import { getEventDescription } from "@/lib/m5-event-codes"

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
const KARGO_ONE_ANDHERI_HUB = "Kargo One - Andheri HUB"
const SHREE_MARUTI_PICKUP_LOCATION =
  "SHOP 34, KENORITA GARMENT HUB, CAVES ROAD, WES.EX. HIGHWAY JOGESHWARI. EAST MUMBAI - 400060, , 400060, JOGESHWARI, MAHARASHTRA, India"

const isShreeMarutiVendorName = (vendorName = "") =>
  SHREE_MARUTI_VENDOR_PATTERN.test(String(vendorName))

const SKYNET_TRACKING_URL = "https://www.skynetww.com/api/tracking"
const SKYNET_VENDOR_PATTERN = /sky\s*net/i

const isSkynetVendorName = (vendorName = "") =>
  SKYNET_VENDOR_PATTERN.test(String(vendorName))

const sanitizeShreeMarutiLocation = (location = "") => {
  const normalized = String(location || "").replace(/\s+/g, " ").trim()
  const pickupLocation = SHREE_MARUTI_PICKUP_LOCATION.replace(/\s+/g, " ").trim()
  return normalized === pickupLocation ? KARGO_ONE_ANDHERI_HUB : location
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

// SkyNet's new API gives dates like "November 23, 2026"; the timeline parsers
// expect "23-Nov-2026", so convert here. Unknown formats pass through unchanged.
const SKYNET_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
function toSkyNetShortDate(dateStr) {
  const m = String(dateStr || "").trim().match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/)
  if (!m) return dateStr || ""
  const idx = SKYNET_MONTHS.findIndex((mon) => m[1].toLowerCase().startsWith(mon.toLowerCase()))
  if (idx === -1) return dateStr
  return `${m[2].padStart(2, "0")}-${SKYNET_MONTHS[idx]}-${m[3]}`
}

// Fetch tracking from SkyNet's public tracking API (no credentials required)
async function fetchSkyNetTracking(awbNumber) {
  const response = await fetch(SKYNET_TRACKING_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ awbs: [String(awbNumber).trim()] }),
    cache: "no-store",
  })

  const result = await response.json().catch(() => ({}))
  const data = Array.isArray(result?.results) ? result.results[0] : null

  if (!response.ok || !data || data.found === false) {
    throw new Error(result?.message || data?.message || "SkyNet tracking data not found")
  }

  const detail = (label) =>
    (data.detailRows || []).find((row) => row?.label === label)?.value || ""

  // Events come as dateLabel: "November 23, 2026", time: "12:16:00"
  const events = (data.events || []).map((evt) => {
    const eventDate = toSkyNetShortDate(evt.dateLabel)
    return {
      EventDate: eventDate,
      EventTime: evt.time,
      EventDate1: formatDate(evt.dateLabel),
      EventTime1: formatTime(evt.time),
      Location: evt.location,
      Status: evt.status, // e.g. "In transit"
      Remark: evt.details, // e.g. "SHIPMENT ARRIVED AT ORIGIN"
    }
  })

  const normalizedTracking = [{
    AWBNo: data.airwayBillNo || data.awb || awbNumber,
    Status: events[0]?.Status || data.status || "Unknown",
    Origin: detail("originHub") || data.route?.from || "",
    Destination: data.route?.to || detail("destination") || "",
    Weight: detail("weight") || data.weight || "",
    Pieces: data.pieces || detail("pieces") || "",
    BookingDate: toSkyNetShortDate(data.bookedOn) || "",
    DeliveryDate: toSkyNetShortDate(data.deliveredOn || data.deliveryDate) || "",
    Consignee: detail("consigneeName") || "",
    ConsigneeCity: detail("consigneeLocation") || "",
    ShipperName: detail("shipperName") || "",
    ShipperCity: detail("shipperLocation") || "",
    ServiceName: data.route?.service || detail("service") || "",
    Forwarder: detail("forwarder") || "",
    ForwarderNo: data.forwarderNo || "",
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

const M5C_DEFAULT_TRACKING_API_URL = "http://apiv2.m5clogs.com"

const normalizeM5CTrackingRow = (row = {}, awbNumber = "") => ({
  AWBNo: pickFirst(row, ["AWBNo", "AwbNo", "AWBNumber", "Awbno", "TrackingNo"]) || awbNumber,
  Status: pickFirst(row, ["Status", "CurrentStatus", "ShipmentStatus"]) || "Unknown",
  Origin: pickFirst(row, ["Origin", "OriginCity", "OriginName", "ConsignorCity"]),
  Destination: pickFirst(row, ["Destination", "DestinationCity", "DestinationName", "ConsigneeCity"]),
  BookingDate: pickFirst(row, ["BookingDate", "BookDate", "PickupDate", "ShipmentDate"]),
  DeliveryDate: pickFirst(row, ["DeliveryDate", "DeliveredDate", "PODDate"]),
  Consignee: pickFirst(row, ["Consignee", "ConsigneeName", "ReceiverName"]),
  ConsigneeCity: pickFirst(row, ["ConsigneeCity", "ReceiverCity"]),
  ShipperName: pickFirst(row, ["ShipperName", "SenderName", "ConsignorName"]),
  ShipperCity: pickFirst(row, ["ShipperCity", "SenderCity", "ConsignorCity"]),
  Weight: pickFirst(row, ["Weight", "ActWeight", "ActualWeight", "ChargeableWeight"]),
  Pieces: pickFirst(row, ["Pieces", "NumofItems", "Pcs", "NoOfPieces"]),
  ExpectedDelivery: pickFirst(row, ["ExpectedDelivery", "EDD", "ExpectedDeliveryDate"]),
  ...row,
})

// M5C gives EventDate like "2026-07-20T00:00:00" and a separate time-only EventTime
const normalizeM5CEvent = (event = {}) => {
  const dateOnly = String(event.EventDate || "").split("T")[0]
  const timeOnly = event.EventTime || "00:00:00"
  const timestamp = dateOnly ? new Date(`${dateOnly}T${timeOnly}`).getTime() : 0

  return {
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    EventDate1: formatDate(dateOnly),
    EventTime1: formatTime(timeOnly),
    Location: event.Location || "",
    Status: getEventDescription(event.EventCode, event.EventDescription),
    Remark: event.EventDescription || "",
    ...event,
  }
}

// Fetch tracking from M5C (uses the same ValidateAccount auth as AWB booking —
// no separate OAuth token needed for the GetTrackings endpoint)
async function fetchM5CTracking(awbNumber, credentials) {
  if (!credentials?.username || !credentials?.password || !credentials?.accountCode) {
    throw new Error("M5C tracking credentials are not configured")
  }

  const trackingUrl = joinUrl(
    credentials.apiUrl || M5C_DEFAULT_TRACKING_API_URL,
    "/api/Track/GetTrackings"
  )

  const response = await fetch(trackingUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ValidateAccount: [
        {
          AccountCode: credentials.accountCode,
          Username: credentials.username,
          Password: credentials.password,
          AccessKey: credentials.accessKey || "",
        },
      ],
      Awbno: awbNumber,
    }),
  })

  if (!response.ok) {
    throw new Error(`M5C tracking API error: ${response.statusText}`)
  }

  const data = await response.json()
  const record = (Array.isArray(data) ? data[0] : data) || {}

  if (record.messages?.[0]?.Response !== "1") {
    throw new Error(record.messages?.[0]?.ErrorDescription || "Failed to fetch M5C tracking details")
  }

  const trackingRows = normalizeXpressionArray(record.trackDetails).map((row) =>
    normalizeM5CTrackingRow(row, awbNumber)
  )
  const eventRows = normalizeXpressionArray(record.Event).map(normalizeM5CEvent)

  if (trackingRows.length === 0 && eventRows.length === 0) {
    throw new Error("No M5C tracking data found")
  }

  return {
    success: true,
    softwareType: "m5c",
    tracking: trackingRows,
    events: eventRows,
    rawResponse: record,
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

const SUPPORTED_SOFTWARE_TYPES = [
  "xpression",
  "itd",
  "dhl",
  "tech440",
  "skynet",
  "skart",
  "shree-maruti",
  "m5c",
]

export class VendorTrackingError extends Error {
  constructor(message, status = 500) {
    super(message)
    this.status = status
  }
}

// Fetch tracking for a vendor AWB (C Note number). Returns
// { success, vendorName, vendorCode, softwareType, tracking, events, ... }
// and throws VendorTrackingError when the vendor can't be resolved or fails.
export async function getVendorTracking({ awbNumber, vendorId, vendorName, forceSoftwareType } = {}) {
  if (!awbNumber) throw new VendorTrackingError("AWB number is required", 400)

  await connectToDB()

  let vendor = null
  let shouldUseShreeMarutiFallback = isShreeMarutiVendorName(vendorName)
  let shouldUseSkynetFallback = isSkynetVendorName(vendorName) || forceSoftwareType === "skynet"

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
  } else if (SUPPORTED_SOFTWARE_TYPES.includes(forceSoftwareType)) {
    vendor = await VendorIntegration.findOne({ softwareType: forceSoftwareType, isActive: true })
  }

  if (
    !vendor &&
    SUPPORTED_SOFTWARE_TYPES.includes(forceSoftwareType) &&
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
      return { success: true, vendorName: "SHREE MARUTI", vendorCode: "SHREE_MARUTI", softwareType: "shree-maruti", ...result }
    }
    if (shouldUseSkynetFallback) {
      const result = await fetchSkyNetTracking(awbNumber)
      return { success: true, vendorName: "SKYNET", vendorCode: "SKYNET", softwareType: "skynet", ...result }
    }
    throw new VendorTrackingError("Vendor not found", 404)
  }

  if (!vendor.isActive) throw new VendorTrackingError("Vendor is not active", 400)

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
  } else if (vendor.softwareType === "m5c") {
    result = await fetchM5CTracking(awbNumber, vendor.m5cCredentials)
  } else {
    throw new VendorTrackingError(`Unknown software type: ${vendor.softwareType}`, 400)
  }

  return {
    success: true,
    vendorName: vendor.vendorName,
    vendorCode: vendor.vendorCode,
    softwareType: vendor.softwareType,
    ...result,
  }
}

// Same vendor selection the website track page uses (TrackingDetails.jsx):
// DHL forwarding numbers go to DHL, "SkyNet" C Notes always go to SkyNet's
// public API, everything else resolves via integratedVendorId / vendor name.
export function buildVendorTrackingRequest(awb) {
  const fwdNumber = awb?.forwardingNumber
  const fwdLink = String(awb?.forwardingLink || "").toLowerCase()
  const hasVendor = awb?.cNoteNumber && awb?.cNoteVendorName

  if (fwdNumber && fwdLink.includes("dhl.com")) {
    return { awbNumber: String(fwdNumber), forceSoftwareType: "dhl" }
  }
  if (!hasVendor) return null

  const isSkynet = /skynet/i.test(String(awb.cNoteVendorName))
  return {
    awbNumber: String(awb.cNoteNumber),
    vendorId: isSkynet ? undefined : awb.integratedVendorId || undefined,
    vendorName: awb.cNoteVendorName,
    forceSoftwareType: isSkynet ? "skynet" : undefined,
  }
}
