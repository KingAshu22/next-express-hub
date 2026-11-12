import { connectToDB } from "@/app/_utils/mongodb"
import { withAuth } from "@/lib/auth/server"
import { PICKUP_ROLES } from "@/lib/auth/config"
import Pickup from "@/models/Pickup"
import { NextResponse } from "next/server"

export const GET = withAuth(async (req, { params }, session) => {
  await connectToDB()
  try {
    const { pickupNo } = await params
    const pickup = await Pickup.findOne({ pickupNo })
    if (!pickup) {
      return NextResponse.json({ message: "Pickup not found" }, { status: 404 })
    }
    return NextResponse.json(pickup)
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch pickup", error: error.message }, { status: 500 })
  }
}, { roles: PICKUP_ROLES })

export const PUT = withAuth(async (req, { params }, session) => {
  await connectToDB()
  try {
    const { pickupNo } = await params
    const body = await req.json()
    const updatedPickup = await Pickup.findOneAndUpdate({ pickupNo }, body, { new: true })
    if (!updatedPickup) {
      return NextResponse.json({ message: "Pickup not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Pickup updated", updatedPickup })
  } catch (error) {
    return NextResponse.json({ message: "Failed to update pickup", error: error.message }, { status: 500 })
  }
}, { roles: PICKUP_ROLES })

export const DELETE = withAuth(async (req, { params }, session) => {
  await connectToDB()
  try {
    const { pickupNo } = await params
    const deletedPickup = await Pickup.findOneAndDelete({ pickupNo })
    if (!deletedPickup) {
      return NextResponse.json({ message: "Pickup not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Pickup deleted" })
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete pickup", error: error.message }, { status: 500 })
  }
}, { roles: PICKUP_ROLES })
