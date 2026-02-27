// app/api/vendor-integrations/tracking/forwarding/route.js

import {carriers} from "@/app/constants/carriers";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// ============================================
// CARRIER CODE MAPPING HELPERS
// Using imported carriers list from constants
// ============================================

/**
 * Common carrier name aliases for better matching
 */
const CARRIER_ALIASES = {
  // UPS variations
  ups: ["ups", "united parcel service", "ups ground", "ups express", "ups worldwide"],
  // FedEx variations
  fedex: ["fedex", "federal express", "fedex ground", "fedex express", "fedex home"],
  // DHL variations
  dhl: ["dhl", "dhl express", "dhl ecommerce", "dhl global", "dhl parcel"],
  // USPS variations
  usps: ["usps", "us postal", "united states postal", "us post"],
  // India carriers
  bluedart: ["bluedart", "blue dart"],
  delhivery: ["delhivery"],
  dtdc: ["dtdc"],
  ecom: ["ecom express", "ecom"],
  xpressbees: ["xpressbees", "xpress bees"],
  // Australia carriers
  couriersplease: ["couriersplease", "couriers please", "couriers-please", "cp australia"],  // <-- ADD THIS
  // Other major carriers
  aramex: ["aramex"],
  tnt: ["tnt", "tnt express"],
  dpd: ["dpd"],
  gls: ["gls"],
  "canada post": ["canada post", "postes canada"],
  "australia post": ["australia post", "auspost"],
  "royal mail": ["royal mail"],
  "china post": ["china post", "china ems"],
  "singapore post": ["singapore post", "singpost"],
  "japan post": ["japan post"],
  "india post": ["india post", "speed post"],
  sf: ["sf express", "sf", "shunfeng"],
  yto: ["yto", "yto express"],
  zto: ["zto", "zto express"],
  sto: ["sto", "sto express"],
  yunda: ["yunda", "yunda express"],
  cainiao: ["cainiao"],
  yanwen: ["yanwen"],
  "4px": ["4px", "4px express"],
};

/**
 * Priority carrier codes for common carriers
 * These are used when multiple matches are found
 * NOTE: Keys must be lowercase to match the alias lookup
 */
const PRIORITY_CARRIERS = {
  ups: 100003,
  fedex: 100001,
  dhl: 100002,
  usps: 100004,
  tnt: 100006,
  dpd: 100007,
  "royal mail": 100008,
  gls: 100009,
  aramex: 100020,
  "canada post": 100005,
  "australia post": 1151,
  couriersplease: 100122,  // <-- CHANGE THIS (lowercase key)
};

/**
 * Get carrier code from carrier name
 * Uses the imported carriers list for matching
 */
function getCarrierCode(carrierInput) {
  if (!carrierInput) return undefined;
  
  const normalizedInput = carrierInput.toLowerCase().trim();

  // 1. Check if input is already a carrier code (number)
  if (!isNaN(carrierInput)) {
    const code = parseInt(carrierInput, 10);
    const exists = carriers.find((c) => c.key === code);
    if (exists) return code;
  }

  // 2. Check priority carriers first (exact alias match)
  for (const [carrierKey, aliases] of Object.entries(CARRIER_ALIASES)) {
    if (aliases.some((alias) => normalizedInput === alias || normalizedInput.includes(alias))) {
      if (PRIORITY_CARRIERS[carrierKey]) {
        return PRIORITY_CARRIERS[carrierKey];
      }
    }
  }

  // 3. Exact name match in carriers list (case-insensitive)
  const exactMatch = carriers.find(
    (c) => c.name.toLowerCase() === normalizedInput
  );
  if (exactMatch) return exactMatch.key;

  // 4. Partial name match in carriers list
  const partialMatch = carriers.find((c) =>
    c.name.toLowerCase().includes(normalizedInput) ||
    normalizedInput.includes(c.name.toLowerCase())
  );
  if (partialMatch) return partialMatch.key;

  // 5. URL-based matching (improved regex)
  const urlMatch = carriers.find((c) => {
    if (!c.url) return false;
    const urlLower = c.url.toLowerCase();
    // Extract domain name from URL
    const domainMatch = urlLower.match(/(?:https?:\/\/)?(?:www\.)?([^\/\.]+)/i);
    const domain = domainMatch ? domainMatch[1] : '';
    return domain && (domain.includes(normalizedInput) || normalizedInput.includes(domain));
  });
  if (urlMatch) return urlMatch.key;

  // 6. Word-based matching (match any word in carrier name)
  const inputWords = normalizedInput.split(/[\s\-_]+/);
  const wordMatch = carriers.find((c) => {
    const carrierWords = c.name.toLowerCase().split(/[\s\-_]+/);
    return inputWords.some((word) =>
      word.length > 2 && carrierWords.some((cw) => cw.includes(word) || word.includes(cw))
    );
  });
  if (wordMatch) return wordMatch.key;

  return undefined;
}

/**
 * Get carrier info from carrier code
 */
function getCarrierInfo(carrierCode) {
  if (!carrierCode) return null;
  return carriers.find((c) => c.key === carrierCode) || null;
}

/**
 * Get carrier name from carrier code
 */
function getCarrierName(carrierCode) {
  const carrier = getCarrierInfo(carrierCode);
  return carrier?.name || "Unknown Carrier";
}

/**
 * Get carrier URL from carrier code
 */
function getCarrierUrl(carrierCode) {
  const carrier = getCarrierInfo(carrierCode);
  return carrier?.url || null;
}

/**
 * Search carriers by name (for autocomplete/suggestions)
 */
function searchCarriers(query, limit = 10) {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();

  const matches = carriers.filter((c) =>
    c.name.toLowerCase().includes(normalizedQuery)
  );

  // Sort by relevance (exact start match first)
  matches.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(normalizedQuery);
    const bStarts = b.name.toLowerCase().startsWith(normalizedQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.localeCompare(b.name);
  });

  return matches.slice(0, limit);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date from ISO string to "DD Mon YYYY" format
 */
function formatEventDate(isoString) {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Format time from ISO string to "HH:MM" format
 */
function formatEventTime(isoString) {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

/**
 * Format estimated delivery date range
 */
function formatEstimatedDelivery(estimatedDeliveryDate) {
  if (!estimatedDeliveryDate) return null;

  const { from, to } = estimatedDeliveryDate;

  if (!from && !to) return null;

  try {
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      const fromFormatted = fromDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });

      const toFormatted = toDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      // If same day, return single date
      if (fromDate.toDateString() === toDate.toDateString()) {
        return toFormatted;
      }

      return `${fromFormatted} - ${toFormatted}`;
    }

    if (from) {
      return new Date(from).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    if (to) {
      return new Date(to).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Build location string from address object
 */
function buildLocationString(address, fallbackLocation) {
  if (!address && !fallbackLocation) return "";

  if (address) {
    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);

    if (parts.length > 0) {
      return parts.join(", ");
    }
  }

  return fallbackLocation || "";
}

/**
 * Map 17Track status to user-friendly status
 */
function mapStatus(stage, subStatus, description) {
  // If we have a good description, use it
  if (description && description.length > 3) {
    return description;
  }

  // Map stage to friendly status
  const stageMap = {
    InfoReceived: "Shipment Information Received",
    PickedUp: "Picked Up",
    InTransit: "In Transit",
    Departure: "Departed from Facility",
    Arrival: "Arrived at Facility",
    CustomsInProgress: "Customs Clearance In Progress",
    CustomsCleared: "Customs Cleared",
    AvailableForPickup: "Available for Pickup",
    OutForDelivery: "Out for Delivery",
    Delivered: "Delivered",
    DeliveryFailure: "Delivery Failed",
    Exception: "Exception",
    Expired: "Expired",
    Returning: "Returning to Sender",
    Returned: "Returned to Sender",
  };

  return stageMap[stage] || stageMap[subStatus] || stage || "Update";
}

// ============================================
// 17TRACK API FUNCTIONS
// ============================================

const API_BASE_URL = "https://api.17track.net/track/v2.4";

/**
 * Register a tracking number with 17Track
 */
async function registerTrackingNumber(trackingNumber, carrierCode) {
  const API_KEY = process.env.TRACK17_API_KEY;

  if (!API_KEY) {
    throw new Error("17Track API key not configured");
  }

  const payload = [
    {
      number: trackingNumber,
      ...(carrierCode && { carrier: carrierCode }),
    },
  ];

  console.log("[17Track] Registering tracking number:", trackingNumber, "carrier:", carrierCode);

  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "17token": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[17Track] Register API error:", response.status, errorText);
    throw new Error(`17Track API error: ${response.status}`);
  }

  const result = await response.json();

  console.log("[17Track] Register response:", JSON.stringify(result, null, 2));

  if (result.code !== 0) {
    throw new Error(
      result.data?.rejected?.[0]?.error?.message || "Failed to register tracking number"
    );
  }

  // Check if accepted
  if (result.data?.accepted?.length > 0) {
    const accepted = result.data.accepted[0];
    return {
      success: true,
      carrier: accepted.carrier,
      origin: accepted.origin,
      carrierInfo: getCarrierInfo(accepted.carrier),
    };
  }

  // Check if rejected
  if (result.data?.rejected?.length > 0) {
    const error = result.data.rejected[0].error;
    throw new Error(error?.message || "Tracking number rejected");
  }

  return { success: true };
}

/**
 * Get tracking information from 17Track
 */
async function getTrackingInfo(trackingNumber, carrierCode) {
  const API_KEY = process.env.TRACK17_API_KEY;

  if (!API_KEY) {
    throw new Error("17Track API key not configured");
  }

  const payload = [
    {
      number: trackingNumber,
      ...(carrierCode && { carrier: carrierCode }),
    },
  ];

  console.log("[17Track] Getting tracking info for:", trackingNumber, "carrier:", carrierCode);

  const response = await fetch(`${API_BASE_URL}/gettrackinfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "17token": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[17Track] GetTrackInfo API error:", response.status, errorText);
    throw new Error(`17Track API error: ${response.status}`);
  }

  const result = await response.json();

  if (result.code !== 0) {
    throw new Error("Failed to get tracking info");
  }

  return result;
}

/**
 * Parse 17Track response into our format
 */
function parseTrackingResponse(result, trackingNumber) {
  // Check if we have accepted data
  const accepted = result.data?.accepted?.[0];

  if (!accepted) {
    // Check for rejection reason
    const rejected = result.data?.rejected?.[0];
    if (rejected) {
      const errorCode = rejected.error?.code;
      const errorMessage = rejected.error?.message;

      // Check if it needs registration
      if (errorCode === -18019902 || errorMessage?.includes("does not register")) {
        return { needsRegistration: true };
      }

      throw new Error(errorMessage || "Tracking number not found");
    }

    return { noData: true };
  }

  const trackInfo = accepted.track_info;

  if (!trackInfo) {
    return { noData: true };
  }

  // Extract events from all providers
  const allEvents = [];
  const providers = trackInfo.tracking?.providers || [];

  providers.forEach((provider) => {
    const providerName = provider.provider?.name || "";
    const providerKey = provider.provider?.key;
    const events = provider.events || [];

    events.forEach((event) => {
      allEvents.push({
        date: formatEventDate(event.time_iso),
        time: formatEventTime(event.time_iso),
        timestamp: event.time_utc ? new Date(event.time_utc).getTime() : 0,
        status: mapStatus(event.stage, event.sub_status, event.description),
        location: buildLocationString(event.address, event.location),
        carrier: providerName,
        carrierKey: providerKey,
        rawDescription: event.description,
      });
    });
  });

  // Sort events by timestamp (newest first)
  allEvents.sort((a, b) => b.timestamp - a.timestamp);

  // Remove duplicates based on timestamp and status
  const uniqueEvents = allEvents.filter((event, index, arr) => {
    if (index === 0) return true;
    const prev = arr[index - 1];
    const isSameStatus = event.status.toLowerCase() === prev.status.toLowerCase();
    const isCloseTime = Math.abs(event.timestamp - prev.timestamp) < 60000; // 1 minute
    return !(isSameStatus && isCloseTime);
  });

  // Get shipping info
  const shippingInfo = trackInfo.shipping_info || {};
  const shipperAddress = shippingInfo.shipper_address || {};
  const recipientAddress = shippingInfo.recipient_address || {};

  // Get time metrics
  const timeMetrics = trackInfo.time_metrics || {};

  // Get misc info
  const miscInfo = trackInfo.misc_info || {};

  // Get latest status
  const latestStatus = trackInfo.latest_status || {};
  const latestEvent = trackInfo.latest_event || {};

  // Determine carrier info
  let primaryCarrier = null;
  let carrierName = "";
  let carrierKey = accepted.carrier;

  if (providers.length > 0) {
    carrierName = providers[0].provider?.name || "";
    carrierKey = providers[0].provider?.key || accepted.carrier;
  }

  if (miscInfo.local_provider) {
    carrierName = miscInfo.local_provider;
    carrierKey = miscInfo.local_key || carrierKey;
  }

  primaryCarrier = getCarrierInfo(carrierKey);

  // Build response
  return {
    success: true,
    source: "17track",
    trackingNumber: accepted.number || trackingNumber,
    carrier: carrierName || primaryCarrier?.name || getCarrierName(carrierKey) || "Unknown",
    carrierCode: carrierKey,
    carrierUrl: primaryCarrier?.url || getCarrierUrl(carrierKey),
    status: mapStatus(latestStatus.status, latestStatus.sub_status, latestEvent.description),
    estimatedDelivery: formatEstimatedDelivery(timeMetrics.estimated_delivery_date),
    to:
      buildLocationString(recipientAddress) ||
      recipientAddress.city ||
      recipientAddress.country ||
      null,
    from:
      buildLocationString(shipperAddress) ||
      shipperAddress.city ||
      shipperAddress.country ||
      null,
    shippingType: miscInfo.service_type || providers[0]?.service_type || null,
    daysInTransit: timeMetrics.days_of_transit?.toString() || null,
    daysAfterOrder: timeMetrics.days_after_order?.toString() || null,
    daysAfterLastUpdate: timeMetrics.days_after_last_update?.toString() || null,
    weight: miscInfo.weight_raw || null,
    pieces: miscInfo.pieces || null,
    dimensions: miscInfo.dimensions || null,
    events: uniqueEvents.map(({ timestamp, rawDescription, carrierKey, ...event }) => event),
    milestones: trackInfo.milestone || [],
    metadata: {
      crawledAt: new Date().toISOString(),
      eventsCount: uniqueEvents.length,
      source: "17track",
      lastSyncTime: providers[0]?.latest_sync_time || null,
      lastSyncStatus: providers[0]?.latest_sync_status || null,
      providersCount: providers.length,
    },
  };
}

// ============================================
// MAIN TRACKING FUNCTION
// ============================================

async function track17Track(trackingNumber, carrier = null) {
  const API_KEY = process.env.TRACK17_API_KEY;

  if (!API_KEY) {
    console.error("[17Track] API key not configured");
    return {
      success: false,
      error: "Tracking service not configured. Please contact support.",
      errorCode: "NO_API_KEY",
    };
  }

  const carrierCode = getCarrierCode(carrier);

  console.log("[17Track] Resolved carrier code:", carrier, "->", carrierCode);

  try {
    // Step 1: Try to get tracking info first
    console.log("[17Track] Attempting to get tracking info...");
    let result = await getTrackingInfo(trackingNumber, carrierCode);
    let parsed = parseTrackingResponse(result, trackingNumber);

    // Step 2: If needs registration, register and retry
    if (parsed.needsRegistration) {
      console.log("[17Track] Tracking number needs registration, registering...");

      try {
        const registerResult = await registerTrackingNumber(trackingNumber, carrierCode);
        console.log("[17Track] Registration successful:", registerResult);

        // Wait for tracking data to be fetched (17Track recommends waiting)
        console.log("[17Track] Waiting for tracking data to sync...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Retry getting tracking info
        console.log("[17Track] Retrying getTrackInfo after registration...");
        result = await getTrackingInfo(
          trackingNumber,
          registerResult.carrier || carrierCode
        );
        parsed = parseTrackingResponse(result, trackingNumber);

        // If still no data, it might take more time
        if (parsed.noData || parsed.needsRegistration) {
          return {
            success: false,
            trackingNumber,
            carrier: getCarrierName(registerResult.carrier || carrierCode),
            carrierCode: registerResult.carrier || carrierCode,
            carrierUrl: getCarrierUrl(registerResult.carrier || carrierCode),
            error: "Tracking data is being synced. Please try again in a few minutes.",
            errorCode: "SYNC_IN_PROGRESS",
            suggestion: "retry_later",
          };
        }
      } catch (registerError) {
        console.error("[17Track] Registration error:", registerError.message);
        return {
          success: false,
          trackingNumber,
          error: registerError.message || "Failed to register tracking number",
          errorCode: "REGISTRATION_FAILED",
        };
      }
    }

    // Step 3: Check if we got valid data
    if (parsed.noData) {
      return {
        success: false,
        trackingNumber,
        carrier: getCarrierName(carrierCode),
        carrierCode: carrierCode,
        carrierUrl: getCarrierUrl(carrierCode),
        error: "No tracking data available yet. The carrier may not have scanned the package.",
        errorCode: "NO_DATA",
        suggestion: "external_link",
      };
    }

    // Step 4: Check if we have events
    if (!parsed.events || parsed.events.length === 0) {
      return {
        success: false,
        trackingNumber,
        carrier: parsed.carrier,
        carrierCode: parsed.carrierCode,
        carrierUrl: parsed.carrierUrl,
        status: parsed.status || "Pending",
        error: "No tracking events available yet. Please check back later.",
        errorCode: "NO_EVENTS",
        suggestion: "retry_later",
      };
    }

    // Success!
    return parsed;
  } catch (error) {
    console.error("[17Track] Error:", error.message);

    return {
      success: false,
      trackingNumber,
      error: error.message || "Failed to fetch tracking data",
      errorCode: "API_ERROR",
      suggestion: "external_link",
    };
  }
}

// ============================================
// API ROUTE HANDLERS
// ============================================

export async function POST(request) {
  try {
    const body = await request.json();
    const { trackingNumber, carrier } = body;

    // Validate input
    if (!trackingNumber) {
      return Response.json(
        {
          success: false,
          error: "Tracking number is required",
          errorCode: "MISSING_TRACKING_NUMBER",
        },
        { status: 400 }
      );
    }

    // Clean tracking number (remove spaces, dashes for some carriers)
    const cleanTrackingNumber = trackingNumber.trim();

    // Validate tracking number format (basic validation)
    if (cleanTrackingNumber.length < 4) {
      return Response.json(
        {
          success: false,
          error: "Invalid tracking number format",
          errorCode: "INVALID_FORMAT",
        },
        { status: 400 }
      );
    }

    console.log(`[Forwarding API] Processing tracking request for: ${cleanTrackingNumber}, carrier: ${carrier}`);

    // Fetch tracking data from 17Track
    const result = await track17Track(cleanTrackingNumber, carrier);

    // Return appropriate status code
    const statusCode = result.success ? 200 : 202;

    return Response.json(result, { status: statusCode });
  } catch (error) {
    console.error("[Forwarding API] Unexpected error:", error);

    return Response.json(
      {
        success: false,
        error: "Internal server error. Please try again later.",
        errorCode: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get("trackingNumber");
    const carrier = searchParams.get("carrier");

    if (!trackingNumber) {
      return Response.json(
        {
          success: false,
          error: "Tracking number is required",
          errorCode: "MISSING_TRACKING_NUMBER",
        },
        { status: 400 }
      );
    }

    // Reuse POST logic
    return POST({
      json: async () => ({ trackingNumber, carrier }),
    });
  } catch (error) {
    console.error("[Forwarding API] GET error:", error);

    return Response.json(
      {
        success: false,
        error: "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// ============================================
// ADDITIONAL UTILITY ENDPOINTS
// ============================================

/**
 * Search carriers endpoint (optional - for autocomplete features)
 * GET /api/vendor-integrations/tracking/forwarding?action=search&q=ups
 */
export async function searchCarriersHandler(query) {
  const results = searchCarriers(query, 10);
  return Response.json({
    success: true,
    carriers: results,
    count: results.length,
  });
}