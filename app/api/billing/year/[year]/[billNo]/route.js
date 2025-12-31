import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Billing from "@/models/Billing";
import Awb from "@/models/Awb";

// GET - Fetch Bill Details
export async function GET(req, { params }) {
  try {
    await connectToDB();
    
    // FIX: Await params for Next.js 15
    const { year, billNo } = await params;
    
    const decodedYear = decodeURIComponent(year);
    const decodedBillNo = decodeURIComponent(billNo);
    const fullBillNumber = `${decodedYear}/${decodedBillNo}`;

    // Use .populate to get real-time AWB details if needed (like tracking number changes)
    // However, billing data usually snapshots the state at bill creation.
    // Here we populate basics just in case.
    const bill = await Billing.findOne({ billNumber: fullBillNumber }).lean();

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
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

// PUT - Update Bill Details
export async function PUT(req, { params }) {
  try {
    await connectToDB();
    
    // FIX: Await params for Next.js 15
    const { year, billNo } = await params;
    
    const decodedYear = decodeURIComponent(year);
    const decodedBillNo = decodeURIComponent(billNo);
    const fullBillNumber = `${decodedYear}/${decodedBillNo}`;

    const updateData = await req.json();

    // 1. Find Existing Bill
    const bill = await Billing.findOne({ billNumber: fullBillNumber });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // 2. Handle AWB Changes (Add/Remove)
    // Identify AWBs removed from this bill to unmark them
    const oldAwbIds = bill.awbs.map(a => a.awbId.toString());
    const newAwbIds = updateData.awbs.map(a => a.awbId.toString());

    const removedAwbs = oldAwbIds.filter(id => !newAwbIds.includes(id));
    const addedAwbs = newAwbIds.filter(id => !oldAwbIds.includes(id));

    // Unmark removed AWBs
    if (removedAwbs.length > 0) {
      await Awb.updateMany(
        { _id: { $in: removedAwbs } },
        { $set: { isBilled: false }, $unset: { billNumber: "", billedAt: "" } }
      );
    }

    // Mark new AWBs
    if (addedAwbs.length > 0) {
      await Awb.updateMany(
        { _id: { $in: addedAwbs } },
        { $set: { isBilled: true, billNumber: fullBillNumber, billedAt: new Date() } }
      );
    }

    // 3. Track History
    const editHistory = bill.editHistory || [];
    editHistory.push({
      editedAt: new Date(),
      editedBy: "admin", // Replace with user ID if auth available
      changes: {
        totalOld: bill.total,
        totalNew: updateData.total,
        countOld: bill.awbs.length,
        countNew: updateData.awbs.length
      },
    });

    // 4. Update Bill Document
    // Recalculate balance based on (New Total - Already Paid)
    // Note: 'paid' shouldn't change here typically, it changes via payment route
    const currentPaid = bill.paid || 0;
    const newTotal = updateData.total;
    const newBalance = newTotal - currentPaid;

    const updatedBill = await Billing.findOneAndUpdate(
      { billNumber: fullBillNumber },
      {
        ...updateData,
        // Ensure paid/balance logic stays consistent
        paid: currentPaid, 
        balance: newBalance,
        updatedAt: new Date(),
        editHistory,
      },
      { new: true }
    );

    return NextResponse.json(updatedBill);
  } catch (err) {
    console.error("Error updating bill:", err);
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 });
  }
}