// GET /api/track/:trackingNumber
// Public "Track your parcel" endpoint used by the website.
//  - Returns ONLY: route (city/country), forwarding number/link, and the status
//    timeline. No names, phones, addresses, boxes, money, C-Note or vendor.
//  - Vendor scans are fetched here on the server, so the C-Note number never
//    reaches the browser.
//  - Rate limited per IP so tracking numbers can't be bulk-scraped.
//  - A signed-in franchise / client can only track its own shipments.
import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import { getSession, publicRateLimit, tooManyRequests, notFound } from "@/lib/auth/server"
import { isExternalRole } from "@/lib/auth/config"
import { canAccessRefCode } from "@/lib/security/scope"
import { publicTrackingView } from "@/lib/security/sanitize"
import { buildShipmentTimeline } from "@/lib/tracking-timeline"

const TRACKING_FORMAT = /^[A-Za-z0-9-]{6,30}$/

export async function GET(req, { params }) {
  // 30 look-ups per minute and 300 per day per IP is plenty for real customers
  const perMinute = publicRateLimit(req, "track-min", { limit: 30, windowMs: 60_000 })
  if (!perMinute.ok) return tooManyRequests(perMinute.retryAfter)
  const perDay = publicRateLimit(req, "track-day", { limit: 300, windowMs: 24 * 60 * 60_000 })
  if (!perDay.ok) return tooManyRequests(perDay.retryAfter)

  const { trackingNumber } = await params
  if (!TRACKING_FORMAT.test(String(trackingNumber || ""))) return notFound("No shipment found")

  try {
    await connectToDB()
    const awb = await Awb.findOne({ trackingNumber: String(trackingNumber) })
      .select("trackingNumber date refCode sender.city sender.country receiver.city receiver.country forwardingNumber forwardingLink parcelStatus cNoteNumber cNoteVendorName integratedVendorId")
      .lean()
    if (!awb) return notFound("No shipment found")

    // Partners signed in to the panel can't look at other partners' shipments
    const { session } = await getSession(req)
    if (session && isExternalRole(session.role) && !(await canAccessRefCode(session, awb.refCode))) {
      return notFound("No shipment found")
    }

    const { timeline, carrierInfo, vendorError } = await buildShipmentTimeline(awb)
    if (vendorError) console.error("Public tracking vendor fetch failed:", trackingNumber, vendorError)

    const view = publicTrackingView(awb, timeline.map(({ timestamp, status, location, comment }) => ({ timestamp, status, location, comment })))
    view.forwardingNumber ||= carrierInfo?.forwardingNumber || null
    view.forwardingLink ||= carrierInfo?.forwardingLink || null

    return NextResponse.json(
      { success: true, data: view, ...(vendorError ? { warning: "Live carrier updates are temporarily unavailable." } : {}) },
      { headers: { "Cache-Control": "private, no-store" } }
    )
  } catch (error) {
    console.error("Public tracking failed:", error)
    return NextResponse.json({ success: false, error: "Tracking is temporarily unavailable" }, { status: 500 })
  }
}
