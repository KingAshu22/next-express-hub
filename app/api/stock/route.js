import { connectToDB } from "@/app/_utils/mongodb"
import Stock from "@/models/Stock"
import Party from "@/models/Party"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    await connectToDB()

    const { searchParams } = new URL(request.url)
    const partyName = searchParams.get("partyName")
    const productName = searchParams.get("productName")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const type = searchParams.get("type")

    const query = {}

    if (partyName) {
      query.partyName = { $regex: partyName, $options: "i" }
    }

    if (productName) {
      query["products.productName"] = { $regex: productName, $options: "i" }
    }

    if (type) {
      query.type = type
    }

    if (fromDate || toDate) {
      query.createdAt = {}
      if (fromDate) query.createdAt.$gte = new Date(fromDate)
      if (toDate) query.createdAt.$lte = new Date(toDate)
    }

    const stocks = await Stock.find(query).sort({ createdAt: -1 })

    return NextResponse.json({ success: true, data: stocks })
  } catch (error) {
    console.error("GET /api/stock error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectToDB()

    const body = await request.json()
    console.log("Received stock data:", JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.partyName || !body.gstNo) {
      console.error("Missing party details:", { partyName: body.partyName, gstNo: body.gstNo })
      return NextResponse.json(
        {
          success: false,
          error: "Party name and GST number are required",
        },
        { status: 400 },
      )
    }

    if (!body.products || body.products.length === 0) {
      console.error("No products provided")
      return NextResponse.json(
        {
          success: false,
          error: "At least one product is required",
        },
        { status: 400 },
      )
    }

    if (!body.type) {
      console.error("Missing type field")
      return NextResponse.json(
        {
          success: false,
          error: "Transaction type is required",
        },
        { status: 400 },
      )
    }

    // Validate products
    for (let i = 0; i < body.products.length; i++) {
      const product = body.products[i]
      if (!product.productName || !product.hsnCode) {
        console.error(`Product ${i + 1} validation failed:`, product)
        return NextResponse.json(
          {
            success: false,
            error: `Product ${i + 1}: Name and HSN code are required`,
          },
          { status: 400 },
        )
      }

      if (product.qty === undefined || product.qty === null || product.qty <= 0) {
        console.error(`Product ${i + 1} quantity invalid:`, product.qty)
        return NextResponse.json(
          {
            success: false,
            error: `Product ${i + 1}: Quantity must be greater than 0`,
          },
          { status: 400 },
        )
      }

      if (product.rate === undefined || product.rate === null || product.rate <= 0) {
        console.error(`Product ${i + 1} rate invalid:`, product.rate)
        return NextResponse.json(
          {
            success: false,
            error: `Product ${i + 1}: Rate must be greater than 0`,
          },
          { status: 400 },
        )
      }
    }

    // Ensure tax object exists with default values
    if (!body.tax) {
      body.tax = {
        cgst: 0,
        sgst: 0,
        igst: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTaxAmount: 0,
      }
    }

    // Ensure invoice date exists
    if (!body.invoiceDate) {
      body.invoiceDate = new Date()
    }

    // Create a clean object for Stock creation
    const stockData = {
      partyName: body.partyName,
      gstNo: body.gstNo,
      invoiceNo: body.invoiceNo || "",
      invoiceDate: new Date(body.invoiceDate),
      products: body.products.map((product) => ({
        productName: product.productName,
        hsnCode: product.hsnCode,
        qty: Number(product.qty),
        rate: Number(product.rate),
        discount: Number(product.discount) || 0,
        discountAmount: Number(product.discountAmount) || 0,
        taxableAmount: Number(product.taxableAmount) || 0,
        amount: Number(product.amount) || 0,
      })),
      tax: {
        cgst: Number(body.tax.cgst) || 0,
        sgst: Number(body.tax.sgst) || 0,
        igst: Number(body.tax.igst) || 0,
        cgstAmount: Number(body.tax.cgstAmount) || 0,
        sgstAmount: Number(body.tax.sgstAmount) || 0,
        igstAmount: Number(body.tax.igstAmount) || 0,
        totalTaxAmount: Number(body.tax.totalTaxAmount) || 0,
      },
      subtotal: Number(body.subtotal) || 0,
      totalDiscountAmount: Number(body.totalDiscountAmount) || 0,
      taxableAmount: Number(body.taxableAmount) || 0,
      totalAmount: Number(body.totalAmount) || 0,
      type: body.type,
      currentStock: body.currentStock || [],
    }

    console.log("Creating stock with clean data:", JSON.stringify(stockData, null, 2))

    // Create the stock entry
    const stock = await Stock.create(stockData)
    console.log("Stock created successfully:", stock._id)

    // Update party products with latest rates for inward transactions
    if (body.type === "inward") {
      try {
        console.log("Updating party products for inward transaction...")
        let party = await Party.findOne({ partyName: body.partyName })

        if (!party) {
          console.log("Party not found, creating new party...")
          // Create party if it doesn't exist
          party = await Party.create({
            partyName: body.partyName,
            gstNo: body.gstNo,
            products: [],
          })
          console.log("New party created:", party._id)
        }

        body.products.forEach((product) => {
          const existingProductIndex = party.products.findIndex((p) => p.productName === product.productName)

          if (existingProductIndex >= 0) {
            // Update existing product
            party.products[existingProductIndex].lastRate = product.rate
            party.products[existingProductIndex].lastPurchaseDate = new Date()
            console.log(`Updated existing product: ${product.productName}`)
          } else {
            // Add new product
            party.products.push({
              productName: product.productName,
              hsnCode: product.hsnCode,
              lastRate: product.rate,
              lastPurchaseDate: new Date(),
            })
            console.log(`Added new product: ${product.productName}`)
          }
        })

        await party.save()
        console.log("Party products updated successfully")
      } catch (partyError) {
        console.error("Error updating party (non-critical):", partyError)
        // Don't fail the stock creation if party update fails
      }
    }

    return NextResponse.json({ success: true, data: stock }, { status: 201 })
  } catch (error) {
    console.error("POST /api/stock error:", error)

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      console.error("Validation errors:", validationErrors)
      return NextResponse.json(
        {
          success: false,
          error: `Validation failed: ${validationErrors.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate entry detected",
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create stock entry",
      },
      { status: 400 },
    )
  }
}
