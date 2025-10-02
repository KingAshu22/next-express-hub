import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Billing from "@/models/Billing";

export async function GET(req, { params }) {
  try {
    const { year, billNo } = await params;
    await connectToDB();

    const bill = await Billing.findOne({
      billNumber: `${year}/${billNo}`,
    }).lean();

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (err) {
    console.error("Error fetching bill:", err);
    return NextResponse.json(
      { error: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}
