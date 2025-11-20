import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate";

// This is the GET handler for the /api/services endpoint
export async function GET(req) { 
  try {
    await connectToDB();

    // Read user details from request headers
    const userType = req.headers.get("userType");
    const userId = req.headers.get("userId");
    console.log(`[API/SERVICES] Request from userType: ${userType}, userId: ${userId}`);

    // Create a dynamic query object
    let query = {};

    // Build the query based on the userType and the new 'status'/'assignedTo' logic
    if (userType === "admin" || userType === "branch") {
      // Admins and Branches can see services from all rates.
      // The query remains empty to fetch all documents.
      console.log("[API/SERVICES] User is Admin/Branch: fetching all rates to determine services.");
      query = {}; // No filter
    } else if (userType === "franchise" || userType === "client") {
      // Franchise and Client users must have a userId
      if (!userId) {
        return NextResponse.json(
          { message: "User ID is required for franchise/client access" },
          { status: 400 }
        );
      }
      
      console.log(`[API/SERVICES] User is Franchise/Client (${userId}): fetching specific rates to determine services.`);
      // They can see services from rates that are 'live' OR rates that are 'unlisted' AND assigned to them.
      query = {
        $or: [
          // Condition 1: The rate is public for everyone.
          { status: 'live' },
          // Condition 2: The rate is unlisted, AND this user's ID is in the 'assignedTo' array.
          { status: 'unlisted', assignedTo: userId }
        ],
      };
    } else {
      // For any other user (or unauthenticated users), only show services from public 'live' rates.
      console.log("[API/SERVICES] User is public/unknown: fetching only live rates to determine services.");
      query = { status: 'live' };
    }

    // Execute the query.
    // **Optimization**: We only need the 'originalName' field to build the list of services.
    // This makes the database query much faster and more efficient.
    const rates = await Rate.find(query).select({ originalName: 1 });

    // Use a Set to get a unique list of service names (originalName).
    const uniqueServices = new Set(
      rates
        .map((rate) => rate.originalName) // Extract the 'originalName' from each document
        .filter(Boolean) // Filter out any null or empty strings
    );

    // Convert the Set back to an array and sort it alphabetically.
    const sortedServices = Array.from(uniqueServices).sort();

    // Return the final list of unique, sorted service names.
    return NextResponse.json(sortedServices);

  } catch (error) {
    console.error("Error in GET /api/services:", error);
    return NextResponse.json(
      { message: "An internal server error occurred" },
      { status: 500 }
    );
  }
}