import { connectToDB } from "@/app/_utils/mongodb";
import Stock from "@/models/Stock"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    await connectToDB()

    const { stockId, transaction } = await request.json()

    const stock = await Stock.findById(stockId)
    if (!stock) {
      return NextResponse.json({ success: false, error: "Stock not found" }, { status: 404 })
    }

    stock.transactions.push(transaction)
    await stock.save()

    return NextResponse.json({ success: true, data: stock })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
