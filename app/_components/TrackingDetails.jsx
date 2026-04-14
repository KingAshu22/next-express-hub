// components/TrackingDetails.jsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  Building2,
  User,
  Phone,
  MapPinned,
  MoreHorizontal,
  ArrowRight,
  ChevronRight,
  Ship,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

// ------------------- HELPER FUNCTIONS -------------------

const getLatestLocation = (events) => {
  if (!events || events.length === 0) return null;

  const sorted = [...events].sort((a, b) => {
    const t1 = parseEventTimestamp(a);
    const t2 = parseEventTimestamp(b);
    return new Date(t2) - new Date(t1);
  });

  return sorted[0]?.location || null;
};

const getStatusIcon = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("delivered")) return <Home className="w-3.5 h-3.5" />;
  if (s.includes("out for delivery")) return <Truck className="w-3.5 h-3.5" />;
  if (s.includes("customs") || s.includes("clearance") || s.includes("cleared") || s.includes("import") || s.includes("brokerage"))
    return <ClipboardCheck className="w-3.5 h-3.5" />;
  if (s.includes("arrived") || s.includes("received") || s.includes("facility"))
    return <Warehouse className="w-3.5 h-3.5" />;
  if (s.includes("departed") || s.includes("transit") || s.includes("left") || s.includes("dispatch") || s.includes("export"))
    return <Navigation className="w-3.5 h-3.5" />;
  if (s.includes("flight") || s.includes("airport") || s.includes("hub"))
    return <Plane className="w-3.5 h-3.5" />;
  if (s.includes("booked") || s.includes("shipment") || s.includes("created") || s.includes("label") || s.includes("entry") || s.includes("pickup"))
    return <Package className="w-3.5 h-3.5" />;
  if (s.includes("unsuccessful") || s.includes("failed") || s.includes("exception") || s.includes("held") || s.includes("delay"))
    return <PackageX className="w-3.5 h-3.5" />;
  if (s.includes("processing") || s.includes("scan"))
    return <CircleDot className="w-3.5 h-3.5" />;
  return <CheckCircle className="w-3.5 h-3.5" />;
};

const getTransitMode = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("flight") || s.includes("airport") || s.includes("hub") || s.includes("airway")) return "air";
  if (s.includes("ship") || s.includes("vessel") || s.includes("maritime")) return "sea";
  return "ground";
};

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
  const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/i, "$1");
  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const parseInternalDate = (dateInput) => {
  if (!dateInput) return 0;
  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) return d.getTime();
  const parts = String(dateInput).match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (parts) {
    let day, month, year;
    if (parts[1].length === 4) { year = +parts[1]; month = +parts[2] - 1; day = +parts[3]; }
    else { day = +parts[1]; month = +parts[2] - 1; year = +parts[3]; }
    return new Date(year, month, day, parts[4] ? +parts[4] : 0, parts[5] ? +parts[5] : 0, parts[6] ? +parts[6] : 0).getTime();
  }
  return 0;
};

const parseParcelsAppDate = (dateStr, timeStr) => {
  if (!dateStr) return 0;
  try {
    const dp = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (dp) {
      const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
      const month = months[dp[2].toLowerCase().substring(0, 3)];
      let h = 0, m = 0;
      if (timeStr) { const tp = timeStr.match(/(\d{1,2}):(\d{2})/); if (tp) { h = +tp[1]; m = +tp[2]; } }
      return new Date(+dp[3], month, +dp[1], h, m).getTime();
    }
  } catch (e) {}
  return 0;
};

const parseEventTimestamp = (event, softwareType) => {
  try {
    if (softwareType === "xpression" || softwareType === "itd") {
      const dateStr = event.EventDate1 || event.EventDate;
      const timeStr = event.EventTime1 || event.EventTime || "12:00 AM";
      let pd = parseOrdinalDate(dateStr) || new Date(parseInternalDate(dateStr));
      if (!isNaN(pd.getTime())) {
        const { hours, minutes } = parseTime12Hour(timeStr);
        pd.setHours(hours, minutes, 0, 0);
        return pd.getTime();
      }
      return 0;
    }
    return parseInternalDate(event.timestamp);
  } catch { return 0; }
};

const formatDate = (ts) => !ts ? "" : new Date(ts).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const formatTime = (ts) => !ts ? "" : new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

const groupEventsByDate = (events) => {
  const groups = {};
  events.forEach(event => {
    const key = formatDate(event.timestamp);
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
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

const detectCarrierFromLink = (link) => {
  if (!link) return null;
  const l = link.toLowerCase();
  if (l.includes("ups.com")) return "ups";
  if (l.includes("dhl.com")) return "dhl";
  if (l.includes("fedex.com")) return "fedex";
  if (l.includes("usps.com")) return "usps";
  if (l.includes("bluedart.com")) return "bluedart";
  if (l.includes("aramex.com")) return "aramex";
  return null;
};

// ------------------- GEO MATH -------------------
const toRad = (d) => d * Math.PI / 180;
const toDeg = (r) => r * 180 / Math.PI;

const greatCirclePoints = (lat1, lng1, lat2, lng2, n = 80) => {
  const φ1 = toRad(lat1), λ1 = toRad(lng1), φ2 = toRad(lat2), λ2 = toRad(lng2);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2));
  return Array.from({ length: n + 1 }, (_, i) => {
    const f = i / n;
    if (d === 0) return [lat1, lng1];
    const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    return [toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))];
  });
};

const computeBearing = (lat1, lng1, lat2, lng2) => {
  const φ1 = toRad(lat1), φ2 = toRad(lat2), Δλ = toRad(lng2 - lng1);
  return (toDeg(Math.atan2(Math.sin(Δλ) * Math.cos(φ2), Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ))) + 360) % 360;
};

const geocodeLocation = async (query) => {
  if (!query) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=en`,
      { headers: { "Accept-Language": "en-US,en;q=0.9", "User-Agent": "TrackingApp/1.0" } }
    );
    const data = await res.json();
    if (data?.[0]) return { lat: +data[0].lat, lng: +data[0].lon, name: data[0].display_name.split(",")[0].trim() };
  } catch {}
  return null;
};

// ------------------- MAP COMPONENT -------------------
const ShipmentMap = ({ origin, destination, stops, latestLocation, isDelivered, latestStatus }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const arcLine = useRef(null);
  const progressLine = useRef(null);
  const stopMarkers = useRef([]);
  const raf = useRef(null);
  const [coords, setCoords] = useState(null);
  const [geocoding, setGeocoding] = useState(true);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const transitMode = getTransitMode(latestStatus);

  // Geocode all unique stops
  useEffect(() => {
    (async () => {
      setGeocoding(true);
      const locationsToGeocode = [origin, destination];
      
      // Add unique stop locations
      const uniqueStops = [...new Set(stops.filter(s => s && s.trim()).map(s => s.trim()))];
      locationsToGeocode.push(...uniqueStops);

      try {
        const results = await Promise.all(
          locationsToGeocode.map(loc => geocodeLocation(loc))
        );

        const originCoords = results[0];
        const destCoords = results[1];
        const stopCoords = results.slice(2).filter(Boolean);

        if (originCoords && destCoords) {
          setCoords({ from: originCoords, to: destCoords, stops: stopCoords });
          // Find current stop based on latest location
          if (latestLocation) {
            const latestIdx = stops.findIndex(s => s === latestLocation);
            if (latestIdx !== -1) setCurrentStopIndex(latestIdx + 1);
          }
        }
      } catch (e) {
        console.error("Geocoding error:", e);
      }
      setGeocoding(false);
    })();
  }, [origin, destination, stops, latestLocation]);

  useEffect(() => {
    if (!coords || !mapRef.current) return;
    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      const { from, to, stops: stopCoords } = coords;

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current, {
          zoomControl: false, scrollWheelZoom: false, doubleClickZoom: false,
          dragging: true, attributionControl: false,
        });

        L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png", {
          attribution: "© Stadia Maps © OpenMapTiles © OpenStreetMap",
          maxZoom: 20,
        }).addTo(mapInstance.current);

        L.control.attribution({ position: "bottomright", prefix: false })
          .addAttribution('© <a href="https://stadiamaps.com/">Stadia</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
          .addTo(mapInstance.current);
      }

      const map = mapInstance.current;
      
      // Clear previous layers
      if (arcLine.current) map.removeLayer(arcLine.current);
      if (progressLine.current) map.removeLayer(progressLine.current);
      if (markerRef.current) map.removeLayer(markerRef.current);
      stopMarkers.current.forEach(m => map.removeLayer(m));
      stopMarkers.current = [];

      // Build path through all stops
      let fullPath = [[from.lat, from.lng]];
      stopCoords.forEach(stop => fullPath.push([stop.lat, stop.lng]));
      fullPath.push([to.lat, to.lng]);

      // Draw full route
      arcLine.current = L.polyline(fullPath, { color: "#213eb3", weight: 2, opacity: 0.7, dashArray: "6 8" }).addTo(map);

      // Draw progress up to current location
      const progressPath = fullPath.slice(0, Math.min(currentStopIndex + 1, fullPath.length));
      progressLine.current = L.polyline(progressPath, { color: isDelivered ? "#10b981" : "#33f52c", weight: 3, opacity: 1 }).addTo(map);

      // Origin marker
      L.marker([from.lat, from.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:13px;height:13px;background:#10b981;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(16,185,129,.5)"></div>`,
          iconAnchor: [6, 6],
        })
      }).addTo(map).bindTooltip(`<b>${from.name}</b>`, { direction: "top", className: "tmap-tip" });

      // Stop markers
      stopCoords.forEach((stop, idx) => {
        const isCurrentStop = idx === currentStopIndex - 1;
        const marker = L.marker([stop.lat, stop.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="
              width:${isCurrentStop ? '20px' : '16px'};
              height:${isCurrentStop ? '20px' : '16px'};
              background:${isCurrentStop ? '#6366f1' : '#9ca3af'};
              border:2.5px solid white;
              border-radius:50%;
              box-shadow:0 2px 6px rgba(99,102,241,${isCurrentStop ? '0.5' : '0.2'});
              transition: all 0.3s;
            "></div>`,
            iconAnchor: [isCurrentStop ? 10 : 8, isCurrentStop ? 10 : 8],
          })
        }).addTo(map).bindTooltip(`<b>${stop.name}</b>`, { direction: "top", className: "tmap-tip" });
        stopMarkers.current.push(marker);
      });

      // Destination marker
      L.marker([to.lat, to.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center">
            <div style="position:absolute;width:22px;height:22px;background:rgba(239,68,68,.2);border-radius:50%;animation:pr 1.5s infinite"></div>
            <div style="width:11px;height:11px;background:#ef4444;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(239,68,68,.5);z-index:1"></div>
          </div>`,
          iconAnchor: [11, 11],
        })
      }).addTo(map).bindTooltip(`<b>${to.name}</b>`, { direction: "top", className: "tmap-tip" });

      // Current position marker with dynamic icon
      const currentPos = currentStopIndex < fullPath.length ? fullPath[currentStopIndex] : fullPath[fullPath.length - 1];
      const nextPos = currentStopIndex + 1 < fullPath.length ? fullPath[currentStopIndex + 1] : currentPos;
      const bearing = computeBearing(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
      const accent = isDelivered ? "#10b981" : "#6366f1";

      const getMarkerIcon = (mode, rotation) => {
        let svgContent = '';
        if (mode === 'air') {
          svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${accent}" stroke="white" stroke-width="0.5"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-2 0-4.5 2.5-4.5 2.5L9 5v2.5l-4 1.5v3l4 1 1 4 3-1.5z"/></svg>`;
        } else if (mode === 'sea') {
          svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${accent}" stroke="white" stroke-width="0.5"><path d="M2 21c.6.5 1.2 1 2 1h16c.8 0 1.4-.5 2-1M17 7l-5-2.5L7 7M17 11l-5-2.5L7 11M17 15l-5-2.5L7 15"/></svg>`;
        } else {
          svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${accent}" stroke="white" stroke-width="1"><path d="M14 5l-3.5 5 2 6H5.5M10 16v4M6 20h12"/></svg>`;
        }

        return `<div id="pw" style="
          transform:rotate(${rotation}deg);
          width:40px;height:40px;
          display:flex;align-items:center;justify-content:center;
          background:white;border-radius:50%;
          box-shadow:0 3px 10px rgba(99,102,241,.3),0 1px 3px rgba(0,0,0,.1);
          border:2px solid ${accent};
          animation: pulse 2s infinite;
        ">
        ${svgContent}
        </div>`;
      };

      markerRef.current = L.marker(currentPos, {
        icon: L.divIcon({ className: "", html: getMarkerIcon(transitMode, bearing - 45), iconAnchor: [20, 20] }),
        zIndexOffset: 1000,
      }).addTo(map);

      // Animate movement between stops
      let frame = 0;
      const animate = () => {
        frame = (frame + 1) % 360;
        const pulse = Math.sin(frame * Math.PI / 180) * 2;
        if (markerRef.current) {
          const el = markerRef.current.getElement();
          if (el) {
            const pw = el.querySelector("#pw");
            if (pw) pw.style.boxShadow = `0 ${3 + pulse}px ${10 + pulse}px rgba(99,102,241,.${3 + Math.floor(pulse)}),0 1px 3px rgba(0,0,0,.1)`;
          }
        }
        raf.current = requestAnimationFrame(animate);
      };
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(animate);

      // Fit bounds
      const allLats = [from.lat, to.lat, ...stopCoords.map(s => s.lat)];
      const allLngs = [from.lng, to.lng, ...stopCoords.map(s => s.lng)];
      const minLat = Math.min(...allLats), maxLat = Math.max(...allLats);
      const minLng = Math.min(...allLngs), maxLng = Math.max(...allLngs);
      map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [50, 50] });
    });

    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [coords, currentStopIndex, isDelivered, transitMode]);

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <style>{`
        .tmap-tip { background:white;border:none;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,.1);color:#1e1b4b;white-space:nowrap; }
        .leaflet-tooltip-top:before { border-top-color:white; }
        @keyframes pr { 0%{transform:scale(.8);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
        @keyframes pulse { 0%{opacity:1} 50%{opacity:0.6} 100%{opacity:1} }
        .leaflet-container { font-family:inherit; background:#eef2f7; }
        .leaflet-attribution-flag { display:none!important; }
        .leaflet-control-attribution { font-size:9px!important; opacity:0.5; }
      `}</style>
      <div className="relative w-full h-full">
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {/* Loading */}
        {geocoding && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/95 z-[9999] rounded-l-2xl">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
              <Plane className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-gray-600">Plotting route...</p>
            <p className="text-xs text-gray-400 mt-1">{origin} → {destination}</p>
          </div>
        )}

        {/* Progress badge top-right */}
        {!geocoding && coords && (
          <div className="absolute top-4 right-4 z-[9999] pointer-events-none">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-md ${isDelivered ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"}`}>
              {isDelivered ? "✓ Delivered" : `${currentStopIndex}/${stopMarkers.current.length + 1} Stops`}
            </span>
          </div>
        )}

        {/* Route pill bottom-center */}
        {!geocoding && coords && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-100 rounded-full px-4 py-1.5 shadow-lg flex items-center gap-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              {coords.from.name}
              <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
              {coords.to.name}
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            </div>
          </div>
        )}

        {/* Legend bottom-left */}
        {!geocoding && coords && (
          <div className="absolute bottom-4 left-4 z-[9999] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                Origin: {(origin || "").toUpperCase()}
              </div>
              {transitMode === 'air' && (
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                  <Plane className="w-3 h-3 text-indigo-500 shrink-0" />
                  Airway
                </div>
              )}
              {transitMode === 'sea' && (
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                  <Ship className="w-3 h-3 text-blue-500 shrink-0" />
                  Seaway
                </div>
              )}
              {transitMode === 'ground' && (
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                  <Truck className="w-3 h-3 text-amber-600 shrink-0" />
                  Ground
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                Destination: {(destination || "").toUpperCase()}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
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
  const [copiedFwd, setCopiedFwd] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const hasVendorIntegration = parcelDetails?.cNoteNumber && parcelDetails?.cNoteVendorName;
  const forwardingNumber = parcelDetails?.forwardingNumber;
  const forwardingLink = parcelDetails?.forwardingLink || "";
  const fwdCarrier = detectCarrierFromLink(forwardingLink);
  const isDHL = forwardingNumber && forwardingLink.toLowerCase().includes("dhl") && fwdCarrier === "dhl";
  const shouldTrackVendor = hasVendorIntegration || isDHL;
  const shouldTrackForwarding = forwardingNumber && !isDHL;

  const trackingNumber = parcelDetails?.trackingNumber;
  const origin = parcelDetails?.sender?.city || parcelDetails?.sender?.country || "Origin";
  const destination = parcelDetails?.receiver?.city || parcelDetails?.receiver?.country || "Destination";
  const hasForwardingInfo = !!(forwardingNumber || forwardingLink);

  const receiverName = parcelDetails?.receiver?.name || "";
  const receiverAddress = parcelDetails?.receiver?.address || "";
  const receiverAddress2 = parcelDetails?.receiver?.address2 || "";
  const receiverCity = parcelDetails?.receiver?.city || "";
  const receiverState = parcelDetails?.receiver?.state || "";
  const receiverCountry = parcelDetails?.receiver?.country || "";
  const receiverZip = parcelDetails?.receiver?.zip || "";
  const receiverPhone = parcelDetails?.receiver?.phone || "";
  const senderAddress = [parcelDetails?.sender?.address, parcelDetails?.sender?.city, parcelDetails?.sender?.state, parcelDetails?.sender?.country].filter(Boolean).join(", ");
  const fullAddress = [receiverAddress, receiverAddress2, receiverCity, receiverState, receiverZip, receiverCountry].filter(Boolean).join(", ");

  const copyTrackingNumber = () => { navigator.clipboard.writeText(trackingNumber); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyFwdNumber = () => { if (forwardingNumber) { navigator.clipboard.writeText(forwardingNumber); setCopiedFwd(true); setTimeout(() => setCopiedFwd(false), 2000); } };

  const handleWhatsAppShare = () => {
    const cleanUrl = typeof window !== "undefined" ? window.location.href.replace(/^https?:\/\//, "") : "";
    const loc = mergedTimeline[0]?.location || "";
    const msg = `📦 *Shipment Status Update*\n──────────────────\n🆔 *Tracking ID:* ${trackingNumber}\n🚩 *Route:* ${origin} -> ${destination}\n📊 *Status:* ${mergedTimeline[0]?.status || "In Transit"}\n${loc ? `📍 *Location:* ${loc}\n` : ""}──────────────────\n🔗 *Track Live:* ${cleanUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const fetchVendorTracking = async () => {
    if (!shouldTrackVendor) return;
    setIsLoading(true); setError(null);
    try {
      const payload = isDHL
        ? { awbNumber: forwardingNumber, forceSoftwareType: "dhl" }
        : { awbNumber: parcelDetails?.cNoteNumber, vendorId: parcelDetails?.integratedVendorId, vendorName: parcelDetails?.cNoteVendorName };
      const r = await fetch("/api/vendor-integrations/tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const res = await r.json();
      if (!res.success) { setError(res.error || "Failed"); return; }
      setVendorTrackingData(res);
    } catch (e) { setError(e.message || "Failed"); }
    finally { setIsLoading(false); }
  };

  const fetchForwardingTracking = async () => {
    if (!shouldTrackForwarding) return;
    setIsForwardingLoading(true); setForwardingError(null);
    try {
      const r = await fetch("/api/vendor-integrations/tracking/forwarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackingNumber: forwardingNumber }) });
      const res = await r.json();
      if (!res.success) { setForwardingError(res.error || "Failed"); return; }
      setForwardingTrackingData(res);
    } catch (e) { setForwardingError(e.message || "Failed"); }
    finally { setIsForwardingLoading(false); }
  };

  useEffect(() => { if (shouldTrackVendor) fetchVendorTracking(); }, [shouldTrackVendor, parcelDetails]);
  useEffect(() => { if (shouldTrackForwarding) fetchForwardingTracking(); }, [shouldTrackForwarding, forwardingNumber]);

  useEffect(() => {
    const all = [];
    if (vendorTrackingData?.events?.length)
      vendorTrackingData.events.forEach(e => all.push({ timestamp: parseEventTimestamp(e, vendorTrackingData.softwareType), status: e.Status?.trim() || e.status?.trim() || "Update", location: e.Location?.trim() || e.location?.trim() || "", comment: e.Remark || e.comment || "", source: "vendor" }));
    if (parcelDetails?.parcelStatus?.length)
      parcelDetails.parcelStatus.forEach(e => all.push({ timestamp: parseInternalDate(e.timestamp), status: e.status?.trim() || "Update", location: e.location?.trim() || "", comment: e.comment || "", source: "database" }));
    if (forwardingTrackingData?.events?.length)
      forwardingTrackingData.events.forEach(e => all.push({ timestamp: parseParcelsAppDate(e.date, e.time), status: e.status?.trim() || "Update", location: e.location?.trim() || "", comment: "", source: "forwarding" }));

    all.sort((a, b) => b.timestamp - a.timestamp);
    setMergedTimeline(all.filter((e, i, arr) => i === 0 || !(e.status.toLowerCase() === arr[i-1].status.toLowerCase() && e.location.toLowerCase() === arr[i-1].location.toLowerCase() && Math.abs(e.timestamp - arr[i-1].timestamp) < 60000)));
  }, [vendorTrackingData, forwardingTrackingData, parcelDetails]);

  const filtered = activeFilter === "all" ? mergedTimeline : mergedTimeline.filter(e => e.source === activeFilter);
  const latestStatus = mergedTimeline[0]?.status || "Awaiting Updates";
  const latestLocation = mergedTimeline[0]?.location || "";
  const isDelivered = latestStatus.toLowerCase().includes("delivered");
  const stops = mergedTimeline.map(e => e.location).filter((v, i, a) => v && a.indexOf(v) === i);
  const grouped = groupEventsByDate(filtered);
  const vendorCount = mergedTimeline.filter(e => e.source === "vendor").length;
  const fwdCount = mergedTimeline.filter(e => e.source === "forwarding").length;
  const anyLoading = isLoading || isForwardingLoading;

  const estimatedDelivery = forwardingTrackingData?.estimatedDelivery;
  const shippingType = forwardingTrackingData?.shippingType;
  const daysInTransit = forwardingTrackingData?.daysInTransit;
  const carrier = forwardingTrackingData?.carrier;

  if (!parcelDetails) return null;

  return (
    <div className="w-full min-h-screen bg-gray-100 p-4 md:p-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <span className="hover:text-gray-700 cursor-pointer">Customer</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="hover:text-gray-700 cursor-pointer">Orders</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="hover:text-gray-700 cursor-pointer">Shipments</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-800">#{trackingNumber}</span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col lg:flex-row" style={{ minHeight: "640px" }}>

          {/* ═══ LEFT: MAP ═══ */}
          <div className="relative flex-1 lg:flex-[1.5] min-h-[400px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-gray-100 bg-[#eef2f7]">

            {/* Shipment ID badge — top left */}
            <div className="absolute top-5 left-5 z-[9999] pointer-events-none">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 px-4 py-2.5 max-w-[280px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-900 truncate">Shipment #{trackingNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${isDelivered ? "bg-emerald-100 text-emerald-700" : anyLoading ? "bg-gray-100 text-gray-500" : "bg-violet-100 text-violet-700"}`}>
                    {anyLoading ? "Updating..." : latestStatus}
                  </span>
                </div>
                {latestLocation && (
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />{latestLocation}
                  </p>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="absolute inset-0">
              <ShipmentMap origin={origin} destination={destination} stops={stops} latestLocation={latestLocation} isDelivered={isDelivered} latestStatus={latestStatus} />
            </div>
          </div>

          {/* ═══ RIGHT: DETAILS PANEL ═══ */}
          <div className="w-full lg:w-[380px] xl:w-[400px] flex flex-col bg-white overflow-hidden">

            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-bold text-gray-900">Details</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => { if (shouldTrackVendor) fetchVendorTracking(); if (shouldTrackForwarding) fetchForwardingTracking(); }} disabled={anyLoading}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${anyLoading ? "animate-spin text-indigo-500" : ""}`} />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Scrollable area */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">

              {/* Route section */}
              <div className="px-6 py-4">
                <div className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center gap-0 py-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                    <div className="w-px flex-1 bg-gray-200 my-1" />
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Departure</p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{senderAddress || origin}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Arrival</p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{fullAddress || destination}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                <div className="px-4 py-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-0.5">Total time</p>
                  <p className="text-xs font-bold text-gray-800">{daysInTransit ? `${daysInTransit} day${daysInTransit > 1 ? "s" : ""}` : "—"}</p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-0.5">Stops</p>
                  <p className="text-xs font-bold text-gray-800">{stops.length}</p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-0.5">{estimatedDelivery ? "Est. Delivery" : "Updates"}</p>
                  <p className="text-xs font-bold text-gray-800 truncate">{estimatedDelivery || mergedTimeline.length}</p>
                </div>
              </div>

              {/* Tracking # */}
              <div className="px-6 py-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Tracking Number</p>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-100">
                  <span className="font-mono text-sm font-bold text-gray-800 truncate flex-1">{trackingNumber}</span>
                  <button onClick={copyTrackingNumber} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Forwarding # */}
              {hasForwardingInfo && !isDHL && forwardingNumber && (
                <div className="px-6 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Partner Tracking</p>
                  <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3.5 py-2.5 border border-orange-100">
                    <span className="font-mono text-sm font-bold text-gray-800 truncate flex-1">{forwardingNumber}</span>
                    <button onClick={copyFwdNumber} className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors shrink-0">
                      {copiedFwd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
                    </button>
                    {forwardingLink && (
                      <a href={forwardingLink} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shrink-0">
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Recipient */}
              {(receiverName || receiverPhone) && (
                <div className="px-6 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-3">Recipient</p>
                  <div className="space-y-2">
                    {receiverName && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{receiverName}</span>
                      </div>
                    )}
                    {receiverPhone && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <span className="text-sm text-gray-700">{receiverPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Carrier */}
              {(carrier || shippingType) && (
                <div className="px-6 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Carrier</p>
                  <div className="flex flex-wrap gap-2">
                    {carrier && <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg">{carrier}</span>}
                    {shippingType && <span className="text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-100 px-3 py-1.5 rounded-lg">{shippingType}</span>}
                  </div>
                </div>
              )}

              {/* Errors */}
              {(error || forwardingError) && (
                <div className="px-6 py-3 space-y-2">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-xs text-red-700 flex-1">{error}</p>
                      <button onClick={fetchVendorTracking} className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 whitespace-nowrap">
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </div>
                  )}
                  {forwardingError && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
                      <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                      <p className="text-xs text-orange-700 flex-1">{forwardingError}</p>
                      <button onClick={fetchForwardingTracking} className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 whitespace-nowrap">
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div>
                {/* Timeline header */}
                <div className="px-6 pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-bold text-gray-700">Shipment History</span>
                    <span className="text-[10px] text-gray-400">({mergedTimeline.length})</span>
                  </div>
                  {(vendorCount > 0 || fwdCount > 0) && (
                    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                      <button onClick={() => setActiveFilter("all")} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${activeFilter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>All</button>
                      {vendorCount > 0 && <button onClick={() => setActiveFilter("vendor")} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${activeFilter === "vendor" ? "bg-indigo-500 text-white shadow-sm" : "text-gray-500"}`}>Primary</button>}
                      {fwdCount > 0 && <button onClick={() => setActiveFilter("forwarding")} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${activeFilter === "forwarding" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500"}`}>Partner</button>}
                    </div>
                  )}
                </div>

                {/* Events */}
                {anyLoading && mergedTimeline.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Loader2 className="w-7 h-7 text-indigo-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Fetching updates...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <Package className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No updates yet</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([date, events], gi) => (
                    <div key={date}>
                      <div className="px-6 py-1 flex items-center gap-1.5">
                        <Calendar className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{date}</span>
                      </div>
                      {events.map((evt, idx) => {
                        const isFirst = gi === 0 && idx === 0;
                        return (
                          <div key={`${evt.timestamp}-${idx}`}
                            className={`flex gap-3 px-6 py-2.5 transition-colors hover:bg-gray-50/60 ${isFirst ? "bg-violet-50/40" : ""}`}>
                            <div className="flex flex-col items-center shrink-0 pt-0.5">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${isFirst ? "bg-white border-violet-500 text-violet-600" : evt.source === "forwarding" ? "bg-white border-orange-300 text-orange-500" : evt.source === "vendor" ? "bg-white border-blue-300 text-blue-500" : "bg-white border-gray-200 text-gray-400"}`}>
                                {getStatusIcon(evt.status)}
                              </div>
                              {idx !== events.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1 min-h-[8px]" />}
                            </div>
                            <div className="flex-1 min-w-0 py-0.5">
                              <p className="text-xs font-bold text-gray-800">{evt.status}</p>
                              {evt.location && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5 shrink-0" />{evt.location}</p>}
                              {evt.comment && <p className="text-xs text-gray-600 mt-1 italic">{evt.comment}</p>}
                              <p className="text-[10px] text-gray-400 mt-1">{formatTime(evt.timestamp)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
