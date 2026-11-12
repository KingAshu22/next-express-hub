import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import Customer from "@/models/Customer"
import { NextResponse } from "next/server"
import { withAuth, forbidden, isExternal } from "@/lib/auth/server"
import { ROLES } from "@/lib/auth/config"
import { getAllowedRefCodes, ownerIdFor } from "@/lib/security/scope"
import { stripBlockedAwbFields, sanitizeAwb } from "@/lib/security/sanitize"

import { escapeRegex } from "@/lib/security/regex"

export const GET = withAuth(async (req, ctx, session) => {
  await connectToDB()

  try {
    const external = isExternal(session)
    // null = may see every booking; otherwise the refCodes this user owns
    const allowedRefCodes = await getAllowedRefCodes(session)

    const { searchParams } = new URL(req.url)
    const page = searchParams.has("page") ? Math.max(1, Number.parseInt(searchParams.get("page")) || 1) : null
    // Cap page size so nobody can dump the whole table in one call
    const pageSize = searchParams.has("pageSize")
      ? Math.min(500, Math.max(1, Number.parseInt(searchParams.get("pageSize")) || 20))
      : null
    const search = searchParams.get("search") || ""
    const country = searchParams.get("country") || ""
    const clientCode = searchParams.get("clientCode") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""
    
    // New parameter to fetch all fields (for billing page)
    const fetchAll = searchParams.get("fetchAll") === "true"
    
    // New parameter to filter by billed status
    const billedStatus = searchParams.get("billedStatus") || "" // "billed", "unbilled", or "" for all

    const query = {}

    if (allowedRefCodes !== null) {
      query.refCode = { $in: allowedRefCodes }
    }

    const trackingNumbersParam = searchParams.get("trackingNumbers") || ""
    const trackingNumbers = trackingNumbersParam
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 500)

    if (trackingNumbers.length > 0) {
      query.trackingNumber = { $in: trackingNumbers }
    }

    if (search.trim()) {
      const searchRegex = { $regex: escapeRegex(search.trim().slice(0, 100)), $options: "i" }
      query.$or = [
        { trackingNumber: searchRegex },
        { "sender.name": searchRegex },
        { "receiver.name": searchRegex },
        { invoiceNumber: searchRegex },
        // Vendor numbers are only searchable by staff
        ...(external ? [] : [{ cNoteNumber: searchRegex }, { awbNumber: searchRegex }]),
      ]
    }

    if (country.trim()) {
      query["receiver.country"] = { $regex: escapeRegex(country.trim()), $options: "i" }
    }

    if (clientCode.trim()) {
      const wanted = clientCode.trim()
      if (allowedRefCodes !== null && !allowedRefCodes.includes(wanted)) {
        return forbidden("You can only view your own shipments")
      }
      query.refCode = wanted
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        query.date.$gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.date.$lte = end
      }
    }

    // Filter by billed status
    if (billedStatus === "billed") {
      query.isBilled = true
    } else if (billedStatus === "unbilled") {
      query.$or = query.$or || []
      // Handle case where isBilled doesn't exist or is false
      query.isBilled = { $ne: true }
    }

    const isPaginated = page !== null && pageSize !== null

    let baseQuery = Awb.find(query).sort({ date: -1 })

    // Select fields based on fetchAll parameter
    if (fetchAll && !external) {
      // Return all fields needed for billing / MIS (staff only)
      baseQuery = baseQuery.select(
        "date invoiceNumber trackingNumber refCode receiver sender boxes rateInfo parcelStatus cNoteNumber cNoteVendorName awbNumber forwardingNumber forwardingLink isBilled parcelType via shippingCurrency financials notes payments"
      )
    } else if (fetchAll) {
      // Partners: their own shipment details, never vendor / purchase data
      baseQuery = baseQuery.select(
        "date invoiceNumber trackingNumber refCode receiver sender boxes parcelStatus forwardingNumber forwardingLink isBilled parcelType via shippingCurrency financials.sales"
      )
    } else {
      // Return limited fields for listing pages
      baseQuery = baseQuery.select(
        external
          ? "date invoiceNumber trackingNumber refCode receiver.country receiver.name sender.name forwardingNumber forwardingLink parcelStatus isBilled boxes.chargeableWeight financials.sales.grandTotal"
          : "date invoiceNumber trackingNumber refCode receiver.country receiver.name sender.name forwardingNumber forwardingLink parcelStatus cNoteNumber isBilled boxes.chargeableWeight financials.sales.grandTotal"
      )
    }

    if (isPaginated) {
      const skip = (page - 1) * pageSize
      baseQuery = baseQuery.skip(skip).limit(pageSize)
    }

    const [rawAwbs, totalCount] = await Promise.all([baseQuery.lean(), Awb.countDocuments(query)])
    const awbs = rawAwbs.map((a) => sanitizeAwb(a, session))

    if (isPaginated) {
      const totalPages = Math.ceil(totalCount / pageSize)
      return NextResponse.json({
        data: awbs,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      })
    } else {
      return NextResponse.json({
        data: awbs,
        totalCount,
      })
    }
  } catch (error) {
    console.error("Error fetching Awb:", error.message)
    return NextResponse.json({ error: "Failed to fetch Awb" }, { status: 500 })
  }
})

// Who may create bookings
const BOOKING_ROLES = [ROLES.ADMIN, ROLES.BRANCH, ROLES.FRANCHISE, ROLES.CLIENT]

export const POST = withAuth(async (req, ctx, session) => {
  try {
    await connectToDB()
    let data = await req.json()

    if (isExternal(session)) {
      // Partners cannot set vendor / billing / ownership fields themselves
      const { refCode: requestedRefCode, trackingNumber, invoiceNumber, boxes } = data || {}
      data = stripBlockedAwbFields(data)
      const allowed = await getAllowedRefCodes(session)
      // A franchise may book for one of its own clients; otherwise it is booked under the user's own code
      data.refCode = requestedRefCode && allowed.includes(requestedRefCode) ? requestedRefCode : session.code
      data.trackingNumber = trackingNumber
      data.invoiceNumber = invoiceNumber
      data.vendorBoxes = boxes
      data.parcelStatus = [{ status: "Shipment AWB Prepared", timestamp: new Date(), comment: "" }]
    }

    // staffId always comes from the session, never from the request body
    data.staffId = ownerIdFor(session)
    if (data.sender) data.sender.owner = data.staffId
    if (data.receiver) data.receiver.owner = data.staffId

    // Tracking numbers must be unique, otherwise one booking could "take over"
    // another shipment's public tracking page.
    if (!/^\d{6,20}$/.test(String(data.trackingNumber || ""))) {
      return NextResponse.json({ error: "Invalid tracking number" }, { status: 400 })
    }
    if (await Awb.exists({ trackingNumber: String(data.trackingNumber) })) {
      return NextResponse.json({ error: "This tracking number already exists. Please reload and try again." }, { status: 409 })
    }

    const awb = new Awb(data)
    await awb.save()

    // Update or create customer1 (sender)
    await Customer.findOneAndUpdate(
      {
        name: data.sender.name,
        owner: data.staffId,
      },
      {
        $set: {
          companyName: data.sender.companyName,
          email: data.sender.email,
          address: data.sender.address,
          address2: data.sender.address2,
          city: data.sender.city,
          state: data.sender.state,
          country: data.sender.country,
          zip: data.sender.zip,
          contact: data.sender.contact,
          whatsappContact: data.sender.whatsappContact,
          kyc: data.sender.kyc,
          gst: data.sender.gst,
          role: "customer",
          owner: data.staffId,
        },
      },
      { upsert: true, new: true }
    )

    // Update or create customer2 (receiver)
    await Customer.findOneAndUpdate(
      {
        name: data.receiver.name,
        owner: data.staffId,
      },
      {
        $set: {
          companyName: data.receiver.companyName,
          email: data.receiver.email,
          address: data.receiver.address,
          address2: data.receiver.address2,
          city: data.receiver.city,
          state: data.receiver.state,
          country: data.receiver.country,
          zip: data.receiver.zip,
          contact: data.receiver.contact,
          kyc: data.receiver.kyc,
          gst: data.receiver.gst,
          role: "customer",
          owner: data.staffId,
        },
      },
      { upsert: true, new: true }
    )
    return NextResponse.json({ message: "Parcel added successfully!", awb: sanitizeAwb(awb, session) }, { status: 200 })
  } catch (error) {
    console.error("Error in POST /api/awb:", error.message)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}, { roles: BOOKING_ROLES })
