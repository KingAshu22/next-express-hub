import { connectToDB } from "@/app/_utils/mongodb"
import Franchise from "@/models/Franchise"
import { NextResponse } from "next/server"

export async function GET() {
  console.log("Inside get /api/franchises")
  await connectToDB()
  try {
    const franchises = await Franchise.find({}).sort({ _id: -1 })
    return NextResponse.json(franchises)
  } catch (error) {
    console.error("Error fetching Franchises:", error.message)
    return NextResponse.json({ error: "Failed to fetch Franchises" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    console.log("Inside /api/franchises")
    await connectToDB()
    const data = await req.json() // Parse JSON body from the request

    console.log(data)

    const newFranchise = new Franchise(data)
    await newFranchise.save()

    return NextResponse.json({ message: "Franchise added successfully!", newFranchise }, { status: 200 })
  } catch (error) {
    console.error("Error in POST /api/franchises:", error.message)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
