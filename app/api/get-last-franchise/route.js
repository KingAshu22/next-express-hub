import { connectToDB } from "@/app/_utils/mongodb"
import Franchise from "@/models/Franchise"
import { NextResponse } from "next/server"

export async function GET() {
  console.log("Inside get /api/get-last-franchise")
  await connectToDB()
  try {
    const lastFranchise = await Franchise.findOne({}).sort({ _id: -1 })

    if (!lastFranchise) {
      // If no franchise exists, return a default starting code
      return NextResponse.json({ code: "0000" })
    }

    return NextResponse.json({ code: lastFranchise.code })
  } catch (error) {
    console.error("Error fetching last Franchise:", error.message)
    return NextResponse.json({ error: "Failed to fetch last Franchise" }, { status: 500 })
  }
}
