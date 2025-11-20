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
    return NextResponse.json({ message: "Failed to fetch rates.", error: error.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    await connectToDB()
    const body = await req.json()

    // Destructure all fields, including the new 'charges' array
    const {
      type,
      service,
      originalName,
      rates,
      zones,
      charges, // New charges array
      status,
      assignedTo,
    } = body

    if (!type || !service || !originalName || !rates || !zones || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const newRate = new Rate({
      type,
      service,
      originalName,
      rates,
      zones,
      charges: charges || [], // Use provided charges or default to empty array
      status,
      assignedTo,
    })

    await newRate.save()

    return NextResponse.json(newRate, { status: 201 })
  } catch (error) {
    console.error("Error creating rate:", error)
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Failed to create rate.", error: error.message }, { status: 500 })
  }
}