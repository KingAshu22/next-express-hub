import { connectToDB } from "@/app/_utils/mongodb";
import Estimate from "@/models/Estimate";
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/server"
import { ADMIN_BRANCH } from "@/lib/auth/config";

export const GET = withAuth(async () => {
  await connectToDB();

  try {
    // Fetch the last document by sorting by _id descending
    const lastEstimate = await Estimate.findOne({}).sort({ _id: -1 }).select("code");

    let nextCode;
    if (!lastEstimate || !lastEstimate.code) {
      nextCode = "0001"; // Start from 0001
    } else {
      const currentNumber = parseInt(lastEstimate.code, 10);
      nextCode = String(currentNumber + 1).padStart(4, "0");
    }

    return NextResponse.json({ code: nextCode });
  } catch (error) {
    console.error("Error fetching last estimate:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch last estimate" },
      { status: 500 }
    );
  }
}, { roles: ADMIN_BRANCH })
