import { connectToDB } from "@/app/_utils/mongodb"
import Franchise from "@/models/Franchise"
import { NextResponse } from "next/server"

export async function POST(req, { params }) {
  try {
    await connectToDB()
    const { code } = params
    const body = await req.json()

    // basic validation
    if (!body.type || !body.service || !body.originalName) {
      return NextResponse.json(
        { error: "Missing required fields: type, service, or originalName" },
        { status: 400 }
      )
    }
    if (!body.rates || body.rates.length === 0) {
      return NextResponse.json(
        { error: "Rates data missing or empty" },
        { status: 400 }
      )
    }
    if (!body.zones || body.zones.length === 0) {
      return NextResponse.json(
        { error: "Zones data missing or empty" },
        { status: 400 }
      )
    }

    const franchise = await Franchise.findOne({ code })
    if (!franchise) {
      return NextResponse.json({ error: "Franchise not found" }, { status: 404 })
    }

    // structure data like schema
    const newRateSheet = {
      type: body.type,
      service: body.service,
      originalName: body.originalName,
      covidCharges: body.covidCharges || "",
      fuelCharges: body.fuelCharges || "",
      uploadedAt: new Date(),
      rates: body.rates.map((row) => ({
        kg: row.kg,
        zones: row, // row already contains { kg, "1": val, "2": val, ... }
      })),
      zones: body.zones.map((zone) => ({
        zone: zone.zone,
        countries: zone.countries,
        extraCharges: zone.extraCharges || {},
      })),
    }

    franchise.rateSheets.push(newRateSheet)
    await franchise.save()

    return NextResponse.json({
      success: true,
      message: "Rate sheet uploaded successfully",
      rateSheetId: franchise.rateSheets[franchise.rateSheets.length - 1]._id,
    })
  } catch (err) {
    console.error("Error in update-rate:", err)
    return NextResponse.json({ error: "Failed to upload rate" }, { status: 500 })
  }
}
