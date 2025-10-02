import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Rate from "@/models/Rate"

export async function GET(req, { params }) {
  try {
    await connectToDB()
    const { id } = await params;
    const rate = await Rate.findById(id)

    if (!rate) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 })
    }

    return NextResponse.json(rate)
  } catch (error) {
    console.error("Error fetching rate:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    await connectToDB()
    const { id } = await params;
    const body = await req.json()

    const { type, service, originalName, rates, zones, covidCharges, fuelCharges } = body

    if (!type || !service || !originalName || !rates || !zones) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const updatedRate = await Rate.findByIdAndUpdate(
      id,
      {
        type,
        service,
        originalName,
        rates,
        zones,
        covidCharges,
        fuelCharges,
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!updatedRate) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 })
    }

    return NextResponse.json(updatedRate)
  } catch (error) {
    console.error("Error updating rate:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDB()
    const { id } = await params;
    const deletedRate = await Rate.findByIdAndDelete(id)

    if (!deletedRate) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Rate deleted successfully" })
  } catch (error) {
    console.error("Error deleting rate:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
