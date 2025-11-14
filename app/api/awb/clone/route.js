import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    await connectToDB()
    const { sourceAwbId } = await req.json()

    if (!sourceAwbId) {
      return NextResponse.json({ error: "Source AWB ID is required" }, { status: 400 })
    }

    // Fetch the source AWB
    const sourceAwb = await Awb.findById(sourceAwbId).lean()

    if (!sourceAwb) {
      return NextResponse.json({ error: "Source AWB not found" }, { status: 404 })
    }

    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/get-last-awb`, {
      method: "GET",
    })

    if (!apiResponse.ok) {
      throw new Error("Failed to fetch tracking and invoice numbers")
    }

    const { invoiceNumber, trackingNumber } = await apiResponse.json()

    // Create a new AWB object with cloned data
    const clonedAwbData = {
      ...sourceAwb,
      _id: undefined, // Remove the existing ID so MongoDB creates a new one
      trackingNumber: trackingNumber,
      invoiceNumber: invoiceNumber,
      date: new Date(),
      parcelStatus: [
        {
          status: "Shipment AWB Prepared - BOM HUB",
          timestamp: new Date(),
          comment: "Cloned from AWB: " + sourceAwb.trackingNumber,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Save the cloned AWB
    const clonedAwb = new Awb(clonedAwbData)
    await clonedAwb.save()

    return NextResponse.json(
      {
        message: "AWB cloned successfully",
        data: clonedAwb,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error cloning AWB:", error.message)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
