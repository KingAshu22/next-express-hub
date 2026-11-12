import { connectToDB } from "@/app/_utils/mongodb";
import Awb from "@/models/Awb";
import { NextResponse } from "next/server";
import { withAuth, isExternal, notFound } from "@/lib/auth/server";
import { ROLES, INTERNAL_ROLES } from "@/lib/auth/config";
import { canAccessRefCode } from "@/lib/security/scope";
import { sanitizeAwb, stripBlockedAwbFields } from "@/lib/security/sanitize";

// Loads a booking and checks the signed-in user may touch it.
// Bookings of other partners answer 404 (not 403) so they can't even be confirmed to exist.
async function loadOwnedAwb(trackingNumber, session) {
  const awb = await Awb.findOne({ trackingNumber: String(trackingNumber) });
  if (!awb) return null;
  if (!(await canAccessRefCode(session, awb.refCode))) return null;
  return awb;
}

export const GET = withAuth(async (req, { params }, session) => {
  const { trackingNumber } = await params;
  await connectToDB();

  const awb = await loadOwnedAwb(trackingNumber, session);
  if (!awb) return notFound("AWB not found");

  // Kept as an array: the pages read response.data[0]
  return NextResponse.json([sanitizeAwb(awb, session)]);
});

// Staff may edit everything; partners may edit their own booking's
// shipment details, but never vendor / billing / status / ownership fields.
const EDIT_ROLES = [...INTERNAL_ROLES.filter((r) => r !== ROLES.PICKUP), ROLES.FRANCHISE, ROLES.CLIENT];

export const PUT = withAuth(
  async (req, { params }, session) => {
    await connectToDB();
    const { trackingNumber } = await params;
    let body = await req.json();

    const existing = await loadOwnedAwb(trackingNumber, session);
    if (!existing) return notFound("AWB not found");

    if (isExternal(session)) {
      if (existing.isBilled) {
        return NextResponse.json(
          { error: "This booking is already billed. Please contact Kargo One to change it." },
          { status: 403 }
        );
      }
      body = stripBlockedAwbFields(body);
      // Update nested objects field-by-field so staff-only parts (purchase
      // cost, vendor details) that the partner never received are kept.
      for (const key of ["financials", "rateInfo"]) {
        if (body[key] && typeof body[key] === "object") {
          for (const [sub, value] of Object.entries(body[key])) body[`${key}.${sub}`] = value;
          delete body[key];
        }
      }
    } else {
      // Even staff can't inject Mongo operators through the body
      for (const key of Object.keys(body || {})) if (key.startsWith("$")) delete body[key];
      delete body._id;
    }

    const updatedAwb = await Awb.findOneAndUpdate({ _id: existing._id }, { $set: body }, { new: true });

    return NextResponse.json({
      message: "AWB updated successfully!",
      updatedAwb: sanitizeAwb(updatedAwb, session),
    });
  },
  { roles: EDIT_ROLES }
);

export const DELETE = withAuth(
  async (req, { params }, session) => {
    await connectToDB();
    const { trackingNumber } = await params;
    const deletedAwb = await Awb.findOneAndDelete({ trackingNumber: String(trackingNumber) });

    if (!deletedAwb) {
      return NextResponse.json({ error: "AWB not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "AWB deleted successfully!" }, { status: 200 });
  },
  { roles: [ROLES.ADMIN, ROLES.BRANCH] }
);
