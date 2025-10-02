import { NextResponse } from "next/server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const trackingNumber = searchParams.get("trackingNumber")

  if (!trackingNumber) {
    return NextResponse.json({ error: "Tracking number is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`,
      {
        method: "GET",
        headers: {
          "DHL-API-KEY": process.env.DHL_API_KEY,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: "DHL API error" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
