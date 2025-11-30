import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Billing from "@/models/Billing"
import Awb from "@/models/Awb"

export async function GET(req, { params }) {
  try {
    await connectToDB();
    
    const { year, billNo } = params;
    const decodedYear = decodeURIComponent(year);
    const decodedBillNo = decodeURIComponent(billNo);
    const fullBillNumber = `${decodedYear}/${decodedBillNo}`;

    // POPULATE awbs.awbId to get date and receiver details
    const bill = await Billing.findOne({ billNumber: fullBillNumber })
      .populate({
        path: "awbs.awbId",
        model: "Awb",
        select: "date receiver.name" // Select only fields we need
      })
      .lean();

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

export async function PUT(req, { params }) {
  try {
    await connectToDB()
    const { year, billNo } = await params
    const updateData = await req.json()

    const bill = await Billing.findOne({
      billNumber: `${year}/${billNo}`,
    })

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    }

    // Track edit history for audit purposes
    const editHistory = bill.editHistory || []
    editHistory.push({
      editedAt: new Date(),
      editedBy: "admin",
      changes: {
        previous: {
          awbs: bill.awbs,
          paid: bill.paid,
          balance: bill.balance,
          subtotal: bill.subtotal,
          total: bill.total,
        },
        updated: {
          awbs: updateData.awbs,
          paid: updateData.paid,
          balance: updateData.balance,
          subtotal: updateData.subtotal,
          total: updateData.total,
        },
      },
    })

    const updatedBill = await Billing.findOneAndUpdate(
      { billNumber: `${year}/${billNo}` },
      {
        ...updateData,
        updatedAt: new Date(),
        editHistory,
      },
      { new: true },
    )

    return NextResponse.json(updatedBill)
  } catch (err) {
    console.error("Error updating bill:", err)
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 })
  }
}
