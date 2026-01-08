import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Rate from "@/models/Rate"

// GET and DELETE methods remain unchanged. Only PUT needs updating.

export async function GET(req, { params }) {
  try {
    await connectToDB()
    const { id } = params
    const rate = await Rate.findById(id)

    if (!rate) {
      return NextResponse.json({ message: "Rate not found" }, { status: 404 })
    }

    return NextResponse.json(rate)
  } catch (error) {
    console.error(`Error fetching rate ${params.id}:`, error)
    return NextResponse.json({ message: "Failed to fetch rate.", error: error.message }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    await connectToDB()
    const { id } = params
    const body = await req.json()

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

    const updateData = {
      type,
      service,
      originalName,
      rates,
      zones,
      charges: charges || [], // Use provided charges or default to empty array
      status,
      assignedTo,
    }

    const updatedRate = await Rate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedRate) {
      return NextResponse.json({ message: "Rate not found" }, { status: 404 })
    }

    return NextResponse.json(updatedRate)
  } catch (error) {
    console.error(`Error updating rate ${params.id}:`, error)
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Failed to update rate.", error: error.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDB()
    const { id } = params
    const deletedRate = await Rate.findByIdAndDelete(id)

    if (!deletedRate) {
      return NextResponse.json({ message: "Rate not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Rate deleted successfully" })
  } catch (error) {
    console.error(`Error deleting rate ${params.id}:`, error)
    return NextResponse.json({ message: "Failed to delete rate.", error: error.message }, { status: 500 })
  }
}