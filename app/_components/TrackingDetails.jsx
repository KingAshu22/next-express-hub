// components/TrackingDetails.jsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  PackageCheck,
  PackageX,
  Warehouse,
  ClipboardCheck,
  Navigation,
  Calendar,
  MessageSquare,
  Copy,
  Check,
  ArrowRight,
  Send,
  Flag,
  ExternalLink,
  Link2,
  Share2,
} from "lucide-react";

// ------------------- HELPER FUNCTIONS -------------------

const getStatusIcon = (status) => {
  const s = (status || "").toLowerCase();
  
  if (s.includes("delivered")) return <Home className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("out for delivery")) return <Truck className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("customs") || s.includes("clearance") || s.includes("cleared") || s.includes("import"))
    return <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("arrived") || s.includes("received"))
    return <Warehouse className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("departed") || s.includes("transit") || s.includes("left") || s.includes("dispatch"))
    return <Navigation className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("flight") || s.includes("airport"))
    return <Plane className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("booked") || s.includes("shipment") || s.includes("created") || s.includes("label") || s.includes("entry"))
    return <Package className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("unsuccessful") || s.includes("failed") || s.includes("exception") || s.includes("held") || s.includes("delay"))
    return <PackageX className="w-4 h-4 md:w-5 md:h-5" />;
  if (s.includes("processing") || s.includes("scan"))
    return <CircleDot className="w-4 h-4 md:w-5 md:h-5" />;
  
  return <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />;
};

const getStatusColor = (status, isFirst) => {
  if (isFirst) return "text-emerald-600 bg-emerald-50 border-emerald-300";
  
  const s = (status || "").toLowerCase();
  
  if (s.includes("delivered")) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (s.includes("out for delivery")) return "text-blue-600 bg-blue-50 border-blue-200";
  if (s.includes("unsuccessful") || s.includes("failed") || s.includes("exception") || s.includes("delay"))
    return "text-red-600 bg-red-50 border-red-200";
  if (s.includes("customs") || s.includes("clearance"))
    return "text-purple-600 bg-purple-50 border-purple-200";
  if (s.includes("transit") || s.includes("departed"))
    return "text-orange-600 bg-orange-50 border-orange-200";
  if (s.includes("arrived") || s.includes("received"))
    return "text-cyan-600 bg-cyan-50 border-cyan-200";
  
  return "text-gray-500 bg-gray-50 border-gray-200";
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

// ------------------- MAIN COMPONENT -------------------

export default function TrackingDetails({ parcelDetails }) {
  const [vendorTrackingData, setVendorTrackingData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mergedTimeline, setMergedTimeline] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copiedForwarding, setCopiedForwarding] = useState(false);

  const hasVendorIntegration = parcelDetails?.cNoteNumber && parcelDetails?.cNoteVendorName;
  const vendorId = parcelDetails?.integratedVendorId;
  const vendorName = parcelDetails?.cNoteVendorName;
  const awbNumber = parcelDetails?.cNoteNumber;
  const trackingNumber = parcelDetails?.trackingNumber;

  // Get origin and destination from database only
  const origin = parcelDetails?.sender?.city || parcelDetails?.sender?.country || "Origin";
  const originCountry = parcelDetails?.sender?.country || "";
  const destination = parcelDetails?.receiver?.city || parcelDetails?.receiver?.country || "Destination";
  const destinationCountry = parcelDetails?.receiver?.country || "";

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyForwardingNumber = (number) => {
    navigator.clipboard.writeText(number);
    setCopiedForwarding(true);
    setTimeout(() => setCopiedForwarding(false), 2000);
  };

  const fetchVendorTracking = async () => {
    if (!hasVendorIntegration) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/vendor-integrations/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awbNumber: awbNumber,
          vendorId: vendorId,
          vendorName: vendorName,
        }),
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

  useEffect(() => {
    if (hasVendorIntegration) {
      fetchVendorTracking();
    }
  }, [hasVendorIntegration, awbNumber]);

  useEffect(() => {
    const allEvents = [];

    const normalize = (evt, softwareType) => {
      const timestamp = parseEventTimestamp(evt, softwareType);
      return {
        timestamp,
        status: evt.Status?.trim() || evt.status?.trim() || "Update",
        location: evt.Location?.trim() || evt.location?.trim() || "",
        comment: evt.Remark || evt.comment || "",
      };
    };

    if (vendorTrackingData?.events) {
      vendorTrackingData.events.forEach(e => 
        allEvents.push(normalize(e, vendorTrackingData.softwareType))
      );
    }

    if (parcelDetails?.parcelStatus) {
      parcelDetails.parcelStatus.forEach(e => allEvents.push(normalize(e, null)));
    }

    allEvents.sort((a, b) => b.timestamp - a.timestamp);

    const deduped = allEvents.filter((event, index, arr) => {
      if (index === 0) return true;
      const prev = arr[index - 1];
      const isSameStatus = event.status.toLowerCase() === prev.status.toLowerCase();
      const isTimeClose = Math.abs(event.timestamp - prev.timestamp) < 60000;
      return !(isSameStatus && isTimeClose);
    });

    setMergedTimeline(deduped);
  }, [vendorTrackingData, parcelDetails]);

  // Get tracking info from API response
  const trackingInfo = vendorTrackingData?.tracking?.[0] || {};
  
  const latestStatus = mergedTimeline[0]?.status || "Awaiting Updates";
  const latestLocation = mergedTimeline[0]?.location || "";
  const isDelivered = latestStatus.toLowerCase().includes("delivered");
  const progress = calculateProgress(latestStatus, mergedTimeline);
  const groupedEvents = groupEventsByDate(mergedTimeline);

  // Get forwarding info from API or database
  const forwardingNumber = trackingInfo.ForwardingNo || 
                           trackingInfo.ForwardingNo2 || 
                           trackingInfo.forwarding_no ||
                           parcelDetails?.forwardingNumber || 
                           parcelDetails?.forwarding_number ||
                           "";
                           
  const forwardingLink = trackingInfo.ForwardingURL || 
                         trackingInfo.VendorLinkURL ||
                         trackingInfo.VendorLinkURL1 ||
                         trackingInfo.forwarding_url ||
                         parcelDetails?.forwardingLink || 
                         parcelDetails?.forwarding_link ||
                         "";

  const hasForwardingInfo = forwardingNumber || forwardingLink;

  if (!parcelDetails) return null;

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-5">
      
      {/* ========== HERO SECTION ========== */}
      <div className={`relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl ${
        isDelivered 
          ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600" 
          : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
      }`}>
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 p-5 sm:p-6 md:p-8">
          {/* Origin & Destination */}
          <div className="flex items-center justify-between mb-6 md:mb-8">
            {/* Origin */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider font-medium">From</p>
                <p className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight">{origin}</p>
                {originCountry && origin !== originCountry && (
                  <p className="text-xs text-white/70">{originCountry}</p>
                )}
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex-1 flex items-center justify-center px-2 sm:px-4">
              <div className="relative w-full max-w-[120px] sm:max-w-[160px]">
                <div className="h-[2px] w-full bg-white/30 rounded-full" />
                <div 
                  className="absolute top-0 left-0 h-[2px] bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
                  style={{ left: `calc(${Math.min(progress, 90)}% - 10px)` }}
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white flex items-center justify-center shadow-lg">
                    {isDelivered ? (
                      <PackageCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                    ) : (
                      <Plane className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Destination */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider font-medium">To</p>
                <p className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight">{destination}</p>
                {destinationCountry && destination !== destinationCountry && (
                  <p className="text-xs text-white/70">{destinationCountry}</p>
                )}
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                isDelivered ? "bg-white/30" : "bg-white/20"
              } backdrop-blur-sm`}>
                <Flag className={`w-5 h-5 sm:w-6 sm:h-6 text-white ${isDelivered ? "fill-white" : ""}`} />
              </div>
            </div>
          </div>
          
          {/* Tracking Number */}
          <div className="text-center">
            <p className="text-white/60 text-xs sm:text-sm mb-1">Tracking Number</p>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-wider font-mono select-all">
                {trackingNumber}
              </h1>
              <button
                onClick={copyTrackingNumber}
                className="p-2 sm:p-2.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-200"
              >
                {copied ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-white/80 mt-2 animate-bounce">✓ Copied to clipboard</p>
            )}
          </div>
          
          {/* Current Status */}
          <div className="mt-6 md:mt-8 flex flex-col items-center">
            <div className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xl transition-all duration-300 ${
              isDelivered 
                ? "bg-white text-emerald-700" 
                : "bg-white text-indigo-700"
            }`}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                getStatusIcon(latestStatus)
              )}
              <span className="font-bold text-sm sm:text-base md:text-lg">
                {isLoading ? "Updating..." : latestStatus}
              </span>
            </div>
            
            {latestLocation && !isLoading && (
              <div className="mt-3 flex items-center gap-1.5 text-white/80 text-xs sm:text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{latestLocation}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== FORWARDING INFO ========== */}
      {hasForwardingInfo && (
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Icon */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200 flex-shrink-0">
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2">Partner Tracking</h3>
                
                <div className="space-y-2">
                  {/* Forwarding Number */}
                  {forwardingNumber && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm text-gray-500">Forwarding No:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono font-bold text-sm sm:text-base text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {forwardingNumber}
                        </code>
                        <button
                          onClick={() => copyForwardingNumber(forwardingNumber)}
                          className="p-1.5 rounded-md bg-white hover:bg-gray-100 border border-gray-200 transition-all active:scale-95"
                        >
                          {copiedForwarding ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Forwarding Link */}
                  {forwardingLink && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={forwardingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Track with Partner
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== PROGRESS STEPS ========== */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between relative">
            {/* Progress Line Background */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 rounded-full mx-6 sm:mx-8" />
            <div 
              className={`absolute top-5 left-0 h-1 rounded-full mx-6 sm:mx-8 transition-all duration-1000 ${
                isDelivered 
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500" 
                  : "bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
              }`}
              style={{ width: `calc(${progress}% - 48px)` }}
            />
            
            {[
              { icon: Package, label: "Booked", step: 1 },
              { icon: Warehouse, label: "Picked", step: 2 },
              { icon: Plane, label: "Transit", step: 3 },
              { icon: ClipboardCheck, label: "Customs", step: 4 },
              { icon: Truck, label: "Out", step: 5 },
              { icon: Home, label: "Done", step: 6 },
            ].map((milestone, index) => {
              const stepProgress = (index + 1) * (100 / 6);
              const isCompleted = progress >= stepProgress;
              const isCurrent = progress >= stepProgress - (100 / 6) && progress < stepProgress;
              
              return (
                <div key={index} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-100" 
                      : isCurrent 
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200 scale-110 ring-4 ring-indigo-100" 
                        : "bg-gray-100 text-gray-400"
                  }`}>
                    <milestone.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className={`mt-2 text-[9px] sm:text-[10px] font-semibold transition-colors duration-300 ${
                    isCompleted || isCurrent ? "text-gray-800" : "text-gray-400"
                  }`}>
                    {milestone.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ========== ERROR ========== */}
      {error && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-md overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-800 text-sm">Failed to load</p>
              <p className="text-red-600 text-xs truncate">{error}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={fetchVendorTracking}
              className="text-red-600 hover:text-red-700 hover:bg-red-100 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ========== TIMELINE ========== */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white py-4 px-4 sm:px-5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-gray-900">Tracking History</CardTitle>
                {mergedTimeline.length > 0 && (
                  <p className="text-[10px] sm:text-xs text-gray-500">{mergedTimeline.length} updates</p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={fetchVendorTracking}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700 h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full hover:bg-gray-100"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading && mergedTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                </div>
              </div>
              <p className="font-semibold text-gray-700 mt-4 text-sm sm:text-base">Loading updates...</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Please wait</p>
            </div>
          ) : mergedTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700 text-sm sm:text-base">No updates yet</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 text-center">Tracking info will appear here</p>
              {hasVendorIntegration && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={fetchVendorTracking}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          ) : (
            <div>
              {Object.entries(groupedEvents).map(([date, events], groupIndex) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm px-4 sm:px-5 py-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                      {date}
                    </div>
                  </div>
                  
                  {/* Events */}
                  {events.map((event, index) => {
                    const isFirst = groupIndex === 0 && index === 0;
                    const isLast = groupIndex === Object.keys(groupedEvents).length - 1 && 
                                   index === events.length - 1;
                    
                    return (
                      <div 
                        key={`${event.timestamp}-${index}`}
                        className={`relative flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 sm:py-5 transition-all duration-300 hover:bg-gray-50/50 ${
                          isFirst ? "bg-gradient-to-r from-emerald-50/50 to-transparent" : ""
                        }`}
                      >
                        {/* Timeline Line & Dot */}
                        <div className="relative flex flex-col items-center flex-shrink-0">
                          {!(groupIndex === 0 && index === 0) && (
                            <div className="absolute bottom-1/2 w-0.5 h-full bg-gradient-to-t from-gray-200 to-transparent" />
                          )}
                          
                          <div className={`relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                            isFirst 
                              ? "border-emerald-400 bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-100 scale-105" 
                              : getStatusColor(event.status, false)
                          }`}>
                            {getStatusIcon(event.status)}
                          </div>
                          
                          {!isLast && (
                            <div className="absolute top-1/2 w-0.5 h-full bg-gradient-to-b from-gray-200 to-transparent" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2">
                            {/* Status & Comment */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`font-bold text-sm sm:text-base leading-tight ${
                                  isFirst ? "text-emerald-700" : "text-gray-900"
                                }`}>
                                  {event.status}
                                </h3>
                                {isFirst && (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] sm:text-[10px] px-1.5 py-0 h-4 sm:h-5 font-semibold">
                                    Latest
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Time - Mobile */}
                              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:hidden">
                                {formatTime(event.timestamp)}
                              </p>
                              
                              {event.comment && (
                                <div className="mt-2 flex items-start gap-2 text-xs sm:text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-2 sm:p-2.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                  <span className="leading-relaxed">{event.comment}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Right Side - Location & Time */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {/* Time - Desktop */}
                              <time className="hidden sm:block text-xs text-gray-400 font-medium tabular-nums bg-gray-100 px-2 py-0.5 rounded">
                                {formatTime(event.timestamp)}
                              </time>
                              
                              {/* Location */}
                              {event.location && (
                                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 bg-gray-50 sm:bg-transparent px-1.5 py-0.5 sm:p-0 rounded">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="max-w-[80px] sm:max-w-[120px] truncate">{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
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

      {/* ========== SHIPMENT DETAILS ========== */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 py-3.5 sm:py-4 px-4 sm:px-5">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white font-semibold">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            Shipment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Sender */}
            <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-gray-100">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-md shadow-blue-200">
                  <ArrowRight className="w-4 h-4 text-white rotate-180" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Sender</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{parcelDetails?.sender?.name}</p>
                </div>
              </div>
              <div className="pl-[42px] sm:pl-12 space-y-0.5 text-xs sm:text-sm text-gray-600">
                <p className="line-clamp-2 leading-relaxed">{parcelDetails?.sender?.address}</p>
                {parcelDetails?.sender?.city && (
                  <p>
                    {parcelDetails.sender.city}
                    {parcelDetails.sender.state && `, ${parcelDetails.sender.state}`} 
                    {parcelDetails.sender.zip && ` - ${parcelDetails.sender.zip}`}
                  </p>
                )}
                <p className="font-semibold text-gray-800">{parcelDetails?.sender?.country}</p>
              </div>
            </div>
            
            {/* Receiver */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Receiver</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{parcelDetails?.receiver?.name}</p>
                </div>
              </div>
              <div className="pl-[42px] sm:pl-12 space-y-0.5 text-xs sm:text-sm text-gray-600">
                <p className="line-clamp-2 leading-relaxed">{parcelDetails?.receiver?.address}</p>
                {parcelDetails?.receiver?.city && (
                  <p>
                    {parcelDetails.receiver.city}
                    {parcelDetails.receiver.state && `, ${parcelDetails.receiver.state}`} 
                    {parcelDetails.receiver.zip && ` - ${parcelDetails.receiver.zip}`}
                  </p>
                )}
                <p className="font-semibold text-gray-800">{parcelDetails?.receiver?.country}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== FOOTER ========== */}
      <div className="text-center py-2 sm:py-4">
        <p className="text-[10px] sm:text-xs text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}