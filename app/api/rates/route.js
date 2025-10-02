import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Rate from "@/models/Rate"

export async function GET() {
  try {
    await connectToDB()
    const rates = await Rate.find({}).sort({ createdAt: -1 })
    return NextResponse.json(rates)
  } catch (error) {
    console.error("Error fetching rates:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    await connectToDB()
    const body = await req.json()

    const { type, service, originalName, rates, zones } = body

    if (!type || !service || !originalName || !rates || !zones) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if rate with same type already exists
    const existingRate = await Rate.findOne({ type })
    if (existingRate) {
      return NextResponse.json({ error: "Rate with this type already exists" }, { status: 409 })
    }

    const newRate = new Rate({
      type,
      service,
      originalName,
      rates,
      zones,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newRate.save()

    return NextResponse.json(newRate, { status: 201 })
  } catch (error) {
    console.error("Error creating rate:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
