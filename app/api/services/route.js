import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Rate from "@/models/Rate"

export async function GET() {
  try {
    await connectToDB()

    // Get all unique services
    const rates = await Rate.find({}, { service: 1 })
    const services = rates
      .map((rate) => rate.service)
      .filter(Boolean)
      .sort()

    return NextResponse.json(services)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
