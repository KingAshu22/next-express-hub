// app/api/tracking/route.js

import { connectToDB } from "@/app/_utils/mongodb";
import Client from "@/models/Client";
import Franchise from "@/models/Franchise";
import { NextResponse } from "next/server";
import { getEventDescription } from "@/lib/m5-event-codes";
import Awb from "@/models/Awb";

// ==================== CORS CONFIGURATION ====================

// Option 1: Allow ALL domains (Open API)
const ALLOWED_ORIGINS = "*";

// Option 2: Allow specific domains only (More Secure)
// const ALLOWED_ORIGINS = [
//   "https://client-website.com",
//   "https://another-client.com",
//   "http://localhost:3000",
//   "http://localhost:5173",
// ];

// CORS Headers Helper Function
function getCorsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  
  // If allowing all origins
  if (ALLOWED_ORIGINS === "*") {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400", // 24 hours cache for preflight
    };
  }
  
  // If allowing specific origins
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

// Create Response with CORS Headers
function createCorsResponse(data, status, request) {
  const corsHeaders = getCorsHeaders(request);
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  });
}

// ==================== OPTIONS HANDLER (Preflight Request) ====================

export async function OPTIONS(request) {
  const corsHeaders = getCorsHeaders(request);
  
  return new NextResponse(null, {
    status: 204, // No Content
    headers: corsHeaders,
  });
}

// ==================== HELPER FUNCTIONS ====================

const parseTime12Hour = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 };
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return { hours: 0, minutes: 0 };
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  else if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
};

const parseOrdinalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanedDate = dateStr.replace(/(\d+)(st|nd|rd|th)/i, "$1");
  const parsed = new Date(cleanedDate);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
};

const parseInternalDate = (dateInput) => {
  if (!dateInput) return 0;
  const directDate = new Date(dateInput);
  if (!isNaN(directDate.getTime())) return directDate.getTime();

  const parts = String(dateInput).match(
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const year = parseInt(parts[3], 10);
    const hour = parts[4] ? parseInt(parts[4], 10) : 0;
    const min = parts[5] ? parseInt(parts[5], 10) : 0;
    const sec = parts[6] ? parseInt(parts[6], 10) : 0;
    return new Date(year, month, day, hour, min, sec).getTime();
  }
  return 0;
};

const parseEventTimestamp = (event, isM5, isCJ) => {
  try {
    if (isCJ) {
      const dateStr = event.EventDate1 || event.EventDate;
      const timeStr = event.EventTime1 || event.EventTime || "12:00 AM";
      const parsedDate = parseOrdinalDate(dateStr) || new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        const { hours, minutes } = parseTime12Hour(timeStr);
        parsedDate.setHours(hours, minutes, 0, 0);
        return parsedDate.getTime();
      }
      return 0;
    }

    if (isM5) {
      const dateStr = event.EventDate.split("T")[0];
      const timeStr = event.EventTime || "00:00:00";
      return new Date(`${dateStr}T${timeStr}`).getTime();
    }

    return parseInternalDate(event.timestamp);
  } catch (error) {
    console.error("Date parsing error:", error);
    return 0;
  }
};

const formatDisplayTime = (timestamp) => {
  if (!timestamp || timestamp === 0) return "N/A";
  return new Date(timestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ==================== VENDOR API CALLS ====================

async function fetchM5TrackingData(cNoteNumber) {
  try {
    const response = await fetch(
      "http://apiv2.m5clogs.com/api/Track/GetTrackings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ValidateAccount: [
            {
              AccountCode: process.env.NEXT_PUBLIC_ACCOUNT_CODE,
              Username: process.env.NEXT_PUBLIC_USERNAME,
              Password: process.env.NEXT_PUBLIC_PASSWORD,
              AccessKey: process.env.NEXT_PUBLIC_ACCESS_KEY,
            },
          ],
          Awbno: cNoteNumber,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`M5 API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data[0]?.messages?.[0]?.Response !== "1") {
      throw new Error(
        data[0]?.messages?.[0]?.ErrorDescription ||
          "Failed to fetch M5 tracking details"
      );
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

async function fetchCourierJourneyData(cNoteNumber) {
  try {
    const response = await fetch(
      "http://courierjourney.xpresion.in/api/v1/Tracking/Tracking",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          UserID: "CJEH065",
          Password: "CJEH@065",
          AWBNo: cNoteNumber,
          Type: "A",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`CJ API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data?.Response || data.Response?.ErrorCode !== "0") {
      throw new Error(
        data?.Response?.ErrorDisc ||
          "Failed to fetch Courier Journey tracking details"
      );
    }

    return { success: true, data: data.Response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ==================== MERGE TIMELINE FUNCTION ====================

function mergeTrackingTimeline(parcelDetails, m5Data, cjData) {
  const allEvents = [];

  const normalize = (evt, isM5, isCJ) => {
    const timestamp = parseEventTimestamp(evt, isM5, isCJ);
    let status, location, comment;

    if (isCJ) {
      status = evt.Status;
      location = evt.Location;
    } else if (isM5) {
      status = getEventDescription(evt.EventCode, evt.EventDescription);
      location = evt.Location;
    } else {
      status = evt.status;
      comment = evt.comment;
      location = evt.location;
    }

    return {
      timestamp,
      status: status?.trim() || "Update",
      location: location?.trim() || null,
      comment: comment || null,
      formattedTime: formatDisplayTime(timestamp),
    };
  };

  // Vendor Events
  if (m5Data?.Event) {
    m5Data.Event.forEach((e) => allEvents.push(normalize(e, true, false)));
  }
  if (cjData?.Events) {
    cjData.Events.forEach((e) => allEvents.push(normalize(e, false, true)));
  }

  // Internal Events
  if (parcelDetails?.parcelStatus) {
    parcelDetails.parcelStatus.forEach((e) =>
      allEvents.push(normalize(e, false, false))
    );
  }

  // Sort Descending (Newest First)
  allEvents.sort((a, b) => b.timestamp - a.timestamp);

  // Deduplicate
  const deduped = allEvents.filter((event, index, arr) => {
    if (index === 0) return true;
    const prev = arr[index - 1];
    const isSameStatus =
      event.status.toLowerCase() === prev.status.toLowerCase();
    const isTimeClose = Math.abs(event.timestamp - prev.timestamp) < 60000;
    return !(isSameStatus && isTimeClose);
  });

  return deduped;
}

// ==================== MAIN API HANDLER (POST) ====================

export async function POST(request) {
  try {
    const { email, password, trackingNumber, userType } = await request.json();

    // Validate required fields
    if (!email || !password || !trackingNumber) {
      return createCorsResponse(
        {
          success: false,
          error: "Missing required fields: email, password, trackingNumber",
        },
        400,
        request
      );
    }

    await connectToDB();

    // ==================== AUTHENTICATE USER ====================
    let user = null;
    const type = userType || "client";

    if (type === "client") {
      user = await Client.findOne({ email }).select("+password");
    } else if (type === "franchise") {
      user = await Franchise.findOne({ email });
    } else {
      return createCorsResponse(
        {
          success: false,
          error: "Invalid userType. Must be 'client' or 'franchise'",
        },
        400,
        request
      );
    }

    if (!user) {
      return createCorsResponse(
        { success: false, error: "Invalid credentials" },
        401,
        request
      );
    }

    if (user.password !== password) {
      return createCorsResponse(
        { success: false, error: "Invalid credentials" },
        401,
        request
      );
    }

    // ==================== FETCH PARCEL DETAILS ====================
    const parcelDetails = await Awb.findOne({ trackingNumber });

    if (!parcelDetails) {
      return createCorsResponse(
        { success: false, error: "Tracking number not found" },
        404,
        request
      );
    }

    // ==================== FETCH VENDOR TRACKING DATA ====================
    let m5Data = null;
    let cjData = null;
    let vendorError = null;

    if (parcelDetails.cNoteVendorName === "M5" && parcelDetails.cNoteNumber) {
      const result = await fetchM5TrackingData(parcelDetails.cNoteNumber);
      if (result.success) {
        m5Data = result.data;
      } else {
        vendorError = result.error;
      }
    }

    if (
      parcelDetails.cNoteVendorName === "Courier Journey" &&
      parcelDetails.cNoteNumber
    ) {
      const result = await fetchCourierJourneyData(parcelDetails.cNoteNumber);
      if (result.success) {
        cjData = result.data;
      } else {
        vendorError = result.error;
      }
    }

    // ==================== MERGE TIMELINE ====================
    const timeline = mergeTrackingTimeline(parcelDetails, m5Data, cjData);

    // ==================== BUILD RESPONSE ====================
    const trackingData = m5Data?.trackDetails?.[0] || cjData?.Tracking?.[0];

    const response = {
      success: true,
      data: {
        trackingNumber: parcelDetails.trackingNumber,
        currentStatus: timeline[0]?.status || "Unknown",
        lastUpdate: timeline[0]?.formattedTime || "N/A",
        origin:
          trackingData?.Origin ||
          parcelDetails?.sender?.country ||
          parcelDetails?.origin ||
          "N/A",
        destination:
          trackingData?.Destination ||
          parcelDetails?.receiver?.country ||
          parcelDetails?.destination ||
          "N/A",
        sender: {
          name: parcelDetails?.sender?.name || "N/A",
          address: parcelDetails?.sender?.address || "N/A",
          country: parcelDetails?.sender?.country || "N/A",
        },
        receiver: {
          name: parcelDetails?.receiver?.name || "N/A",
          address: parcelDetails?.receiver?.address || "N/A",
          country: parcelDetails?.receiver?.country || "N/A",
        },
        forwardingNumber: parcelDetails?.forwardingNumber || null,
        forwardingLink: parcelDetails?.forwardingLink || null,
        timeline: timeline.map((event) => ({
          status: event.status,
          timestamp: event.formattedTime,
          location: event.location,
          comment: event.comment,
        })),
      },
    };

    if (vendorError) {
      response.warning = `Vendor tracking fetch failed: ${vendorError}`;
    }

    return createCorsResponse(response, 200, request);
  } catch (error) {
    console.error("Tracking API Error:", error);
    return createCorsResponse(
      {
        success: false,
        error: "Internal server error",
      },
      500,
      request
    );
  }
}

// ==================== GET METHOD FOR API INFO ====================

export async function GET(request) {
  const response = {
    api: "Tracking API",
    version: "1.0",
    cors: "Enabled - Accessible from any domain",
    endpoints: {
      POST: {
        description: "Get tracking details for a parcel",
        authentication: "Required (email + password)",
        body: {
          email: "string (required) - Your registered email",
          password: "string (required) - Your password",
          trackingNumber:
            "string (required) - The tracking number to look up",
          userType:
            "string (optional) - 'client' or 'franchise' (default: 'client')",
        },
        response: {
          success: "boolean",
          data: {
            trackingNumber: "string",
            currentStatus: "string",
            lastUpdate: "string",
            origin: "string",
            destination: "string",
            sender: "object",
            receiver: "object",
            forwardingNumber: "string | null",
            forwardingLink: "string | null",
            timeline: "array of tracking events",
          },
        },
      },
    },
  };

  return createCorsResponse(response, 200, request);
}