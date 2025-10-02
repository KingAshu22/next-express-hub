import { connectToDB } from "@/app/_utils/mongodb"
import Pickup from "@/models/Pickup"
import { NextResponse } from "next/server"

export async function GET(req) {
  await connectToDB()
  try {
    const { searchParams } = new URL(req.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Filtering parameters
    const pickupClient = searchParams.get("pickupClient")
    const pickupLocation = searchParams.get("pickupLocation")
    const pickupFrom = searchParams.get("pickupFrom")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Sorting parameters
    const sortBy = searchParams.get("sortBy") || "date"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build filter object
    const filter = {}
    if (pickupClient) {
      filter.pickupClient = { $regex: pickupClient, $options: "i" }
    }
    if (pickupLocation) {
      filter.pickupLocation = { $regex: pickupLocation, $options: "i" }
    }
    if (pickupFrom) {
      filter.pickupFrom = { $regex: pickupFrom, $options: "i" }
    }
    if (dateFrom || dateTo) {
      filter.date = {}
      if (dateFrom) filter.date.$gte = dateFrom
      if (dateTo) filter.date.$lte = dateTo
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    const total = await Pickup.countDocuments(filter)
    const pickups = await Pickup.find(filter).skip(skip).limit(limit).sort(sort)

    return NextResponse.json({ pickups, total })
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch pickups", error: error.message }, { status: 500 })
  }
}

export async function POST(req) {
  await connectToDB()
  try {
    const body = await req.json()

    // Auto-generate pickupNo
    const lastPickup = await Pickup.findOne({}).sort({ _id: -1 }).select("pickupNo")

    let nextPickupNo
    if (!lastPickup) {
      nextPickupNo = "PU-0001"
    } else {
      const lastNumber = Number.parseInt(lastPickup.pickupNo.split("-")[1])
      const nextNumber = (lastNumber + 1).toString().padStart(4, "0")
      nextPickupNo = `PU-${nextNumber}`
    }

    body.pickupNo = nextPickupNo

    const newPickup = new Pickup(body)
    await newPickup.save()

    return new Response(JSON.stringify({ message: "Pickup created successfully", newPickup }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return NextResponse.json({ message: "Failed to create pickup", error: error.message }, { status: 500 })
  }
}
