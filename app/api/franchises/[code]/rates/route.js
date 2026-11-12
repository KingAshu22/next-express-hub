import { connectToDB } from "@/app/_utils/mongodb";
import Franchise from "@/models/Franchise";
import { NextResponse } from "next/server";
import { withAuth, notFound } from "@/lib/auth/server";
import { ROLES } from "@/lib/auth/config";

// Admin, or the franchise itself
export const GET = withAuth(async (req, { params }, session) => {
  try {
    await connectToDB();
    const { code } = await params;
    if (session.role !== ROLES.ADMIN && session.code !== code) return notFound("Franchise not found");

    const franchise = await Franchise.findOne({ code: String(code) }).select("rateSheets");
    if (!franchise) {
      return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
    }

    return NextResponse.json(franchise.rateSheets);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}, { roles: [ROLES.ADMIN, ROLES.FRANCHISE] });
