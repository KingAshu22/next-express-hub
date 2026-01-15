import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Rate from "@/models/Rate";

export async function GET(req) { 
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const rateCategory = searchParams.get("rateCategory") || "sales";
    const country = searchParams.get("country");
    const zipCode = searchParams.get("zipCode");

    // Handle case-insensitive headers
    const userType = req.headers.get("userType") || req.headers.get("usertype") || "";
    const userId = req.headers.get("userId") || req.headers.get("userid") || "";
    
    console.log(`[API/SERVICES] ====== REQUEST START ======`);
    console.log(`[API/SERVICES] userType: "${userType}", userId: "${userId}", rateCategory: "${rateCategory}"`);
    console.log(`[API/SERVICES] country: "${country}", zipCode: "${zipCode}"`);

    // Debug: Check database contents
    const totalDocs = await Rate.countDocuments({});
    console.log(`[API/SERVICES] Total documents in Rate collection: ${totalDocs}`);

    if (totalDocs === 0) {
      console.log("[API/SERVICES] WARNING: No documents in Rate collection!");
      return NextResponse.json([]);
    }

    // Debug: Show available categories
    const availableCategories = await Rate.distinct("rateCategory");
    const availableStatuses = await Rate.distinct("status");
    console.log(`[API/SERVICES] Available categories: ${JSON.stringify(availableCategories)}`);
    console.log(`[API/SERVICES] Available statuses: ${JSON.stringify(availableStatuses)}`);

    let query = {};

    // Determine if user is admin or branch
    const isAdminOrBranch = userType === "admin" || userType === "branch";

    if (isAdminOrBranch) {
      // Admins and Branches can see ALL rates regardless of status (including hidden)
      console.log("[API/SERVICES] User is Admin/Branch: fetching ALL rates (no status filter)");
      
      if (rateCategory === "purchase") {
        query.rateCategory = "purchase";
      } else if (rateCategory === "sales") {
        query.rateCategory = "sales";
      }
      // If 'all', no rateCategory filter - fetch everything
      
    } else if (userType === "franchise" || userType === "client") {
      console.log(`[API/SERVICES] User is Franchise/Client: applying visibility filters`);
      
      // Non-admin users cannot see purchase rates at all
      if (rateCategory === "purchase") {
        console.log("[API/SERVICES] Non-admin requesting purchase rates - returning empty");
        return NextResponse.json([]);
      }
      
      // For sales rates, they can see 'live' or 'unlisted' if assigned to them
      if (userId) {
        query = {
          rateCategory: "sales",
          $or: [
            { status: "live" },
            { status: "unlisted", assignedTo: userId }
          ]
        };
      } else {
        query = {
          rateCategory: "sales",
          status: "live"
        };
      }
      
    } else {
      // Unknown/public users OR empty userType - check if we should treat as admin for testing
      console.log(`[API/SERVICES] Unknown userType: "${userType}"`);
      
      // For development/testing: if no userType, treat as admin to show all rates
      // In production, you might want to change this to only show live sales rates
      if (!userType) {
        console.log("[API/SERVICES] No userType provided - treating as admin for testing");
        if (rateCategory === "purchase") {
          query.rateCategory = "purchase";
        } else if (rateCategory === "sales") {
          query.rateCategory = "sales";
        }
      } else {
        // Some other userType - only show live sales rates
        query.rateCategory = "sales";
        query.status = "live";
      }
    }

    console.log(`[API/SERVICES] Final query: ${JSON.stringify(query)}`);

    // Execute the query - include additional fields for filtering
    const rates = await Rate.find(query).select({ 
      originalName: 1, 
      service: 1,
      vendorName: 1,
      rateCategory: 1,
      status: 1,
      rateMode: 1,
      targetCountry: 1,
      zones: 1,
      postalZones: 1,
      type: 1
    }).lean();

    console.log(`[API/SERVICES] Query returned ${rates.length} documents`);

    if (rates.length === 0) {
      // Debug: Try fetching all documents to see what's there
      const sampleRates = await Rate.find({}).select({
        originalName: 1,
        rateCategory: 1,
        status: 1
      }).limit(5).lean();
      console.log(`[API/SERVICES] Sample of all rates:`, sampleRates);
    }

    // Filter rates based on country and ZIP code availability
    let filteredRates = rates;
    
    if (country) {
      console.log(`[API/SERVICES] Filtering by country: "${country}", zipCode: "${zipCode}"`);
      
      filteredRates = rates.filter(rate => {
        const rateMode = rate.rateMode || 'multi-country';
        
        if (rateMode === 'single-country-zip') {
          // For ZIP-based rates:
          // 1. Must match target country
          if (rate.targetCountry?.toLowerCase() !== country.toLowerCase()) {
            console.log(`[API/SERVICES] Skipping ${rate.originalName} - target country mismatch (${rate.targetCountry} vs ${country})`);
            return false;
          }
          
          // 2. Only include if ZIP code is provided
          if (!zipCode) {
            console.log(`[API/SERVICES] Skipping ${rate.originalName} - ZIP required but not provided`);
            return false;
          }
          
          // 3. Check if ZIP code exists in postal zones
          const hasMatchingZip = (rate.postalZones || []).some(pz => {
            // Exact match
            if (pz.zipCode && pz.zipCode === zipCode) {
              return true;
            }
            
            // Range match
            if (pz.zipFrom && pz.zipTo) {
              // Try numeric comparison first
              const zipNum = parseInt(zipCode.replace(/\D/g, ""), 10);
              const fromNum = parseInt(String(pz.zipFrom).replace(/\D/g, ""), 10);
              const toNum = parseInt(String(pz.zipTo).replace(/\D/g, ""), 10);
              
              if (!isNaN(zipNum) && !isNaN(fromNum) && !isNaN(toNum)) {
                return zipNum >= fromNum && zipNum <= toNum;
              }
              
              // Fallback to string comparison for alphanumeric codes
              return zipCode >= pz.zipFrom && zipCode <= pz.zipTo;
            }
            
            return false;
          });
          
          if (!hasMatchingZip) {
            console.log(`[API/SERVICES] Skipping ${rate.originalName} - ZIP ${zipCode} not found in postal zones`);
          }
          
          return hasMatchingZip;
          
        } else {
          // For multi-country rates, check if country exists in zones
          const hasCountry = (rate.zones || []).some(zone => 
            (zone.countries || []).some(c => 
              c.toLowerCase() === country.toLowerCase()
            )
          );
          
          if (!hasCountry) {
            console.log(`[API/SERVICES] Skipping ${rate.originalName} - country ${country} not found in zones`);
          }
          
          return hasCountry;
        }
      });
      
      console.log(`[API/SERVICES] After country/ZIP filtering: ${filteredRates.length} rates remaining`);
    }

    // Build unique services with category info
    const servicesMap = new Map();
    filteredRates.forEach((rate) => {
      if (rate.originalName) {
        const key = `${rate.originalName}-${rate.rateCategory}`;
        if (!servicesMap.has(key)) {
          servicesMap.set(key, {
            _id: rate._id,
            originalName: rate.originalName,
            service: rate.service || rate.originalName,
            vendorName: rate.vendorName || "",
            rateCategory: rate.rateCategory,
            status: rate.status,
            rateMode: rate.rateMode || 'multi-country',
            targetCountry: rate.targetCountry || null,
            type: rate.type || ""
          });
        }
      }
    });

    // Convert to array and sort
    const services = Array.from(servicesMap.values()).sort((a, b) => 
      (a.originalName || "").localeCompare(b.originalName || "")
    );

    console.log(`[API/SERVICES] Returning ${services.length} unique services`);
    
    // Log summary of rate modes
    const multiCountryCount = services.filter(s => s.rateMode === 'multi-country').length;
    const zipBasedCount = services.filter(s => s.rateMode === 'single-country-zip').length;
    console.log(`[API/SERVICES] Multi-country: ${multiCountryCount}, ZIP-based: ${zipBasedCount}`);
    
    console.log(`[API/SERVICES] ====== REQUEST END ======\n`);

    return NextResponse.json(services);

  } catch (error) {
    console.error("[API/SERVICES] Error:", error);
    return NextResponse.json(
      { message: "An internal server error occurred", error: error.message },
      { status: 500 }
    );
  }
}