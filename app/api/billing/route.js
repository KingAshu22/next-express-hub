import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Billing from "@/models/Billing";

// Function to get current financial year string like "2025-26"
function getFinancialYear() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // April = 4
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const data = await req.json();

    const financialYear = getFinancialYear();

    // Find last bill of this financial year
    const lastBill = await Billing.findOne({ financialYear })
      .sort({ createdAt: -1 })
      .exec();

    let nextNumber = "0001";
    if (lastBill) {
      const lastNumber = parseInt(lastBill.billNumber.split("/")[1], 10);
      nextNumber = String(lastNumber + 1).padStart(4, "0");
    }

    const billNumber = `${financialYear}/${nextNumber}`;

    const newBill = new Billing({
      ...data,
      financialYear,
      billNumber,
    });

    await newBill.save();

    return NextResponse.json(
      { message: "Bill created successfully", bill: newBill },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating bill:", err);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
