import { connectToDB } from "@/app/_utils/mongodb"
import Party from "@/models/Party"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    await connectToDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const query = search ? { partyName: { $regex: search, $options: "i" } } : {}

    const parties = await Party.find(query).sort({ partyName: 1 })

    return NextResponse.json({ success: true, data: parties })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectToDB()

    const body = await request.json()

    // Check if party already exists
    const existingParty = await Party.findOne({
      $or: [{ partyName: body.partyName }, { gstNo: body.gstNo }],
    })

    if (existingParty) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingParty.partyName === body.partyName
              ? "Party with this name already exists"
              : "Party with this GST number already exists",
        },
        { status: 400 },
      )
    }

    const party = await Party.create(body)

    return NextResponse.json({ success: true, data: party }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
