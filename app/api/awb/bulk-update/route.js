import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import { NextResponse } from "next/server"

const normalizeTrackingNumbers = (rawTrackingNumbers) => {
  if (Array.isArray(rawTrackingNumbers)) {
    return rawTrackingNumbers
      .map((item) => String(item || "").trim())
      .filter(Boolean)
  }

  return String(rawTrackingNumbers || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function PUT(request) {
  try {
    await connectToDB()
    const body = await request.json()
    const trackingNumbers = normalizeTrackingNumbers(body.trackingNumbers)

    if (trackingNumbers.length === 0) {
      return NextResponse.json(
        { success: false, message: "No tracking numbers provided." },
        { status: 400 }
      )
    }

    let hasUpdates = false

    // 1. Handle per-AWB field updates (new format from frontend)
    if (Array.isArray(body.awbUpdates) && body.awbUpdates.length > 0) {
      const bulkOps = []

      for (const awbUpdate of body.awbUpdates) {
        const tn = String(awbUpdate.trackingNumber || "").trim()
        if (!tn) continue

        const setFields = {}

        if (
          typeof awbUpdate.cNoteNumber === "string" &&
          awbUpdate.cNoteNumber.trim() !== ""
        ) {
          setFields.cNoteNumber = awbUpdate.cNoteNumber.trim()
        }
        if (
          typeof awbUpdate.cNoteVendorName === "string" &&
          awbUpdate.cNoteVendorName.trim() !== ""
        ) {
          setFields.cNoteVendorName = awbUpdate.cNoteVendorName.trim()
        }
        if (
          typeof awbUpdate.forwardingNumber === "string" &&
          awbUpdate.forwardingNumber.trim() !== ""
        ) {
          setFields.forwardingNumber = awbUpdate.forwardingNumber.trim()
        }
        if (
          typeof awbUpdate.forwardingLink === "string" &&
          awbUpdate.forwardingLink.trim() !== ""
        ) {
          setFields.forwardingLink = awbUpdate.forwardingLink.trim()
        }

        if (Object.keys(setFields).length > 0) {
          bulkOps.push({
            updateOne: {
              filter: { trackingNumber: tn },
              update: { $set: setFields },
            },
          })
        }
      }

      if (bulkOps.length > 0) {
        await Awb.bulkWrite(bulkOps)
        hasUpdates = true
      }
    }

    // 2. Handle legacy flat field updates (backward compatibility)
    if (!Array.isArray(body.awbUpdates) || body.awbUpdates.length === 0) {
      const legacySetFields = {}

      if (
        typeof body.cNoteNumber === "string" &&
        body.cNoteNumber.trim() !== ""
      ) {
        legacySetFields.cNoteNumber = body.cNoteNumber.trim()
      }
      if (
        typeof body.cNoteVendorName === "string" &&
        body.cNoteVendorName.trim() !== ""
      ) {
        legacySetFields.cNoteVendorName = body.cNoteVendorName.trim()
      }
      if (
        typeof body.forwardingNumber === "string" &&
        body.forwardingNumber.trim() !== ""
      ) {
        legacySetFields.forwardingNumber = body.forwardingNumber.trim()
      }
      if (
        typeof body.forwardingLink === "string" &&
        body.forwardingLink.trim() !== ""
      ) {
        legacySetFields.forwardingLink = body.forwardingLink.trim()
      }

      if (Object.keys(legacySetFields).length > 0) {
        await Awb.updateMany(
          { trackingNumber: { $in: trackingNumbers } },
          { $set: legacySetFields }
        )
        hasUpdates = true
      }
    }

    // 3. Handle shared parcelStatus timeline for all tracking numbers
    // APPEND new statuses to existing array instead of overwriting
    if (Array.isArray(body.parcelStatus) && body.parcelStatus.length > 0) {
      const normalizedStatuses = body.parcelStatus
        .filter((status) => status && status.status)
        .map((status) => ({
          status: String(status.status || "").trim(),
          location: String(status.location || "").trim(),
          timestamp: status.timestamp ? new Date(status.timestamp) : new Date(),
          comment: String(status.comment || "").trim(),
        }))

      if (normalizedStatuses.length > 0) {
        await Awb.updateMany(
          { trackingNumber: { $in: trackingNumbers } },
          { $push: { parcelStatus: { $each: normalizedStatuses } } }
        )
        hasUpdates = true
      }
    }

    if (!hasUpdates) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide at least one field or status update.",
        },
        { status: 400 }
      )
    }

    const updatedAwbs = await Awb.find({
      trackingNumber: { $in: trackingNumbers },
    }).select(
      "trackingNumber awbNumber sender.name receiver.name receiver.country cNoteNumber cNoteVendorName forwardingNumber forwardingLink parcelStatus"
    )

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedAwbs.length} AWB${updatedAwbs.length === 1 ? "" : "s"}.`,
      updatedCount: updatedAwbs.length,
      updatedAwbs,
    })
  } catch (error) {
    console.error("Error updating AWB bulk data:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update AWBs.",
        error: error.message,
      },
      { status: 500 }
    )
  }
}