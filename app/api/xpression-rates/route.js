/**
 * GET/POST /api/xpression-rates
 * Fetches rates from Xpression API (Admin-only)
 * Supports multiple Xpression-based systems: WorldFirst, Atlantic, etc.
 */

import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import VendorIntegration from "@/models/VendorIntegration";
import { XpressionRateFetcher } from "@/lib/xpression-rate-fetcher";
import iso from "iso-3166-1-alpha-2";

async function handleRequest(req) {
  try {
    // Check if user is admin or branch
    const userType = req.headers.get("userType") || req.headers.get("usertype") || "";
    
    if (userType !== "admin" && userType !== "branch") {
      return NextResponse.json(
        { error: "Only admins can access Xpression rates" },
        { status: 403 }
      );
    }

    await connectToDB();

    // Extract parameters from query string or body
    let params_data;
    if (req.method === "GET") {
      const url = new URL(req.url);
      params_data = Object.fromEntries(url.searchParams);
    } else {
      params_data = await req.json();
    }

    let {
      vendorId,
      originCode,
      destinationCode,
      destination,
      weight,
      volWeight = "0",
      vendorCode = "",
      productCode = "",
      serviceType = "",
      toPinCode,
    } = params_data;

    if (!vendorId || !originCode || !destinationCode || !weight) {
      return NextResponse.json(
        {
          error: "Missing required fields: vendorId, originCode, destinationCode, weight",
        },
        { status: 400 }
      );
    }

    // Get vendor integration from database
    const vendor = await VendorIntegration.findById(vendorId);

    if (!vendor) {
      return NextResponse.json(
        { error: `Vendor not found: ${vendorId}` },
        { status: 404 }
      );
    }

    if (vendor.softwareType !== "xpression") {
      return NextResponse.json(
        { error: `Invalid software type: ${vendor.softwareType}` },
        { status: 400 }
      );
    }

    if (!vendor.isActive) {
      return NextResponse.json(
        { error: `Vendor is not active: ${vendor.vendorName}` },
        { status: 400 }
      );
    }

    originCode =
      vendor.xpressionCredentials?.originCode ||
      vendor.xpressionCredentials?.originName ||
      originCode;

    destination = destination || destinationCode;
    destinationCode =
      String(destinationCode).length === 2
        ? String(destinationCode).toUpperCase()
        : iso.getCode(destination) || iso.getCode(destinationCode) || destinationCode;

    console.log(
      `[Xpression] Fetching rates for ${vendor.vendorName}: ${originCode} → ${destinationCode}, ${weight}kg`
    );

    // Initialize rate fetcher
    const fetcher = new XpressionRateFetcher(vendorId);
    await fetcher.initialize();

    // Check and refresh session if needed
    if (!fetcher.isSessionValid()) {
      console.log(
        `[Xpression] Session invalid for ${vendor.vendorName}, authenticating...`
      );
      await fetcher.authenticate();
    }

    // Fetch rates
    const rates = await fetcher.fetchRates({
      originCode,
      destinationCode,
      destination: destination || destinationCode,
      weight: parseFloat(weight),
      volWeight: parseFloat(volWeight),
      vendorCode,
      productCode,
      serviceType,
      toPinCode,
    });

    // Update usage stats
    vendor.lastUsedAt = new Date();
    vendor.usageCount = (vendor.usageCount || 0) + 1;
    await vendor.save();

    return NextResponse.json({
      success: true,
      vendor: vendor.vendorName,
      data: rates,
    });
  } catch (error) {
    console.error("[Xpression] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch Xpression rates",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Export both GET and POST handlers
export async function GET(req) {
  return handleRequest(req);
}

export async function POST(req) {
  return handleRequest(req);
}
