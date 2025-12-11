import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate";

export async function GET(req) { 
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const rateCategory = searchParams.get("rateCategory") || "sales"; // 'purchase', 'sales', or 'all'

    const userType = req.headers.get("userType");
    const userId = req.headers.get("userId");
    console.log(`[API/SERVICES] Request from userType: ${userType}, userId: ${userId}, rateCategory: ${rateCategory}`);

    let query = {};

    // Build base query for rate category
    if (rateCategory === "purchase") {
      query.rateCategory = "purchase";
    } else if (rateCategory === "sales") {
      query.rateCategory = "sales";
    }
    // If 'all', don't filter by rateCategory

    // Build visibility query based on userType
    if (userType === "admin" || userType === "branch") {
      // Admins and Branches can see all rates (no additional filter)
      console.log("[API/SERVICES] User is Admin/Branch: fetching all rates.");
    } else if (userType === "franchise" || userType === "client") {
      if (!userId) {
        return NextResponse.json(
          { message: "User ID is required for franchise/client access" },
          { status: 400 }
        );
      }
      
      console.log(`[API/SERVICES] User is Franchise/Client (${userId}): fetching accessible rates.`);
      
      // For non-admin users, filter by visibility
      // They can see 'live' rates OR 'unlisted' rates assigned to them
      // Purchase rates are always hidden for non-admin users
      if (rateCategory === "purchase") {
        // Non-admin users cannot see purchase rates
        return NextResponse.json([]);
      }
      
      query.$and = [
        { rateCategory: "sales" }, // Only sales rates for non-admin
        {
          $or: [
            { status: 'live' },
            { status: 'unlisted', assignedTo: userId }
          ]
        }
      ];
    } else {
      // Public/unknown users - only show live sales rates
      console.log("[API/SERVICES] User is public/unknown: fetching only live sales rates.");
      query.rateCategory = "sales";
      query.status = "live";
    }

    // Execute the query - select relevant fields
    const rates = await Rate.find(query).select({ 
      originalName: 1, 
      service: 1,
      vendorName: 1,
      rateCategory: 1,
      status: 1
    });

    // Build unique services with category info
    const servicesMap = new Map();
    rates.forEach((rate) => {
      if (rate.originalName) {
        const key = `${rate.originalName}-${rate.rateCategory}`;
        if (!servicesMap.has(key)) {
          servicesMap.set(key, {
            originalName: rate.originalName,
            service: rate.service,
            vendorName: rate.vendorName,
            rateCategory: rate.rateCategory,
            status: rate.status
          });
        }
      }
    });

    // Convert to array and sort
    const services = Array.from(servicesMap.values()).sort((a, b) => 
      a.originalName.localeCompare(b.originalName)
    );

    return NextResponse.json(services);

  } catch (error) {
    console.error("Error in GET /api/services:", error);
    return NextResponse.json(
      { message: "An internal server error occurred" },
      { status: 500 }
    );
  }
}