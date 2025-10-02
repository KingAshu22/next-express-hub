import { connectToDB } from "@/app/_utils/mongodb";
import Awb from "@/models/Awb";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { refCode } = await params;
  console.log("Inside get /api/awb/refCode/:refCode");
  await connectToDB();
  try {
    const awb = await Awb.find({ refCode: refCode });

    if (!awb) {
      return NextResponse.json({ message: "AWB not found" }, { status: 404 });
    }

    return NextResponse.json(awb);
  } catch (error) {
    console.error("Error fetching AWB data:", error);
    return NextResponse.json(
      { message: "Failed to fetch AWB data.", error: error.message },
      { status: 500 }
    );
  }
}
