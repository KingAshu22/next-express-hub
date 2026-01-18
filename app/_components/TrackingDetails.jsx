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
  Circle,
  Sparkles,
} from "lucide-react";

// ------------------- HELPER FUNCTIONS -------------------

const getStatusIcon = (status) => {
  const s = (status || "").toLowerCase();
  
  if (s.includes("delivered")) return <Home className="w-5 h-5" />;
  if (s.includes("out for delivery")) return <Truck className="w-5 h-5" />;
  if (s.includes("customs") || s.includes("clearance") || s.includes("cleared") || s.includes("import"))
    return <ClipboardCheck className="w-5 h-5" />;
  if (s.includes("arrived") || s.includes("received"))
    return <Warehouse className="w-5 h-5" />;
  if (s.includes("departed") || s.includes("transit") || s.includes("left") || s.includes("dispatch"))
    return <Navigation className="w-5 h-5" />;
  if (s.includes("flight") || s.includes("airport"))
    return <Plane className="w-5 h-5" />;
  if (s.includes("booked") || s.includes("shipment") || s.includes("created") || s.includes("label") || s.includes("entry"))
    return <Package className="w-5 h-5" />;
  if (s.includes("unsuccessful") || s.includes("failed") || s.includes("exception") || s.includes("held") || s.includes("delay"))
    return <PackageX className="w-5 h-5" />;
  if (s.includes("processing") || s.includes("scan"))
    return <CircleDot className="w-5 h-5" />;
  
  return <CheckCircle className="w-5 h-5" />;
};

const getStatusColor = (status, isFirst) => {
  if (isFirst) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  
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

// Calculate progress
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

  const hasVendorIntegration = parcelDetails?.cNoteNumber && parcelDetails?.cNoteVendorName;
  const vendorId = parcelDetails?.integratedVendorId;
  const vendorName = parcelDetails?.cNoteVendorName;
  const awbNumber = parcelDetails?.cNoteNumber;
  const trackingNumber = parcelDetails?.trackingNumber;

  // Copy tracking number
  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch vendor tracking
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

  // Merge timeline
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

  // Get tracking info
  const trackingInfo = vendorTrackingData?.tracking?.[0] || {};
  const latestStatus = mergedTimeline[0]?.status || "Awaiting Updates";
  const latestLocation = mergedTimeline[0]?.location || "";
  const isDelivered = latestStatus.toLowerCase().includes("delivered");
  
  const origin = parcelDetails?.sender?.city || parcelDetails?.sender?.country || "Origin";
  const destination = parcelDetails?.receiver?.city || parcelDetails?.receiver?.country || "Destination";
  
  const progress = calculateProgress(latestStatus, mergedTimeline);
  const groupedEvents = groupEventsByDate(mergedTimeline);

  if (!parcelDetails) return null;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">
      
      {/* ========== TRACKING NUMBER HERO ========== */}
      <Card className="border-0 shadow-2xl overflow-hidden">
        <div className={`p-6 md:p-8 text-center ${
          isDelivered 
            ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600" 
            : "bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700"
        }`}>
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          </div>
          
          <div className="relative z-10">
            {/* Label */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Shipment Tracking</span>
            </div>
            
            {/* Tracking Number */}
            <p className="text-white/70 text-sm md:text-base mb-2">Your Tracking Number</p>
            
            <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap mb-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-wider font-mono select-all">
                {trackingNumber}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyTrackingNumber}
                className="text-white hover:bg-white/20 rounded-full h-10 w-10 md:h-12 md:w-12 transition-all"
              >
                {copied ? (
                  <Check className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Copy className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </Button>
            </div>
            
            {copied && (
              <div className="mb-4 animate-fade-in">
                <span className="inline-flex items-center gap-1 text-sm text-white/90 bg-white/20 rounded-full px-3 py-1">
                  <Check className="w-3 h-3" /> Copied!
                </span>
              </div>
            )}
            
            {/* Current Status */}
            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg ${
              isDelivered 
                ? "bg-white text-emerald-700" 
                : "bg-white text-indigo-700"
            }`}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                getStatusIcon(latestStatus)
              )}
              <span className="font-bold text-base md:text-lg">
                {isLoading ? "Updating..." : latestStatus}
              </span>
            </div>
            
            {latestLocation && !isLoading && (
              <p className="mt-3 flex items-center justify-center gap-2 text-white/80 text-sm md:text-base">
                <MapPin className="w-4 h-4" />
                <span>{latestLocation}</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ========== JOURNEY PROGRESS ========== */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-5 md:p-6">
          {/* Origin - Destination Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Origin</p>
                <p className="font-bold text-gray-900 text-sm md:text-base">{origin}</p>
              </div>
            </div>
            
            <div className="flex-1 mx-4">
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${
                    isDelivered 
                      ? "bg-gradient-to-r from-blue-500 via-emerald-500 to-emerald-500" 
                      : "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
                {!isDelivered && (
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg transition-all duration-1000 ease-out"
                    style={{ left: `calc(${progress}% - 8px)` }}
                  >
                    <div className="absolute inset-1 bg-indigo-500 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">{progress}%</span>
                <span className="text-[10px] text-gray-400">
                  {isDelivered ? "Completed" : "In Progress"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium text-right">Destination</p>
                <p className="font-bold text-gray-900 text-sm md:text-base">{destination}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                isDelivered 
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25" 
                  : "bg-gradient-to-br from-gray-200 to-gray-300 shadow-gray-300/25"
              }`}>
                <Home className={`w-5 h-5 ${isDelivered ? "text-white" : "text-gray-500"}`} />
              </div>
            </div>
          </div>
          
          {/* Milestone Steps */}
          <div className="grid grid-cols-6 gap-1 mt-6">
            {[
              { icon: Package, label: "Booked" },
              { icon: Warehouse, label: "Picked Up" },
              { icon: Plane, label: "In Transit" },
              { icon: ClipboardCheck, label: "Customs" },
              { icon: Truck, label: "Out for Delivery" },
              { icon: Home, label: "Delivered" },
            ].map((milestone, index) => {
              const stepProgress = (index + 1) * (100 / 6);
              const isCompleted = progress >= stepProgress;
              const isCurrent = progress >= stepProgress - (100 / 6) && progress < stepProgress;
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                      : isCurrent 
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-100 scale-110" 
                        : "bg-gray-100 text-gray-400"
                  }`}>
                    <milestone.icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className={`mt-2 text-[9px] md:text-[10px] font-medium text-center leading-tight ${
                    isCompleted || isCurrent ? "text-gray-700" : "text-gray-400"
                  }`}>
                    {milestone.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ========== ERROR MESSAGE ========== */}
      {error && (
        <Card className="border-red-200 bg-red-50 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-red-800 text-sm">Failed to load tracking</p>
              <p className="text-red-600 text-xs mt-0.5 truncate">{error}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={fetchVendorTracking}
              className="text-red-600 hover:text-red-700 hover:bg-red-100 shrink-0"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ========== TIMELINE ========== */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="border-b bg-gray-50/80 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              Tracking History
            </CardTitle>
            <div className="flex items-center gap-2">
              {mergedTimeline.length > 0 && (
                <Badge variant="secondary" className="font-normal text-xs">
                  {mergedTimeline.length} updates
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchVendorTracking}
                disabled={isLoading}
                className="text-gray-500 h-8 w-8 p-0"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading && mergedTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-6 h-6 text-indigo-500" />
                </div>
              </div>
              <p className="font-medium text-gray-700 mt-4">Fetching updates...</p>
              <p className="text-sm text-gray-400 mt-1">Please wait a moment</p>
            </div>
          ) : mergedTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700">No updates yet</p>
              <p className="text-sm text-gray-400 mt-1 text-center">Tracking updates will appear here once available</p>
              {hasVendorIntegration && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={fetchVendorTracking}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check for Updates
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Object.entries(groupedEvents).map(([date, events], groupIndex) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-white/95 backdrop-blur-sm px-4 md:px-6 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {date}
                    </div>
                  </div>
                  
                  {/* Events */}
                  <div>
                    {events.map((event, index) => {
                      const isFirst = groupIndex === 0 && index === 0;
                      const isLast = groupIndex === Object.keys(groupedEvents).length - 1 && 
                                     index === events.length - 1;
                      
                      return (
                        <div 
                          key={`${event.timestamp}-${index}`}
                          className={`relative flex gap-3 md:gap-4 px-4 md:px-6 py-4 md:py-5 transition-colors hover:bg-gray-50/50 ${
                            isFirst ? "bg-gradient-to-r from-emerald-50/60 via-emerald-50/30 to-transparent" : ""
                          }`}
                        >
                          {/* Timeline */}
                          <div className="relative flex flex-col items-center">
                            {/* Top Line */}
                            {!(groupIndex === 0 && index === 0) && (
                              <div className="absolute bottom-1/2 w-0.5 h-full bg-gray-200" />
                            )}
                            
                            {/* Dot */}
                            <div className={`relative z-10 w-10 h-10 md:w-11 md:h-11 rounded-xl border-2 flex items-center justify-center transition-all ${
                              isFirst 
                                ? "border-emerald-400 bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-100 ring-4 ring-emerald-50" 
                                : getStatusColor(event.status, false)
                            }`}>
                              {getStatusIcon(event.status)}
                            </div>
                            
                            {/* Bottom Line */}
                            {!isLast && (
                              <div className="absolute top-1/2 w-0.5 h-full bg-gray-200" />
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className={`font-bold text-sm md:text-base leading-tight ${
                                    isFirst ? "text-emerald-700" : "text-gray-900"
                                  }`}>
                                    {event.status}
                                  </h3>
                                  {isFirst && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-2 py-0 h-5">
                                      Latest
                                    </Badge>
                                  )}
                                </div>
                                
                                {event.location && (
                                  <p className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 mt-1">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{event.location}</span>
                                  </p>
                                )}
                                
                                {event.comment && (
                                  <div className="mt-2 flex items-start gap-2 text-xs md:text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5 md:p-3">
                                    <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <span>{event.comment}</span>
                                  </div>
                                )}
                              </div>
                              
                              <time className="text-xs md:text-sm text-gray-400 font-medium tabular-nums whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded self-start">
                                {formatTime(event.timestamp)}
                              </time>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== SHIPMENT DETAILS ========== */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-4 px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="w-5 h-5" />
            Shipment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Sender */}
            <div className="p-4 md:p-5 border-b sm:border-b-0 sm:border-r border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-blue-600 rotate-180" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">From</p>
                  <p className="font-bold text-gray-900 text-sm md:text-base">{parcelDetails?.sender?.name}</p>
                </div>
              </div>
              <div className="pl-12 md:pl-[52px] space-y-0.5 text-xs md:text-sm text-gray-600">
                <p className="line-clamp-2">{parcelDetails?.sender?.address}</p>
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
            <div className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">To</p>
                  <p className="font-bold text-gray-900 text-sm md:text-base">{parcelDetails?.receiver?.name}</p>
                </div>
              </div>
              <div className="pl-12 md:pl-[52px] space-y-0.5 text-xs md:text-sm text-gray-600">
                <p className="line-clamp-2">{parcelDetails?.receiver?.address}</p>
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
          
          {/* Package Summary */}
          {(parcelDetails?.boxes?.length > 0 || trackingInfo.Weight || trackingInfo.BookingDate) && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 md:px-5 py-3">
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm">
                {parcelDetails?.boxes?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-500" />
                    <span className="text-gray-600">
                      <span className="font-semibold text-gray-800">{parcelDetails.boxes.length}</span>
                      {" "}{parcelDetails.boxes.length === 1 ? "Package" : "Packages"}
                    </span>
                  </div>
                )}
                {trackingInfo.Weight && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-600">
                      Weight: <span className="font-semibold text-gray-800">{trackingInfo.Weight} kg</span>
                    </span>
                  </div>
                )}
                {trackingInfo.BookingDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="text-gray-600">
                      Booked: <span className="font-semibold text-gray-800">{trackingInfo.BookingDate}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== FOOTER ========== */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}