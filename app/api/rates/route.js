import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Rate from "@/models/Rate"

export async function GET(req) {
  try {
    await connectToDB()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url)
    const rateCategory = searchParams.get('rateCategory')
    
    // Build filter object
    const filter = {}
    if (rateCategory) {
      filter.rateCategory = rateCategory
    }
    
    const rates = await Rate.find(filter).sort({ createdAt: -1 })
    return NextResponse.json(rates)
  } catch (error) {
    console.error("Error fetching rates:", error)
    return NextResponse.json({ message: "Failed to fetch rates.", error: error.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    await connectToDB()
    const body = await req.json()
    
    // Debug: Log incoming data
    console.log("=== Incoming POST Body ===")
    console.log("Rate Mode:", body.rateMode)
    console.log("Target Country:", body.targetCountry)
    console.log("Zones Count:", body.zones?.length || 0)
    console.log("Postal Zones Count:", body.postalZones?.length || 0)
    console.log("Rates Count:", body.rates?.length || 0)

    const {
      vendorName,
      rateCategory,
      rateMode,
      type,
      service,
      originalName,
      rates,
      zones,
      postalZones,  // ✅ ADD THIS - Extract postalZones from body
      charges, 
      status,
      assignedTo,
      targetCountry,
      purchaseRateId
    } = body

    // 1. VALIDATE REQUIRED BASE FIELDS
    if (!service || !originalName || !rates || rates.length === 0) {
      return NextResponse.json({ 
        message: "Missing required fields: service, originalName, and rates are required." 
      }, { status: 400 })
    }

    // 2. VALIDATE BASED ON RATE MODE
    if (rateMode === 'multi-country') {
      if (!zones || zones.length === 0) {
        return NextResponse.json({ 
          message: "Zones are required for multi-country rate mode." 
        }, { status: 400 })
      }
    } else if (rateMode === 'single-country-zip') {
      if (!postalZones || postalZones.length === 0) {
        return NextResponse.json({ 
          message: "Postal zones with ZIP codes are required for single-country-zip rate mode." 
        }, { status: 400 })
      }
      if (!targetCountry) {
        return NextResponse.json({ 
          message: "Target country is required for single-country-zip rate mode." 
        }, { status: 400 })
      }
    }

    // 3. VALIDATE SALES RATES HAVE LINKED PURCHASE RATE
    if (rateCategory === 'sales' && !purchaseRateId) {
      return NextResponse.json({ 
        message: "Sales rates must be linked to a purchase rate." 
      }, { status: 400 })
    }

    // 4. CREATE DATABASE ENTRY WITH ALL FIELDS
    const newRate = new Rate({
      vendorName,
      rateCategory: rateCategory || 'purchase',
      rateMode: rateMode || 'multi-country',
      type: type || '',
      service,
      originalName,
      rates,
      zones: zones || [],
      postalZones: postalZones || [],  // ✅ ADD THIS - Save postalZones
      charges: charges || [],
      status: status || 'hidden',
      assignedTo: assignedTo || [],
      targetCountry: targetCountry || '',
      purchaseRateId: purchaseRateId || null
    })

    await newRate.save()
    
    // Debug: Log saved data
    console.log("=== Rate Saved Successfully ===")
    console.log("Rate ID:", newRate._id)
    console.log("Saved Postal Zones Count:", newRate.postalZones?.length || 0)
    
    return NextResponse.json(newRate, { status: 201 })

  } catch (error) {
    console.error("Error creating rate:", error)
    
    if (error.name === "ValidationError") {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }))
      return NextResponse.json({ 
        message: "Database Validation Failed", 
        details: validationErrors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      message: "Failed to create rate.", 
      error: error.message 
    }, { status: 500 })
  }
}