/**
 * GET/POST /api/itd-rates
 * Fetches purchase rates from ITD-based vendor integrations.
 */

import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import VendorIntegration from "@/models/VendorIntegration";
import { ITDRateFetcher } from "@/lib/itd-rate-fetcher";
import iso from "iso-3166-1-alpha-2";

async function handleRequest(req) {
  try {
    const userType = req.headers.get("userType") || req.headers.get("usertype") || "";

    if (userType !== "admin" && userType !== "branch") {
      return NextResponse.json(
        { error: "Only admins and branches can access ITD rates" },
        { status: 403 }
      );
    }

    await connectToDB();

    let params;
    if (req.method === "GET") {
      const url = new URL(req.url);
      params = Object.fromEntries(url.searchParams);
    } else {
      params = await req.json();
    }

    let {
      vendorId,
      originCode = "IN",
      destinationCode,
      destination,
      weight,
      pcs = 1,
      productCode = "",
      bookingDate = "",
    } = params;

    if (!vendorId || !destinationCode || !weight) {
      return NextResponse.json(
        { error: "Missing required fields: vendorId, destinationCode, weight" },
        { status: 400 }
      );
    }

    const vendor = await VendorIntegration.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ error: `Vendor not found: ${vendorId}` }, { status: 404 });
    }

    if (vendor.softwareType !== "itd") {
      return NextResponse.json(
        { error: `Invalid software type: ${vendor.softwareType}` },
        { status: 400 }
      );
    }

    destination = destination || destinationCode;
    destinationCode =
      String(destinationCode).length === 2
        ? String(destinationCode).toUpperCase()
        : iso.getCode(destination) || iso.getCode(destinationCode) || destinationCode;

    const fetcher = new ITDRateFetcher(vendor);
    await fetcher.initialize();

    const rates = await fetcher.fetchRates({
      originCode,
      destinationCode,
      destination,
      weight: Number.parseFloat(weight),
      pcs,
      productCode,
      bookingDate,
    });

    vendor.lastUsedAt = new Date();
    vendor.usageCount = (vendor.usageCount || 0) + 1;
    await vendor.save();

    return NextResponse.json({
      success: true,
      vendor: vendor.vendorName,
      data: rates,
    });
  } catch (error) {
    console.error("[ITD] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch ITD rates",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  return handleRequest(req);
}

export async function POST(req) {
  return handleRequest(req);
}
