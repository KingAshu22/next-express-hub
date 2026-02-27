// components/TrackingDetails.jsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Truck,
  Plane,
  Home,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  RefreshCw,
  Loader2,
  CircleDot,
  PackageX,
  Warehouse,
  ClipboardCheck,
  Navigation,
  Calendar,
  MessageSquare,
  Copy,
  Check,
  Send,
  Flag,
  ExternalLink,
  Share2,
  Globe,
  Box,
  CalendarCheck,
  Timer,
  Route,
} from "lucide-react";

import { FaWhatsapp } from "react-icons/fa";

// ------------------- HELPER FUNCTIONS -------------------

const getStatusIcon = (status) => {
  const s = (status || "").toLowerCase();

  if (s.includes("delivered")) return <Home className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("out for delivery")) return <Truck className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("customs") || s.includes("clearance") || s.includes("cleared") || s.includes("import") || s.includes("brokerage"))
    return <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("arrived") || s.includes("received") || s.includes("facility"))
    return <Warehouse className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("departed") || s.includes("transit") || s.includes("left") || s.includes("dispatch") || s.includes("export"))
    return <Navigation className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("flight") || s.includes("airport") || s.includes("hub"))
    return <Plane className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("booked") || s.includes("shipment") || s.includes("created") || s.includes("label") || s.includes("entry") || s.includes("pickup"))
    return <Package className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("unsuccessful") || s.includes("failed") || s.includes("exception") || s.includes("held") || s.includes("delay"))
    return <PackageX className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("processing") || s.includes("scan"))
    return <CircleDot className="w-4 h-4 md:w-5 md:h-5" />;

  return <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />;
};

// Parse helpers
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

  const parts = String(dateInput).match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);

  if (parts) {
    let day, month, year;
    if (parts[1].length === 4) {
      year = parseInt(parts[1], 10);
      month = parseInt(parts[2], 10) - 1;
      day = parseInt(parts[3], 10);
    } else {
      day = parseInt(parts[1], 10);
      month = parseInt(parts[2], 10) - 1;
      year = parseInt(parts[3], 10);
    }
    const hour = parts[4] ? parseInt(parts[4], 10) : 0;
    const min = parts[5] ? parseInt(parts[5], 10) : 0;
    const sec = parts[6] ? parseInt(parts[6], 10) : 0;
    return new Date(year, month, day, hour, min, sec).getTime();
  }
  return 0;
};

// Parse ParcelsApp date format like "09 Feb 2026" and time like "02:35"
const parseParcelsAppDate = (dateStr, timeStr) => {
  if (!dateStr) return 0;

  try {
    const dateParts = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    
    if (dateParts) {
      const day = parseInt(dateParts[1], 10);
      const monthStr = dateParts[2];
      const year = parseInt(dateParts[3], 10);
      
      const months = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };
      
      const month = months[monthStr.toLowerCase().substring(0, 3)];
      
      let hours = 0;
      let minutes = 0;
      
      if (timeStr) {
        const timeParts = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (timeParts) {
          hours = parseInt(timeParts[1], 10);
          minutes = parseInt(timeParts[2], 10);
        }
      }
      
      const dateObj = new Date(year, month, day, hours, minutes);
      return dateObj.getTime();
    }
  } catch (e) {
    console.error("ParcelsApp date parsing error:", e);
  }
  
  return 0;
};

const parseEventTimestamp = (event, softwareType) => {
  try {
    if (softwareType === "xpression" || softwareType === "itd") {
      const dateStr = event.EventDate1 || event.EventDate;
      const timeStr = event.EventTime1 || event.EventTime || "12:00 AM";
      let parsedDate = parseOrdinalDate(dateStr);
      if (!parsedDate) {
        parsedDate = new Date(parseInternalDate(dateStr));
      }
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        const { hours, minutes } = parseTime12Hour(timeStr);
        parsedDate.setHours(hours, minutes, 0, 0);
        return parsedDate.getTime();
      }
      return 0;
    }
    // For DHL and others returning ISO timestamps
    return parseInternalDate(event.timestamp);
  } catch (error) {
    return 0;
  }
};

const formatDate = (timestamp) => {
  if (!timestamp || timestamp === 0) return "";
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timestamp) => {
  if (!timestamp || timestamp === 0) return "";
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const groupEventsByDate = (events) => {
  const groups = {};
  events.forEach(event => {
    const dateKey = formatDate(event.timestamp);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
  });
  return groups;
};

const calculateProgress = (status, events) => {
  const s = (status || "").toLowerCase();
  if (s.includes("delivered")) return 100;
  if (s.includes("out for delivery")) return 85;
  if (s.includes("customs") || s.includes("clearance")) return 65;
  if (s.includes("arrived") && events.length > 3) return 55;
  if (s.includes("transit") || s.includes("departed")) return 45;
  if (s.includes("flight") || s.includes("airport")) return 35;
  if (events.length > 1) return 25;
  return 10;
};

// ------------------- CARRIER DETECTION HELPERS -------------------

const detectCarrierFromLink = (link) => {
  if (!link) return null;
  const lowerLink = link.toLowerCase();

  if (lowerLink.includes("ups.com")) return "ups";
  if (lowerLink.includes("dhl.com")) return "dhl";
  if (lowerLink.includes("fedex.com")) return "fedex";
  if (lowerLink.includes("usps.com")) return "usps";
  if (lowerLink.includes("bluedart.com")) return "bluedart";
  if (lowerLink.includes("aramex.com")) return "aramex";

  return null;
};

// ------------------- MAIN COMPONENT -------------------

export default function TrackingDetails({ parcelDetails }) {
  const [vendorTrackingData, setVendorTrackingData] = useState(null);
  const [forwardingTrackingData, setForwardingTrackingData] = useState(null);
  const [error, setError] = useState(null);
  const [forwardingError, setForwardingError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForwardingLoading, setIsForwardingLoading] = useState(false);
  const [mergedTimeline, setMergedTimeline] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copiedForwarding, setCopiedForwarding] = useState(false);

  // --- 1. IDENTIFY TRACKING SOURCE ---

  // Standard Vendor Integration (e.g., ITD / Xpression)
  const hasVendorIntegration = parcelDetails?.cNoteNumber && parcelDetails?.cNoteVendorName;

  // Forwarding Details
  const forwardingNumber = parcelDetails?.forwardingNumber;
  const forwardingLink = parcelDetails?.forwardingLink || "";

  // Detect carrier from forwarding link
  const forwardingCarrier = detectCarrierFromLink(forwardingLink);

  // Check specifically for DHL in forwarding link + existence of forwarding number
  const isDHLForwarding =
    forwardingNumber &&
    forwardingLink.includes("dhl") &&
    forwardingCarrier === "dhl";

  // Check specifically for UPS in forwarding link + existence of forwarding number
  const isUPSForwarding =
    forwardingNumber &&
    forwardingLink &&
    !isDHLForwarding

  // Determine if we should attempt to track via standard vendor API
  const shouldTrack = (hasVendorIntegration || isDHLForwarding) && !isUPSForwarding;
  
  // Should track forwarding (UPS via ParcelsApp)
  const shouldTrackForwarding = !isDHLForwarding && isUPSForwarding && forwardingNumber;

  // Variables for display
  const trackingNumber = parcelDetails?.trackingNumber;
  const origin = parcelDetails?.sender?.city || parcelDetails?.sender?.country || "Origin";
  const destination = parcelDetails?.receiver?.city || parcelDetails?.receiver?.country || "Destination";
  const hasForwardingInfo = !!(forwardingNumber || forwardingLink);

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyForwardingNumber = () => {
    if (forwardingNumber) {
      navigator.clipboard.writeText(forwardingNumber);
      setCopiedForwarding(true);
      setTimeout(() => setCopiedForwarding(false), 2000);
    }
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    let cleanUrl = "";
    if (typeof window !== 'undefined') {
      cleanUrl = window.location.href.replace(/^https?:\/\//, '');
    }

    const currentStatus = mergedTimeline[0]?.status || "In Transit";
    const currentLocation = mergedTimeline[0]?.location || "";

    const message =
      `📦 *Shipment Status Update*\n` +
      `──────────────────\n` +
      `🆔 *Tracking ID:* ${trackingNumber}\n` +
      `🚩 *Route:* ${origin} -> ${destination}\n` +
      `📊 *Status:* ${currentStatus}\n` +
      (currentLocation ? `📍 *Location:* ${currentLocation}\n` : "") +
      `──────────────────\n` +
      `🔗 *Track Live:* ${cleanUrl}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Fetch standard vendor tracking
  const fetchVendorTracking = async () => {
    if (!shouldTrack) return;

    setIsLoading(true);
    setError(null);

    try {
      let payload = {};

      if (isDHLForwarding) {
        payload = {
          awbNumber: forwardingNumber,
          forceSoftwareType: "dhl",
        };
        console.log("Tracking via DHL Forwarding:", payload);
      } else {
        payload = {
          awbNumber: parcelDetails?.cNoteNumber,
          vendorId: parcelDetails?.integratedVendorId,
          vendorName: parcelDetails?.cNoteVendorName,
        };
      }

      const response = await fetch("/api/vendor-integrations/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to fetch tracking data");
        return;
      }

      setVendorTrackingData(result);
    } catch (err) {
      console.error("Error fetching vendor tracking:", err);
      setError(err.message || "Failed to fetch tracking data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch forwarding tracking (UPS via ParcelsApp)
  const fetchForwardingTracking = async () => {
    if (!shouldTrackForwarding) return;

    setIsForwardingLoading(true);
    setForwardingError(null);

    try {
      console.log("[Forwarding Tracking] Fetching from ParcelsApp for:", forwardingNumber);

      const response = await fetch("/api/vendor-integrations/tracking/forwarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: forwardingNumber,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setForwardingError(result.error || "Failed to fetch forwarding tracking data");
        return;
      }

      setForwardingTrackingData(result);
    } catch (err) {
      console.error("[Forwarding Tracking] Error:", err);
      setForwardingError(err.message || "Failed to fetch forwarding tracking data");
    } finally {
      setIsForwardingLoading(false);
    }
  };

  useEffect(() => {
    if (shouldTrack) {
      fetchVendorTracking();
    }
  }, [shouldTrack, parcelDetails]);

  useEffect(() => {
    if (shouldTrackForwarding) {
      fetchForwardingTracking();
    }
  }, [shouldTrackForwarding, forwardingNumber]);

  // Merge events from all sources
  useEffect(() => {
    const allEvents = [];

    const normalize = (evt, softwareType, source = "vendor") => {
      const timestamp = parseEventTimestamp(evt, softwareType);
      return {
        timestamp,
        status: evt.Status?.trim() || evt.status?.trim() || "Update",
        location: evt.Location?.trim() || evt.location?.trim() || "",
        comment: evt.Remark || evt.comment || "",
        source, // Track source for debugging
      };
    };

    // Add vendor tracking data
    if (vendorTrackingData?.events) {
      vendorTrackingData.events.forEach(e =>
        allEvents.push(normalize(e, vendorTrackingData.softwareType, "vendor"))
      );
    }

    // Add database parcel status
    if (parcelDetails?.parcelStatus) {
      parcelDetails.parcelStatus.forEach(e => allEvents.push(normalize(e, null, "database")));
    }

    // Add forwarding tracking data (ParcelsApp)
    if (forwardingTrackingData?.events) {
      forwardingTrackingData.events.forEach(e => {
        const timestamp = parseParcelsAppDate(e.date, e.time);
        allEvents.push({
          timestamp,
          status: e.status?.trim() || "Update",
          location: e.location?.trim() || "",
          comment: "",
          source: "forwarding",
        });
      });
    }

    // Sort by timestamp descending
    allEvents.sort((a, b) => b.timestamp - a.timestamp);

    // Deduplicate
    const deduped = allEvents.filter((event, index, arr) => {
      if (index === 0) return true;
      const prev = arr[index - 1];
      const isSameStatus = event.status.toLowerCase() === prev.status.toLowerCase();
      const isTimeClose = Math.abs(event.timestamp - prev.timestamp) < 60000;
      return !(isSameStatus && isTimeClose);
    });

    setMergedTimeline(deduped);
  }, [vendorTrackingData, forwardingTrackingData, parcelDetails]);

  // Derived UI State
  const latestStatus = mergedTimeline[0]?.status || "Awaiting Updates";
  const latestLocation = mergedTimeline[0]?.location || "";
  const isDelivered = latestStatus.toLowerCase().includes("delivered");
  const progress = calculateProgress(latestStatus, mergedTimeline);
  const groupedEvents = groupEventsByDate(mergedTimeline);

  // Additional forwarding data
  const estimatedDelivery = forwardingTrackingData?.estimatedDelivery;
  const shippingType = forwardingTrackingData?.shippingType;
  const daysInTransit = forwardingTrackingData?.daysInTransit;
  const carrier = forwardingTrackingData?.carrier;

  if (!parcelDetails) return null;

  const anyLoading = isLoading || isForwardingLoading;
  const anyError = error || forwardingError;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">

      {/* ========== HERO CARD ========== */}
      <Card className={`border-0 shadow-2xl overflow-hidden relative ${isDelivered
          ? "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600"
          : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
        }`}>
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <div className="relative z-10 p-6 md:p-10 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">

            {/* Tracking Number Section */}
            <div className="text-center md:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-4">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold tracking-wide uppercase">Global Tracking</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight font-mono mb-3 break-all">
                {trackingNumber}
              </h1>

              <div className="flex items-center justify-center md:justify-start gap-3 mt-2 flex-wrap">
                {/* Copy Button */}
                <button
                  onClick={copyTrackingNumber}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium backdrop-blur-sm active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy Number"}
                </button>

                {/* WhatsApp Share Button */}
                <button
                  onClick={handleWhatsAppShare}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all text-sm font-medium shadow-lg shadow-green-900/20 active:scale-95"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  Share Status
                </button>
              </div>
            </div>

            {/* Status Section */}
            <div className="text-center md:text-right shrink-0 flex flex-col items-center md:items-end">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl shadow-lg backdrop-blur-sm max-w-[90vw] md:max-w-xs ${isDelivered ? "bg-emerald-900/30 border border-emerald-400/30" : "bg-white/20 border border-white/20"
                }`}>
                {anyLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin shrink-0" />
                ) : (
                  <div className="p-1.5 bg-white rounded-full text-indigo-600 shrink-0">
                    {getStatusIcon(latestStatus)}
                  </div>
                )}

                <div className="text-left overflow-hidden">
                  <p className="text-xs uppercase tracking-wider opacity-80">Current Status</p>

                  {/* --- MARQUEE STATUS --- */}
                  <div className="w-[180px] md:w-[220px] overflow-hidden whitespace-nowrap relative">
                    {anyLoading ? (
                      <p className="font-bold text-lg md:text-xl leading-none">Updating...</p>
                    ) : latestStatus && latestStatus.length > 20 ? (
                      <div
                        className="inline-block animate-marquee hover:[animation-play-state:paused]"
                        style={{ animationDuration: '40s' }}
                      >
                        <span className="font-bold text-lg md:text-xl leading-none mr-8">{latestStatus}</span>
                        <span className="font-bold text-lg md:text-xl leading-none mr-8">{latestStatus}</span>
                        <span className="font-bold text-lg md:text-xl leading-none mr-8">{latestStatus}</span>
                      </div>
                    ) : (
                      <p className="font-bold text-lg md:text-xl leading-none">{latestStatus}</p>
                    )}
                  </div>
                </div>
              </div>

              {latestLocation && !anyLoading && (
                <div className="mt-6 inline-flex items-center gap-1.5 text-white/90 bg-black/20 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border border-white/10 max-w-[200px] md:max-w-[250px] overflow-hidden">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />

                  {/* --- MARQUEE LOCATION --- */}
                  <div className="overflow-hidden whitespace-nowrap relative w-full">
                    {latestLocation.length > 20 ? (
                      <div
                        className="inline-block animate-marquee hover:[animation-play-state:paused]"
                        style={{ animationDuration: '20s' }}
                      >
                        <span className="mr-6">{latestLocation}</span>
                        <span className="mr-6">{latestLocation}</span>
                        <span className="mr-6">{latestLocation}</span>
                      </div>
                    ) : (
                      <span>{latestLocation}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Visualizer */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between text-sm font-medium opacity-90 mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                <span>{origin}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{destination}</span>
                <Flag className="w-4 h-4" />
              </div>
            </div>

            <div className="relative h-2 bg-black/20 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-white transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between mt-6 px-2">
              {[
                { icon: Package, label: "Booked", step: 10 },
                { icon: Plane, label: "Transit", step: 45 },
                { icon: ClipboardCheck, label: "Customs", step: 65 },
                { icon: Truck, label: "Out", step: 85 },
                { icon: Home, label: "Delivered", step: 100 },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-full transition-all duration-500 ${progress >= step.step ? "bg-white text-indigo-600 scale-110" : "bg-black/20 text-white/50"
                    }`}>
                    <step.icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${progress >= step.step ? "opacity-100" : "opacity-50"
                    }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ========== FORWARDING INFO CARD ========== */}
      {hasForwardingInfo && (
        <Card className="border border-orange-100 bg-orange-50/50 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Share2 className="w-6 h-6 text-orange-600" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Handed Over to Partner Carrier</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This shipment is being completed by a local delivery partner. Use the details below to track on their website.
                </p>

                <div className="flex flex-wrap gap-4">
                  {forwardingNumber && (
                    <div className="bg-white border border-orange-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Forwarding Number</p>
                        <p className="font-mono text-base font-bold text-gray-900">{forwardingNumber}</p>
                      </div>
                      <button
                        onClick={copyForwardingNumber}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        {copiedForwarding ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  )}

                  {forwardingLink && (
                    <a
                      href={forwardingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg font-medium shadow-md transition-all active:scale-95 h-full self-end"
                    >
                      Track on Partner Site <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== SHIPMENT DETAILS CARD (for forwarding data) ========== */}
      {isUPSForwarding && !isForwardingLoading && forwardingTrackingData?.success && (estimatedDelivery || shippingType || daysInTransit) && (
        <Card className="border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-amber-600" />
              Shipment Details
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Estimated Delivery */}
              {estimatedDelivery && (
                <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <CalendarCheck className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Estimated Delivery
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{estimatedDelivery}</p>
                </div>
              )}

              {/* Days in Transit */}
              {daysInTransit && (
                <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <Timer className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Days in Transit
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{daysInTransit} {parseInt(daysInTransit) === 1 ? 'day' : 'days'}</p>
                </div>
              )}

              {/* Shipping Type */}
              {shippingType && (
                <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <Route className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Service Type
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{shippingType}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== LOADING STATE (for forwarding tracking) ========== */}
      {isForwardingLoading && (
        <Card className="border border-blue-100 bg-blue-50/50 shadow-lg overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Globe className="w-3 h-3 text-white" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Retrieving Shipment Information
              </h3>
              <p className="text-sm text-gray-600 max-w-md">
                Please wait while we fetch the latest tracking updates from our partner carrier network.
                This may take a few moments...
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Connecting to carrier systems</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== ERROR MESSAGE ========== */}
      {anyError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-red-800">Tracking Update Failed</p>
              <p className="text-sm text-red-600">{error || forwardingError}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (error) fetchVendorTracking();
                if (forwardingError) fetchForwardingTracking();
              }}
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ========== MERGED TIMELINE ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Shipment Progress
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (shouldTrack) fetchVendorTracking();
                if (shouldTrackForwarding) fetchForwardingTracking();
              }}
              disabled={anyLoading}
              className="text-gray-500 hover:text-indigo-600"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${anyLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Card className="border-0 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {anyLoading && mergedTimeline.length === 0 ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Retrieving live status...</p>
                </div>
              ) : mergedTimeline.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium">No tracking updates yet</p>
                  <p className="text-sm text-gray-500">Status will appear here shortly</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {Object.entries(groupedEvents).map(([date, events], groupIndex) => (
                    <div key={date}>
                      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm px-6 py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5" /> {date}
                        </div>
                      </div>

                      {events.map((event, index) => {
                        const isFirst = groupIndex === 0 && index === 0;
                        const isFromForwarding = event.source === "forwarding";
                        
                        return (
                          <div
                            key={`${event.timestamp}-${index}`}
                            className={`group flex gap-4 px-6 py-5 transition-all hover:bg-slate-50 ${isFirst ? "bg-indigo-50/30" : ""}`}
                          >
                            <div className="flex flex-col items-center relative">
                              <div className={`w-0.5 grow bg-gray-200 absolute top-4 bottom-0 ${index === events.length - 1 ? "hidden" : ""}`} />
                              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm transition-transform group-hover:scale-110 ${isFirst ? "bg-white border-emerald-500 text-emerald-600" : "bg-white border-slate-200 text-slate-400"
                                }`}>
                                {getStatusIcon(event.status)}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                                <h3 className={`font-bold text-base ${isFirst ? "text-emerald-700" : "text-gray-900"}`}>
                                  {event.status}
                                </h3>
                                <time className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                                  {formatTime(event.timestamp)}
                                </time>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                                {event.location && (
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                              </div>

                              {event.comment && (
                                <div className="mt-3 p-3 bg-white border border-slate-100 rounded-lg text-sm text-slate-600 shadow-sm inline-block">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                                    {event.comment}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center py-6 text-xs text-gray-400">
        Tracking data updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}