import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Billing from "@/models/Billing"
import Awb from "@/models/Awb"

export async function DELETE(req, { params }) {
  try {
    await connectToDB()
    
    // FIX: Await params for Next.js 15
    const { id } = await params

    const bill = await Billing.findById(id);

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    }

    // Unmark all AWBs associated with this bill
    const awbIds = bill.awbs.map(a => a.awbId);
    if (awbIds.length > 0) {
      await Awb.updateMany(
        { _id: { $in: awbIds } },
        { 
          $set: { isBilled: false }, 
          $unset: { billNumber: "", billedAt: "" } 
        }
      );
    }

    await Billing.findByIdAndDelete(id);

    return NextResponse.json({ message: "Bill deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting bill:", error)
    return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 })
  }
}