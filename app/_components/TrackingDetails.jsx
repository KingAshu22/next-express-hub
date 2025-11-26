"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  Truck,
  Plane,
  Home,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Loader2,
  Barcode,
  MapPin,
  Clock,
  MessageSquare,
} from "lucide-react";
import { fetchM5Tracking } from "./FetchM5Tracking";
import { fetchCourierJourneyTracking } from "./FetchCourierJourneyTracking";
import { getEventDescription } from "@/lib/m5-event-codes";

// ------------------- HELPER FUNCTIONS -------------------

const getStatusIcon = (status) => {
  const statusLower = (status || "").toLowerCase();
  
  if (statusLower.includes("prepared") || statusLower.includes("received") || statusLower.includes("booked") || statusLower.includes("bagging"))
    return <Package className="w-6 h-6 text-blue-500" />;
  if (statusLower.includes("transit") || statusLower.includes("left") || statusLower.includes("dispatch") || statusLower.includes("departed") || statusLower.includes("sent to"))
    return <Truck className="w-6 h-6 text-orange-500" />;
  if (statusLower.includes("airport") || statusLower.includes("flight") || statusLower.includes("arrived"))
    return <Plane className="w-6 h-6 text-purple-500" />;
  if (statusLower.includes("delivered")) 
    return <Home className="w-6 h-6 text-green-500" />;
  if (statusLower.includes("custom") || statusLower.includes("clearance") || statusLower.includes("cleared"))
    return <CheckCircle className="w-6 h-6 text-teal-500" />;
  if (statusLower.includes("unsuccessful") || statusLower.includes("offload") || statusLower.includes("held"))
    return <AlertCircle className="w-6 h-6 text-red-500" />;
  return <CheckCircle className="w-6 h-6 text-gray-500" />;
};

const getStatusColor = (status) => {
  const statusLower = (status || "").toLowerCase();
  if (statusLower.includes("delivered")) return "bg-green-100 text-green-800";
  if (statusLower.includes("transit") || statusLower.includes("dispatch")) return "bg-blue-100 text-blue-800";
  if (statusLower.includes("custom") || statusLower.includes("clearance") || statusLower.includes("cleared")) return "bg-teal-100 text-teal-800";
  if (statusLower.includes("unsuccessful") || statusLower.includes("offload") || statusLower.includes("held")) return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

// ✅ 1. Parse "10:00 AM" to { hours, minutes }
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

// ✅ 2. Parse "24th November 2025" (Vendor format)
const parseOrdinalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanedDate = dateStr.replace(/(\d+)(st|nd|rd|th)/i, "$1"); // Remove 'th', 'st'
  const parsed = new Date(cleanedDate);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
};

// ✅ 3. Parse "25/11/2025" or ISO (Internal format)
const parseInternalDate = (dateInput) => {
  if (!dateInput) return 0;

  // If it's already a valid ISO string or timestamp number
  const directDate = new Date(dateInput);
  if (!isNaN(directDate.getTime())) return directDate.getTime();

  // Handle "DD/MM/YYYY" or "DD-MM-YYYY"
  // Matches 25/11/2025 or 25-11-2025 with optional time
  const parts = String(dateInput).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1; // Months are 0-indexed
    const year = parseInt(parts[3], 10);
    const hour = parts[4] ? parseInt(parts[4], 10) : 0;
    const min = parts[5] ? parseInt(parts[5], 10) : 0;
    const sec = parts[6] ? parseInt(parts[6], 10) : 0;
    
    return new Date(year, month, day, hour, min, sec).getTime();
  }
  
  return 0;
};

// ✅ 4. Unified Timestamp Parser
const parseEventTimestamp = (event, isM5, isCJ) => {
  try {
    // Courier Journey
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
    
    // M5
    if (isM5) {
      const dateStr = event.EventDate.split("T")[0];
      const timeStr = event.EventTime || "00:00:00";
      return new Date(`${dateStr}T${timeStr}`).getTime();
    }
    
    // Internal (Handles ISO and DD/MM/YYYY)
    return parseInternalDate(event.timestamp);

  } catch (error) {
    console.error("Date parsing error:", error);
    return 0;
  }
};

// ✅ 5. Standardized Display Time (Looks the same for everyone)
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
  // Result: "25 November 2025, 06:30 PM"
};

// ------------------- MAIN COMPONENT -------------------

export default function TrackingDetails({ parcelDetails }) {
  const [m5Data, setM5Data] = useState(null);
  const [cjData, setCjData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mergedTimeline, setMergedTimeline] = useState([]);

  const shouldFetchM5 = parcelDetails?.cNoteVendorName === "M5" && parcelDetails?.cNoteNumber;
  const shouldFetchCJ = parcelDetails?.cNoteVendorName === "Courier Journey" && parcelDetails?.cNoteNumber;

  // Fetch M5
  useEffect(() => {
    if (shouldFetchM5) {
      setIsLoading(true);
      fetchM5Tracking(parcelDetails.cNoteNumber)
        .then((result) => result.success ? setM5Data(result.data) : setError(result.error))
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [shouldFetchM5, parcelDetails?.cNoteNumber]);

  // Fetch CJ
  useEffect(() => {
    if (shouldFetchCJ) {
      setIsLoading(true);
      fetchCourierJourneyTracking(parcelDetails.cNoteNumber)
        .then((result) => result.success ? setCjData(result.data) : setError(result.error))
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [shouldFetchCJ, parcelDetails?.cNoteNumber]);

  // 🔹 MERGE LOGIC
  useEffect(() => {
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
        // Internal
        status = evt.status;
        comment = evt.comment; // "Custom Clearance Done Successfully"
        location = evt.location; 
      }
      
      return {
        timestamp,
        status: status?.trim() || "Update",
        location: location?.trim(),
        comment,
        // We generate formattedTime HERE so it's identical for all sources
        formattedTime: formatDisplayTime(timestamp) 
      };
    };

    // 1. Vendor Events
    if (m5Data?.Event) m5Data.Event.forEach(e => allEvents.push(normalize(e, true, false)));
    if (cjData?.Events) cjData.Events.forEach(e => allEvents.push(normalize(e, false, true)));

    // 2. Internal Events
    if (parcelDetails?.parcelStatus) {
      parcelDetails.parcelStatus.forEach(e => allEvents.push(normalize(e, false, false)));
    }

    // 3. Sort Descending (Newest First)
    allEvents.sort((a, b) => b.timestamp - a.timestamp);

    // 4. Deduplicate (remove identical status within 60 seconds)
    const deduped = allEvents.filter((event, index, arr) => {
      if (index === 0) return true;
      const prev = arr[index - 1];
      const isSameStatus = event.status.toLowerCase() === prev.status.toLowerCase();
      const isTimeClose = Math.abs(event.timestamp - prev.timestamp) < 60000;
      return !(isSameStatus && isTimeClose);
    });

    setMergedTimeline(deduped);
  }, [m5Data, cjData, parcelDetails]);

  // General Data
  const trackingData = m5Data?.trackDetails?.[0] || cjData?.Tracking?.[0];
  const latestStatus = mergedTimeline[0]?.status || "Unknown";
  const latestUpdate = mergedTimeline[0]?.formattedTime || "N/A";
  const origin = trackingData?.Origin || parcelDetails?.sender?.country || parcelDetails?.origin || "Origin";
  const destination = trackingData?.Destination || parcelDetails?.receiver?.country || parcelDetails?.destination || "Destination";
  const forwardingNumber = parcelDetails?.forwardingNumber || (parcelDetails?.cNoteVendorName === "M5" ? trackingData?.ForwardingNo : null);
  const forwardingLink = parcelDetails?.forwardingLink;

  if (!parcelDetails) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-sm text-blue-100">From</p>
              <p className="text-xl font-bold">{origin}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-white/60" />
            <div className="text-center">
              <p className="text-sm text-purple-100">To</p>
              <p className="text-xl font-bold">{destination}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card className="border-l-4 border-l-yellow-400 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>Tracking Status</span>
            <Badge variant="outline" className="font-mono">{parcelDetails?.trackingNumber}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-gray-100 rounded-full">
            {getStatusIcon(latestStatus)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{latestStatus}</h2>
            <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4" /> {latestUpdate}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Forwarding Info */}
      {(forwardingNumber || forwardingLink) && (
        <Alert className="bg-blue-50 border-blue-200">
          <ExternalLink className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800 flex flex-col sm:flex-row sm:items-center gap-2">
            <span>Forwarding Info:</span>
            {forwardingNumber && <span className="font-mono font-bold">{forwardingNumber}</span>}
            {forwardingLink && (
              <a href={forwardingLink} target="_blank" className="underline font-semibold hover:text-blue-900">
                Track Partner
              </a>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* TIMELINE */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-4 border-l-2 border-gray-200 space-y-8 py-2">
            {mergedTimeline.map((update, index) => (
              <div key={index} className="relative pl-6">
                {/* Dot */}
                <div className={`absolute -left-[25px] top-0 p-1 rounded-full border-2 bg-white ${
                   index === 0 ? "border-green-500 text-green-500 scale-110" : "border-gray-300 text-gray-400"
                }`}>
                  {getStatusIcon(update.status)}
                </div>

                {/* Content */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-base ${index === 0 ? "text-green-700" : "text-gray-800"}`}>
                        {update.status}
                      </h3>
                      {index === 0 && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Current</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{update.formattedTime}</p>
                    
                    {update.comment && (
                      <div className="mt-2 text-sm bg-gray-50 p-2 rounded border border-gray-100 text-gray-600 inline-flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> {update.comment}
                      </div>
                    )}
                  </div>

                  {update.location && (
                    <Badge variant="secondary" className="text-xs font-normal text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" /> {update.location}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {mergedTimeline.length === 0 && !isLoading && (
              <p className="text-gray-500 italic">No tracking events found.</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-500 uppercase">Sender</CardTitle></CardHeader>
          <CardContent>
            <p className="font-bold">{parcelDetails?.sender?.name}</p>
            <p className="text-sm text-gray-600">{parcelDetails?.sender?.address}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-500 uppercase">Receiver</CardTitle></CardHeader>
          <CardContent>
            <p className="font-bold">{parcelDetails?.receiver?.name}</p>
            <p className="text-sm text-gray-600">{parcelDetails?.receiver?.address}</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}