import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Billing from "@/models/Billing";

export async function POST(req, { params }) {
  try {
    await connectToDB();
    
    // FIX: Await params for Next.js 15
    const { year, billNo } = await params;
    
    const decodedYear = decodeURIComponent(year);
    const decodedBillNo = decodeURIComponent(billNo);
    const fullBillNumber = `${decodedYear}/${decodedBillNo}`;

    const { payment } = await req.json();

    if (!payment || !payment.amount) {
      return NextResponse.json({ error: "Invalid payment data" }, { status: 400 });
    }

    const bill = await Billing.findOne({ billNumber: fullBillNumber });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Logic: Add payment, update totals
    const paymentAmount = parseFloat(payment.amount);
    
    bill.paymentHistory.push({
      amount: paymentAmount,
      date: new Date(payment.date),
      mode: payment.mode,
      reference: payment.reference,
      notes: payment.notes,
      recordedAt: new Date()
    });

    bill.paid = (bill.paid || 0) + paymentAmount;
    // Prevent floating point errors
    bill.balance = parseFloat((bill.total - bill.paid).toFixed(2));

    await bill.save();

    return NextResponse.json({ message: "Payment recorded", bill });
  } catch (err) {
    console.error("Error recording payment:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}