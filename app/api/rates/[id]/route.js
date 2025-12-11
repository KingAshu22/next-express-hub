import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Rate from "@/models/Rate"

export async function GET(req, { params }) {
  try {
    await connectToDB()
    const { id } = await params
    const rate = await Rate.findById(id)

    if (!rate) {
      return NextResponse.json({ message: "Rate not found" }, { status: 404 })
    }

    // If it's a sales rate with a linked purchase rate, fetch that too
    let linkedPurchaseRate = null
    if (rate.rateCategory === "sales" && rate.purchaseRateId) {
      linkedPurchaseRate = await Rate.findById(rate.purchaseRateId).select(
        "vendorName service originalName rateMode targetCountry"
      )
    }

    return NextResponse.json({
      ...rate.toObject(),
      linkedPurchaseRate,
    })
  } catch (error) {
    console.error(`Error fetching rate ${params.id}:`, error)
    return NextResponse.json(
      { message: "Failed to fetch rate.", error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(req, { params }) {
  try {
    await connectToDB()
    const { id } = await params
    const body = await req.json()

    // First, get the existing rate to check category
    const existingRate = await Rate.findById(id)
    if (!existingRate) {
      return NextResponse.json({ message: "Rate not found" }, { status: 404 })
    }

    const {
      // Basic fields
      vendorName,
      rateCategory, // Note: This should not change from the original
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
    if (!vendorName || !service || !originalName) {
      return NextResponse.json(
        { message: "Missing required fields: vendorName, service, and originalName are required." },
        { status: 400 }
      )
    }

    // Rate category cannot be changed
    if (rateCategory && rateCategory !== existingRate.rateCategory) {
      return NextResponse.json(
        { message: "Rate category cannot be changed after creation." },
        { status: 400 }
      )
    }

    // Use existing rate category
    const finalRateCategory = existingRate.rateCategory

    // For sales rates, validate purchase rate link
    if (finalRateCategory === "sales") {
      if (!purchaseRateId) {
        return NextResponse.json(
          { message: "Sales rates must be linked to a purchase rate." },
          { status: 400 }
        )
      }

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

    // Determine final rateMode
    const finalRateMode = rateMode || existingRate.rateMode || "multi-country"

    // For single-country-zip mode, targetCountry is required
    if (finalRateMode === "single-country-zip" && !targetCountry && !existingRate.targetCountry) {
      return NextResponse.json(
        { message: "Target country is required for single-country-zip mode." },
        { status: 400 }
      )
    }

    // Build update data
    const updateData = {
      vendorName,
      purchaseRateId: finalRateCategory === "sales" ? purchaseRateId : null,
      type: type || "",
      service,
      originalName,
      refCode: refCode || existingRate.refCode || "",
      
      // Purchase rates are always hidden
      status: finalRateCategory === "purchase" ? "hidden" : (status || "hidden"),
      assignedTo: status === "unlisted" ? (assignedTo || []) : [],
      
      rateMode: finalRateMode,
      targetCountry: finalRateMode === "single-country-zip" 
        ? (targetCountry || existingRate.targetCountry) 
        : "",
      
      charges: charges || [],
      
      // Only update rate data if provided
      ...(rates && rates.length > 0 && { rates }),
      ...(zones && { zones }),
      ...(postalZones && { postalZones }),
      
      updatedAt: new Date(),
    }

    const updatedRate = await Rate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    return NextResponse.json(updatedRate)
  } catch (error) {
    console.error(`Error updating rate ${params.id}:`, error)
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: "Failed to update rate.", error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDB()
    const { id } = await params

    // Check if this rate is linked to any sales rates
    const linkedSalesRates = await Rate.find({ purchaseRateId: id })
    if (linkedSalesRates.length > 0) {
      return NextResponse.json(
        { 
          message: "Cannot delete this purchase rate. It is linked to sales rates.",
          linkedRates: linkedSalesRates.map(r => ({
            id: r._id,
            service: r.service,
            originalName: r.originalName
          }))
        },
        { status: 400 }
      )
    }

    const deletedRate = await Rate.findByIdAndDelete(id)

    if (!deletedRate) {
      return NextResponse.json({ message: "Rate not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Rate deleted successfully" })
  } catch (error) {
    console.error(`Error deleting rate ${params.id}:`, error)
    return NextResponse.json(
      { message: "Failed to delete rate.", error: error.message },
      { status: 500 }
    )
  }
}