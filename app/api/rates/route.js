import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Rate from "@/models/Rate"

export async function GET(req) {
  try {
    await connectToDB()
    
    // Get query parameters
    const { searchParams } = new URL(req.url)
    const rateCategory = searchParams.get("rateCategory")
    const vendorName = searchParams.get("vendorName")
    const status = searchParams.get("status")
    const rateMode = searchParams.get("rateMode")
    const targetCountry = searchParams.get("targetCountry")
    
    // Build query filter
    const filter = {}
    
    if (rateCategory) {
      filter.rateCategory = rateCategory
    }
    
    if (vendorName) {
      filter.vendorName = { $regex: new RegExp(vendorName, "i") }
    }
    
    if (status) {
      filter.status = status
    }
    
    if (rateMode) {
      filter.rateMode = rateMode
    }
    
    if (targetCountry) {
      filter.targetCountry = { $regex: new RegExp(targetCountry, "i") }
    }
    
    const rates = await Rate.find(filter).sort({ createdAt: -1 })
    
    return NextResponse.json({ rates, total: rates.length })
  } catch (error) {
    console.error("Error fetching rates:", error)
    return NextResponse.json(
      { message: "Failed to fetch rates.", error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    await connectToDB()
    const body = await req.json()

    const {
      // Basic fields
      vendorName,
      rateCategory,
      purchaseRateId,
      type,
      service,
      originalName,
      refCode,
      
      // Status and visibility
      status,
      assignedTo,
      
      // Rate mode
      rateMode,
      targetCountry,
      
      // Charges
      charges,
      
      // Rate data
      rates,
      zones,
      postalZones,
    } = body

    // Validate required fields
    if (!vendorName || !service || !originalName || !rateCategory) {
      return NextResponse.json(
        { message: "Missing required fields: vendorName, service, originalName, and rateCategory are required." },
        { status: 400 }
      )
    }

    // Validate rate data
    if (!rates || rates.length === 0) {
      return NextResponse.json(
        { message: "Rates data is required." },
        { status: 400 }
      )
    }

    // For sales rates, purchaseRateId is required
    if (rateCategory === "sales" && !purchaseRateId) {
      return NextResponse.json(
        { message: "Sales rates must be linked to a purchase rate." },
        { status: 400 }
      )
    }

    // Validate that the linked purchase rate exists (for sales rates)
    if (rateCategory === "sales" && purchaseRateId) {
      const purchaseRate = await Rate.findById(purchaseRateId)
      if (!purchaseRate) {
        return NextResponse.json(
          { message: "Linked purchase rate not found." },
          { status: 400 }
        )
      }
      if (purchaseRate.rateCategory !== "purchase") {
        return NextResponse.json(
          { message: "The linked rate must be a purchase rate." },
          { status: 400 }
        )
      }
    }

    // For single-country-zip mode, targetCountry is required
    if (rateMode === "single-country-zip" && !targetCountry) {
      return NextResponse.json(
        { message: "Target country is required for single-country-zip mode." },
        { status: 400 }
      )
    }

    // Build the rate object
    const rateData = {
      vendorName,
      rateCategory,
      purchaseRateId: rateCategory === "sales" ? purchaseRateId : null,
      type: type || "",
      service,
      originalName,
      refCode: refCode || "",
      
      // Purchase rates are always hidden
      status: rateCategory === "purchase" ? "hidden" : (status || "hidden"),
      assignedTo: status === "unlisted" ? (assignedTo || []) : [],
      
      rateMode: rateMode || "multi-country",
      targetCountry: rateMode === "single-country-zip" ? targetCountry : "",
      
      charges: charges || [],
      rates,
      zones: zones || [],
      postalZones: postalZones || [],
    }

    const newRate = new Rate(rateData)
    await newRate.save()

    return NextResponse.json(newRate, { status: 201 })
  } catch (error) {
    console.error("Error creating rate:", error)
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: "Failed to create rate.", error: error.message },
      { status: 500 }
    )
  }
}