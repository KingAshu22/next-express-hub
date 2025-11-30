import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Billing from "@/models/Billing"

export async function DELETE(req, { params }) {
  try {
    await connectToDB()
    const { id } = params

    const result = await Billing.findByIdAndDelete(id)

    if (!result) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Bill deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting bill:", error)
    return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 })
  }
}
