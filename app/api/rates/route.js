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
    
    // DEBUG: Log the incoming body to see exactly what is being sent
    console.log("Incoming POST Body:", body)

    // Destructure all fields. 
    // note: Added fields seen in your previous code (vendorName, rateCategory, rateMode)
    const {
      vendorName,    // Likely required by your Schema
      rateCategory,  // Likely required (Purchase/Sales)
      rateMode,      // Likely required
      type,
      service,
      originalName,
      rates,
      zones,
      charges, 
      status,
      assignedTo,
      targetCountry
    } = body

    // 1. IMPROVED MANUAL VALIDATION
    // Check which specific field is missing to give a helpful error message
    const requiredFields = ['service', 'originalName', 'rates', 'zones', 'status'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      console.error("Missing fields:", missingFields);
      return NextResponse.json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 })
    }

    // 2. CREATE DATABASE ENTRY
    // We pass the individual fields explicitly to ensure everything is captured
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
      targetCountry
    })

    await newRate.save()

    return NextResponse.json(newRate, { status: 201 })

  } catch (error) {
    console.error("Error creating rate:", error)
    
    // 3. HANDLE MONGOOSE VALIDATION ERRORS
    if (error.name === "ValidationError") {
      // Return the specific Mongoose validation errors
      return NextResponse.json({ 
        message: "Database Validation Failed", 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ message: "Failed to create rate.", error: error.message }, { status: 500 })
  }
}