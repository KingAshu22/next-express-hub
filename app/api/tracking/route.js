// app/api/tracking/route.js
// Partner Tracking API (called from partners' own websites/servers).
//   POST { email, password, trackingNumber, userType: "client" | "franchise" }
// Security:
//   - credentials checked with bcrypt, brute-force rate limited
//   - a partner can ONLY track shipments booked under its own code
//     (a franchise also those of its own clients)
//   - no C-Note number / vendor name / money in the response
import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import { authenticate } from "@/lib/auth/accounts"
import { canAccessRefCode } from "@/lib/security/scope"
import { publicRateLimit } from "@/lib/auth/server"
import { rateLimit, isRateLimited } from "@/lib/auth/rate-limit"
import { buildShipmentTimeline } from "@/lib/tracking-timeline"

// Credentials travel in the body (no cookies), so any origin may call it.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
}

const respond = (data, status = 200, extraHeaders = {}) =>
  NextResponse.json(data, { status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store", ...extraHeaders } })

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request) {
  try {
    const ipLimit = publicRateLimit(request, "tracking-api", { limit: 60, windowMs: 60_000 })
    if (!ipLimit.ok) {
      return respond({ success: false, error: "Too many requests" }, 429, { "Retry-After": String(ipLimit.retryAfter) })
    }

    const body = await request.json().catch(() => ({}))
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")
    const trackingNumber = String(body?.trackingNumber || "").trim()
    const type = body?.userType || "client"

    if (!email || !password || !trackingNumber) {
      return respond({ success: false, error: "Missing required fields: email, password, trackingNumber" }, 400)
    }
    if (type !== "client" && type !== "franchise") {
      return respond({ success: false, error: "Invalid userType. Must be 'client' or 'franchise'" }, 400)
    }

    // Password guessing protection: 10 failed logins per account per 15 minutes
    const failKey = `tracking-api-fail:${type}:${email}`
    if (isRateLimited(failKey, 10)) {
      return respond({ success: false, error: "Too many failed attempts. Try again later." }, 429)
    }
    const user = await authenticate(type, email, password)
    if (!user) {
      rateLimit(failKey, { limit: 10, windowMs: 15 * 60_000 })
      return respond({ success: false, error: "Invalid credentials" }, 401)
    }
    // Only partner accounts (not branch / staff logins) can use this API
    if (user.role !== "client" && user.role !== "franchise") {
      return respond({ success: false, error: "This account cannot use the tracking API" }, 403)
    }

    await connectToDB()
    const parcelDetails = await Awb.findOne({ trackingNumber }).lean()

    // Shipments of other partners look exactly like unknown numbers
    if (!parcelDetails || !(await canAccessRefCode(user, parcelDetails.refCode))) {
      return respond({ success: false, error: "Tracking number not found" }, 404)
    }

    const { timeline, carrierInfo, vendorError } = await buildShipmentTimeline(parcelDetails)

    const response = {
      success: true,
      data: {
        trackingNumber: parcelDetails.trackingNumber,
        currentStatus: timeline[0]?.status || "Unknown",
        lastUpdate: timeline[0]?.formattedTime || "N/A",
        origin: parcelDetails?.sender?.country || carrierInfo?.origin || "N/A",
        destination: parcelDetails?.receiver?.country || carrierInfo?.destination || "N/A",
        sender: {
          name: parcelDetails?.sender?.name || "N/A",
          address: parcelDetails?.sender?.address || "N/A",
          country: parcelDetails?.sender?.country || "N/A",
        },
        receiver: {
          name: parcelDetails?.receiver?.name || "N/A",
          address: parcelDetails?.receiver?.address || "N/A",
          country: parcelDetails?.receiver?.country || "N/A",
        },
        forwardingNumber: parcelDetails?.forwardingNumber || carrierInfo?.forwardingNumber || null,
        forwardingLink: parcelDetails?.forwardingLink || carrierInfo?.forwardingLink || null,
        timeline: timeline.map((event) => ({
          status: event.status,
          timestamp: event.formattedTime,
          location: event.location,
          comment: event.comment,
        })),
      },
    }

    if (vendorError) {
      console.error("Tracking API vendor fetch failed:", trackingNumber, vendorError)
      response.warning = "Live carrier updates are temporarily unavailable; showing the latest saved updates."
    }

    return respond(response)
  } catch (error) {
    console.error("Tracking API Error:", error)
    return respond({ success: false, error: "Internal server error" }, 500)
  }
}

export async function GET() {
  return respond({
    api: "Tracking API",
    version: "1.1",
    endpoints: {
      POST: {
        description: "Get tracking details for one of YOUR OWN shipments",
        authentication: "Required (email + password of your Kargo One account)",
        rateLimit: "60 requests per minute per IP",
        body: {
          email: "string (required) - Your registered email",
          password: "string (required) - Your password",
          trackingNumber: "string (required) - The tracking number to look up",
          userType: "string (optional) - 'client' or 'franchise' (default: 'client')",
        },
        response: {
          success: "boolean",
          data: {
            trackingNumber: "string",
            currentStatus: "string",
            lastUpdate: "string",
            origin: "string",
            destination: "string",
            sender: "object",
            receiver: "object",
            forwardingNumber: "string | null",
            forwardingLink: "string | null",
            timeline: "array of tracking events (newest first)",
          },
        },
      },
    },
  })
}
