import { connectToDB } from "@/app/_utils/mongodb"
import Stock from "@/models/Stock"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    await connectToDB()

    const id = params.id
    console.log("GET stock by ID:", id)

    if (!id) {
      return NextResponse.json({ success: false, error: "Stock ID is required" }, { status: 400 })
    }

    const stock = await Stock.findById(id)

    if (!stock) {
      return NextResponse.json({ success: false, error: "Stock not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: stock })
  } catch (error) {
    console.error("GET /api/stock/[id] error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDB()

    const id = params.id
    const body = await request.json()
    console.log("PUT stock by ID:", id, "with data:", body)

    if (!id) {
      return NextResponse.json({ success: false, error: "Stock ID is required" }, { status: 400 })
    }

    const stock = await Stock.findByIdAndUpdate(id, body, { new: true, runValidators: true })

    if (!stock) {
      return NextResponse.json({ success: false, error: "Stock not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: stock })
  } catch (error) {
    console.error("PUT /api/stock/[id] error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDB()

    const id = params.id
    console.log("DELETE stock by ID:", id)

    if (!id) {
      console.error("No ID provided for deletion")
      return NextResponse.json({ success: false, error: "Stock ID is required" }, { status: 400 })
    }

    // Validate if the ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.error("Invalid MongoDB ObjectId format:", id)
      return NextResponse.json({ success: false, error: "Invalid stock ID format" }, { status: 400 })
    }

    const stock = await Stock.findByIdAndDelete(id)

    if (!stock) {
      console.error("Stock not found for deletion:", id)
      return NextResponse.json({ success: false, error: "Stock not found" }, { status: 404 })
    }

    console.log("Stock deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Stock deleted successfully", data: stock })
  } catch (error) {
    console.error("DELETE /api/stock/[id] error:", error)

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return NextResponse.json({ success: false, error: "Invalid stock ID" }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: error.message || "Failed to delete stock" }, { status: 500 })
  }
}
