import { connectToDB } from "@/app/_utils/mongodb";
import Awb from "@/models/Awb";
import { NextResponse } from "next/server";
import { withAuth, notFound } from "@/lib/auth/server";
import { canAccessRefCode } from "@/lib/security/scope";
import { sanitizeAwbs, AWB_EXTERNAL_PROJECTION } from "@/lib/security/sanitize";
import { isInternalRole } from "@/lib/auth/config";

export const GET = withAuth(async (req, { params }, session) => {
  const { refCode } = await params;
  await connectToDB();

  if (!(await canAccessRefCode(session, String(refCode)))) return notFound("AWB not found");

  let query = Awb.find({ refCode: String(refCode) }).sort({ date: -1 });
  if (!isInternalRole(session.role)) query = query.select(AWB_EXTERNAL_PROJECTION);
  const awbs = await query.lean();

  return NextResponse.json(sanitizeAwbs(awbs, session));
});
