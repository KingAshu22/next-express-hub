// lib/tracking-timeline.js
// Builds a shipment's tracking timeline ON THE SERVER: our own status updates
// merged with the live vendor / partner scans. The browser only receives the
// finished timeline - never the C-Note number or vendor name used to fetch it.
import { getEventDescription } from "@/lib/m5-event-codes"
import { getVendorTracking, buildVendorTrackingRequest } from "@/lib/vendor-tracking"

// ==================== DATE HELPERS ====================
// Vendor scans come as "naive" local times (no timezone). They are Indian
// times, so read them as IST no matter which timezone the server runs in.
const IST_OFFSET_MS = 330 * 60 * 1000
const naiveToTs = (y, mo, d, h = 0, mi = 0, s = 0) => Date.UTC(y, mo, d, h, mi, s) - IST_OFFSET_MS
const localAsIst = (date) =>
  naiveToTs(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
const hasExplicitZone = (s) => /([zZ]|[+-]\d{2}:?\d{2})$/.test(String(s).trim())

const parseTime12Hour = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 }
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!match) return { hours: 0, minutes: 0 }
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3]?.toUpperCase()
  if (period === "PM" && hours !== 12) hours += 12
  else if (period === "AM" && hours === 12) hours = 0
  return { hours, minutes }
}

const parseOrdinalDate = (dateStr) => {
  if (!dateStr) return null
  const cleanedDate = String(dateStr).replace(/(\d+)(st|nd|rd|th)/i, "$1")
  const parsed = new Date(cleanedDate)
  return isNaN(parsed.getTime()) ? null : parsed
}

const parseInternalDate = (dateInput) => {
  if (!dateInput) return 0
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? 0 : dateInput.getTime()
  if (typeof dateInput === "number") return dateInput
  const directDate = new Date(dateInput)
  if (!isNaN(directDate.getTime())) {
    return hasExplicitZone(dateInput) ? directDate.getTime() : localAsIst(directDate)
  }

  const parts = String(dateInput).match(
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  )
  if (parts) {
    const [, d, m, y, h = 0, min = 0, s = 0] = parts
    return naiveToTs(+y, +m - 1, +d, +h, +min, +s)
  }
  return 0
}

const parseCJEventTimestamp = (event) => {
  const dateStr = event.EventDate1 || event.EventDate
  const timeStr = event.EventTime1 || event.EventTime || "12:00 AM"
  const parsedDate = parseOrdinalDate(dateStr) || new Date(dateStr)
  if (isNaN(parsedDate.getTime())) return 0
  const { hours, minutes } = parseTime12Hour(timeStr)
  parsedDate.setHours(hours, minutes, 0, 0)
  return localAsIst(parsedDate)
}

const parseM5EventTimestamp = (event) => {
  const dateStr = String(event.EventDate || "").split("T")[0]
  const timeStr = event.EventTime || "00:00:00"
  const d = new Date(`${dateStr}T${timeStr}`)
  return isNaN(d.getTime()) ? 0 : localAsIst(d)
}

// SkyNet gives EventDate="25-Feb-2026" and EventTime="19:21:45"
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
const parseSkyNetDate = (dateStr, timeStr) => {
  const parts = String(dateStr || "").split("-")
  if (parts.length !== 3) return 0
  const day = parseInt(parts[0], 10)
  const month = MONTHS[parts[1].toLowerCase()]
  const year = parseInt(parts[2], 10)
  if (isNaN(day) || isNaN(year) || month === undefined) return 0
  const [h = 0, m = 0, sec = 0] = String(timeStr || "").split(":").map((v) => parseInt(v, 10) || 0)
  return naiveToTs(year, month, day, h, m, sec)
}

const parseVendorEventTimestamp = (evt, softwareType) => {
  try {
    if (softwareType === "skynet" || (evt.EventDate && String(evt.EventDate).includes("-") && /[A-Za-z]/.test(evt.EventDate))) {
      const ts = parseSkyNetDate(evt.EventDate, evt.EventTime)
      if (ts > 0) return ts
    }
    if (softwareType === "xpression" || softwareType === "itd") {
      const ds = evt.EventDate1 || evt.EventDate
      const ts = evt.EventTime1 || evt.EventTime || "12:00 AM"
      const d = parseOrdinalDate(ds) || new Date(parseInternalDate(ds))
      if (!isNaN(d.getTime())) {
        const { hours, minutes } = parseTime12Hour(ts)
        d.setHours(hours, minutes, 0, 0)
        return localAsIst(d)
      }
      return 0
    }
    return parseInternalDate(evt.timestamp || evt.EventDate)
  } catch {
    return 0
  }
}

// Hide internal-only notes (e.g. clone provenance) from customers
const sanitizeComment = (comment) => {
  const c = String(comment || "").trim()
  if (!c || /^cloned from awb/i.test(c)) return null
  return c
}

export const formatDisplayTime = (timestamp) => {
  if (!timestamp) return "N/A"
  return new Date(timestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  })
}

// ==================== LEGACY VENDORS ====================
// Bookings saved with these vendor names before vendor integrations existed.

async function fetchM5TrackingData(cNoteNumber) {
  const response = await fetch("http://apiv2.m5clogs.com/api/Track/GetTrackings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ValidateAccount: [
        {
          AccountCode: process.env.M5_ACCOUNT_CODE || process.env.NEXT_PUBLIC_ACCOUNT_CODE,
          Username: process.env.M5_USERNAME || process.env.NEXT_PUBLIC_USERNAME,
          Password: process.env.M5_PASSWORD || process.env.NEXT_PUBLIC_PASSWORD,
          AccessKey: process.env.M5_ACCESS_KEY || process.env.NEXT_PUBLIC_ACCESS_KEY,
        },
      ],
      Awbno: cNoteNumber,
    }),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`M5 API request failed with status ${response.status}`)
  const data = await response.json()
  if (data[0]?.messages?.[0]?.Response !== "1") {
    throw new Error(data[0]?.messages?.[0]?.ErrorDescription || "Failed to fetch M5 tracking details")
  }
  return data[0]
}

async function fetchCourierJourneyData(cNoteNumber) {
  const userId = process.env.COURIER_JOURNEY_USER_ID
  const password = process.env.COURIER_JOURNEY_PASSWORD
  if (!userId || !password) throw new Error("Courier Journey credentials are not configured")

  const response = await fetch("http://courierjourney.xpresion.in/api/v1/Tracking/Tracking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ UserID: userId, Password: password, AWBNo: cNoteNumber, Type: "A" }),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`CJ API request failed with status ${response.status}`)
  const data = await response.json()
  if (!data?.Response || data.Response?.ErrorCode !== "0") {
    throw new Error(data?.Response?.ErrorDisc || "Failed to fetch Courier Journey tracking details")
  }
  return data.Response
}

// ==================== MERGE ====================

const toEvent = (timestamp, status, location, comment) => ({
  timestamp,
  status: String(status ?? "").trim() || "Update",
  location: String(location ?? "").trim() || null,
  comment: comment || null,
  formattedTime: formatDisplayTime(timestamp),
})

function mergeTimeline(awb, { vendorData, m5Data, cjData }) {
  const all = []

  vendorData?.events?.forEach((e) =>
    all.push(
      toEvent(
        parseVendorEventTimestamp(e, vendorData.softwareType),
        e.Status ?? e.status,
        e.Location ?? e.location,
        sanitizeComment(e.Remark ?? e.comment)
      )
    )
  )
  m5Data?.Event?.forEach((e) =>
    all.push(toEvent(parseM5EventTimestamp(e), getEventDescription(e.EventCode, e.EventDescription), e.Location, null))
  )
  cjData?.Events?.forEach((e) => all.push(toEvent(parseCJEventTimestamp(e), e.Status, e.Location, null)))
  awb?.parcelStatus?.forEach((e) =>
    all.push(toEvent(parseInternalDate(e.timestamp), e.status, e.location, sanitizeComment(e.comment)))
  )

  all.sort((a, b) => b.timestamp - a.timestamp)

  return all.filter((event, index, arr) => {
    if (index === 0) return true
    const prev = arr[index - 1]
    return !(
      event.status.toLowerCase() === prev.status.toLowerCase() &&
      String(event.location || "").toLowerCase() === String(prev.location || "").toLowerCase() &&
      Math.abs(event.timestamp - prev.timestamp) < 60000
    )
  })
}

/**
 * @param awb full Awb document (server side only)
 * @returns {Promise<{ timeline: Array, carrierInfo: object|null, vendorError: string|null }>}
 *   timeline events: { timestamp (ms), formattedTime, status, location, comment }
 */
export async function buildShipmentTimeline(awb) {
  let vendorData = null
  let m5Data = null
  let cjData = null
  let vendorError = null

  const vendorRequest = buildVendorTrackingRequest(awb)
  if (vendorRequest) {
    try {
      vendorData = await getVendorTracking(vendorRequest)
    } catch (error) {
      vendorError = error.message || "Vendor tracking failed"
    }
  }

  if (!vendorData && awb.cNoteNumber) {
    try {
      if (awb.cNoteVendorName === "M5") {
        m5Data = await fetchM5TrackingData(awb.cNoteNumber)
        vendorError = null
      } else if (awb.cNoteVendorName === "Courier Journey") {
        cjData = await fetchCourierJourneyData(awb.cNoteNumber)
        vendorError = null
      }
    } catch (error) {
      vendorError = vendorError || error.message
    }
  }

  const row = vendorData?.tracking?.[0] || m5Data?.trackDetails?.[0] || cjData?.Tracking?.[0] || null
  // Only carrier fields that are safe to show to customers
  const carrierInfo = row
    ? {
        origin: row.Origin || null,
        destination: row.Destination || null,
        forwardingNumber: row.ForwardingNo || null,
        forwardingLink: row.ForwardingURL || null,
      }
    : null

  return { timeline: mergeTimeline(awb, { vendorData, m5Data, cjData }), carrierInfo, vendorError }
}
