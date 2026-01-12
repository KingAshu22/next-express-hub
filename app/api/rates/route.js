import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Rate from "@/models/Rate"

export async function GET() {
  try {
    await connectToDB()
    const rates = await Rate.find({}).sort({ createdAt: -1 })
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
    
    console.log("Incoming POST Body:", body)

    const {
      vendorName,
      rateCategory,
      rateMode,
      type,
      service,
      originalName,
      rates,
      zones,
      charges, 
      status,
      assignedTo,
      targetCountry,
      purchaseRateId // <--- 1. ADD THIS: Needed for Sales rates
    } = body

    // 1. IMPROVED MANUAL VALIDATION
    const requiredFields = ['service', 'originalName', 'rates', 'zones', 'status'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 })
    }

    // 2. CREATE DATABASE ENTRY
    const newRate = new Rate({
      vendorName,
      rateCategory,
      rateMode,
      type,
      service,
      originalName,
      rates,
      zones,
      charges: charges || [],
      status,
      assignedTo,
      targetCountry,
      purchaseRateId // <--- 2. ADD THIS: Pass it to Mongoose
    })

    await newRate.save()
    return NextResponse.json(newRate, { status: 201 })

  } catch (error) {
    console.error("Error creating rate:", error)
    
    if (error.name === "ValidationError") {
      return NextResponse.json({ 
        message: "Database Validation Failed", 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ message: "Failed to create rate.", error: error.message }, { status: 500 })
  }
}