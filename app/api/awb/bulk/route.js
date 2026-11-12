import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import Customer from "@/models/Customer"
import { NextResponse } from "next/server"
import { withAuth, isExternal } from "@/lib/auth/server"
import { ROLES } from "@/lib/auth/config"
import { getAllowedRefCodes, ownerIdFor } from "@/lib/security/scope"
import { getUniqueTrackingNumber } from "@/lib/booking-numbers"
import {
  MAX_BULK_ROWS,
  buildBookingsFromRows,
  buildTemplateCsv,
  normalizeSheetRows,
  parseCsvToSheetRows,
} from "@/lib/bulk-awb"

const getStartingInvoiceNumber = async () => {
  const lastAwb = await Awb.findOne({}).sort({ _id: -1 }).select("invoiceNumber").lean()
  const lastInvoiceNumber = Number.parseInt(lastAwb?.invoiceNumber || "0", 10)
  return Number.isFinite(lastInvoiceNumber) ? lastInvoiceNumber + 1 : 1
}

const generateUniqueTrackingNumbers = async (count) => {
  const trackingNumbers = new Set()
  while (trackingNumbers.size < count) {
    trackingNumbers.add(String(await getUniqueTrackingNumber()))
  }
  return Array.from(trackingNumbers)
}

// Same customer fields the single booking API saves (no _id, so updating an
// existing customer never tries to overwrite its immutable _id)
const customerFields = (party) => ({
  companyName: party.companyName,
  email: party.email,
  address: party.address,
  address2: party.address2,
  city: party.city,
  state: party.state,
  country: party.country,
  zip: party.zip,
  contact: party.contact,
  ...(party.kyc ? { kyc: party.kyc } : {}),
  ...(party.gst ? { gst: party.gst } : {}),
})

const upsertCustomer = (party, staffId) =>
  Customer.findOneAndUpdate(
    { name: party.name, owner: staffId },
    { $set: { ...customerFields(party), role: "customer", owner: staffId } },
    { upsert: true, new: true }
  )

// Reads rows from JSON ({ rows }) sent by the bulk page, or from an uploaded CSV file
const readRows = async (request) => {
  const contentType = request.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const body = await request.json()
    return normalizeSheetRows(Array.isArray(body?.rows) ? body.rows : [])
  }
  const formData = await request.formData()
  const file = formData.get("file")
  if (!file || typeof file.text !== "function") return null
  return normalizeSheetRows(parseCsvToSheetRows(await file.text()))
}

const BULK_ROLES = [ROLES.ADMIN, ROLES.BRANCH, ROLES.FRANCHISE, ROLES.CLIENT]

export const GET = withAuth(async () => {
  // BOM so Excel opens the CSV as UTF-8
  return new Response(`﻿${buildTemplateCsv()}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kargoone-bulk-booking-template.csv"',
    },
  })
}, { roles: BULK_ROLES })

export const POST = withAuth(async (request, ctx, session) => {
  try {
    const rows = await readRows(request)

    if (rows === null) {
      return NextResponse.json({ success: false, error: "Please upload the filled template file" }, { status: 400 })
    }
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "The file has no booking rows" }, { status: 400 })
    }
    if (rows.length > MAX_BULK_ROWS) {
      return NextResponse.json(
        { success: false, error: `Please upload ${MAX_BULK_ROWS} rows or fewer at a time` },
        { status: 400 }
      )
    }

    // Identity comes from the signed session, never from request headers
    const userType = session.role
    const userCode = session.code
    const isClientOrFranchise = isExternal(session)
    const staffId = ownerIdFor(session)
    const allowedRefCodes = isClientOrFranchise ? await getAllowedRefCodes(session) : null

    const bookings = buildBookingsFromRows(rows)
    const valid = bookings.filter((b) => b.booking)

    const results = bookings.map((b) => ({
      rowNumbers: b.rowNumbers,
      senderName: b.first.senderName || "",
      receiverName: b.first.receiverName || "",
      boxCount: b.boxCount,
      success: false,
      errors: b.errors,
    }))

    if (valid.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid bookings found. Please fix the errors and upload again.", results },
        { status: 400 }
      )
    }

    await connectToDB()

    const startingInvoiceNumber = await getStartingInvoiceNumber()
    const trackingNumbers = await generateUniqueTrackingNumbers(valid.length)

    let validIndex = 0
    const awbs = []
    bookings.forEach((b, i) => {
      if (!b.booking) return
      const booking = { ...b.booking }
      if (isClientOrFranchise) {
        // Partners can't set vendor details through the sheet
        for (const f of ["cNoteNumber", "cNoteVendorName", "awbNumber", "forwardingNumber", "forwardingLink", "financials"]) delete booking[f]
      }
      const awb = {
        ...booking,
        staffId,
        // Clients / franchises: their own code, or (franchise) one of their own clients
        refCode: isClientOrFranchise
          ? allowedRefCodes.includes(b.booking.refCode) ? b.booking.refCode : userCode
          : b.booking.refCode || (userType === "branch" ? userCode : ""),
        invoiceNumber: String(startingInvoiceNumber + validIndex),
        trackingNumber: trackingNumbers[validIndex],
        sender: { ...b.booking.sender, owner: staffId },
        receiver: { ...b.booking.receiver, owner: staffId },
        ourBoxes: b.booking.boxes,
        vendorBoxes: b.booking.boxes,
        parcelStatus: [{ status: "Shipment AWB Prepared", timestamp: new Date(), comment: "" }],
      }
      awbs.push(awb)
      results[i] = {
        ...results[i],
        success: true,
        invoiceNumber: awb.invoiceNumber,
        trackingNumber: awb.trackingNumber,
      }
      validIndex += 1
    })

    const inserted = await Awb.insertMany(awbs, { ordered: true })

    // Customer address book is a convenience; a failure here must not hide
    // the fact that the bookings were created
    await Promise.allSettled(
      awbs.flatMap((awb) => [upsertCustomer(awb.sender, staffId), upsertCustomer(awb.receiver, staffId)])
    )

    const failedCount = bookings.length - inserted.length
    return NextResponse.json({
      success: true,
      message: `${inserted.length} booking${inserted.length === 1 ? "" : "s"} created${
        failedCount ? `, ${failedCount} skipped because of errors` : ""
      }`,
      createdCount: inserted.length,
      failedCount,
      results,
    })
  } catch (error) {
    console.error("Bulk AWB import error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to import bookings" },
      { status: 500 }
    )
  }
}, { roles: BULK_ROLES })
