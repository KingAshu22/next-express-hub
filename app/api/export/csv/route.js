import { connectToDB } from "@/app/_utils/mongodb";
import Stock from "@/models/Stock"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    await connectToDB()

    const { searchParams } = new URL(request.url)
    const partyName = searchParams.get("partyName")
    const productName = searchParams.get("productName")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")

    const query = {}

    if (partyName) {
      query.partyName = { $regex: partyName, $options: "i" }
    }

    if (productName) {
      query.productName = { $regex: productName, $options: "i" }
    }

    if (fromDate || toDate) {
      query.createdAt = {}
      if (fromDate) query.createdAt.$gte = new Date(fromDate)
      if (toDate) query.createdAt.$lte = new Date(toDate)
    }

    const stocks = await Stock.find(query).sort({ createdAt: -1 })

    // Generate CSV content
    let csvContent =
      "Party Name,GST No,Product Name,HSN Code,Opening Qty,Opening Rate,Opening Amount,Total Inward,Total Outward,Current Qty,Current Value,Created Date\n"

    stocks.forEach((stock) => {
      const totalInward = stock.transactions.filter((t) => t.type === "inward").reduce((sum, t) => sum + t.qty, 0)

      const totalOutward = stock.transactions.filter((t) => t.type === "outward").reduce((sum, t) => sum + t.qty, 0)

      csvContent += `"${stock.partyName}","${stock.gstNo}","${stock.productName}","${stock.hsnCode}",${stock.openingStock.qty},${stock.openingStock.rate},${stock.openingStock.amount},${totalInward},${totalOutward},${stock.currentStock.qty},${stock.currentStock.value},"${new Date(stock.createdAt).toLocaleDateString()}"\n`
    })

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="stock-register.csv"',
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
