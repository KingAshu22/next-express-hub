import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import { NextResponse } from "next/server"
import { withAuth, isExternal } from "@/lib/auth/server"
import { ROLES } from "@/lib/auth/config"
import { canAccessRefCode, ownerIdFor } from "@/lib/security/scope"
import { sanitizeAwb } from "@/lib/security/sanitize"
import { getNextBookingNumbers } from "@/lib/booking-numbers"

export const POST = withAuth(
  async (req, ctx, session) => {
    await connectToDB()
    const { sourceAwbId } = await req.json()

    if (!sourceAwbId || typeof sourceAwbId !== "string") {
      return NextResponse.json({ error: "Source AWB ID is required" }, { status: 400 })
    }

    const sourceAwb = await Awb.findById(sourceAwbId).lean().catch(() => null)
    if (!sourceAwb || !(await canAccessRefCode(session, sourceAwb.refCode))) {
      return NextResponse.json({ error: "Source AWB not found" }, { status: 404 })
    }

    const { invoiceNumber, trackingNumber } = await getNextBookingNumbers()

    const clonedAwbData = {
      ...sourceAwb,
      _id: undefined, // let MongoDB create a new ID
      trackingNumber,
      invoiceNumber,
      date: new Date(),
      staffId: isExternal(session) ? ownerIdFor(session) : sourceAwb.staffId,
      parcelStatus: [
        {
          status: "Shipment AWB Prepared - BOM HUB",
          timestamp: new Date(),
          comment: "Cloned from AWB: " + sourceAwb.trackingNumber,
        },
      ],
      // A new shipment has no vendor booking / bill yet
      cNoteNumber: undefined,
      cNoteVendorName: undefined,
      integratedVendorId: undefined,
      integratedService: undefined,
      awbNumber: undefined,
      forwardingNumber: undefined,
      forwardingLink: undefined,
      isBilled: false,
      billNumber: undefined,
      billedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const clonedAwb = new Awb(clonedAwbData)
    await clonedAwb.save()

    return NextResponse.json({ message: "AWB cloned successfully", data: sanitizeAwb(clonedAwb, session) }, { status: 200 })
  },
  { roles: [ROLES.ADMIN, ROLES.BRANCH, ROLES.FRANCHISE, ROLES.CLIENT] }
)
