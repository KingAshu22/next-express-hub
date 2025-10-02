import { connectToDB } from "@/app/_utils/mongodb"
import Party from "@/models/Party"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    await connectToDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const party = await Party.findById(params.id)

    if (!party) {
      return NextResponse.json({ success: false, error: "Party not found" }, { status: 404 })
    }

    let products = party.products

    if (search) {
      products = products.filter((product) => product.productName.toLowerCase().includes(search.toLowerCase()))
    }

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
