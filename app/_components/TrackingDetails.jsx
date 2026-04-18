// components/TrackingDetails.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package, Truck, Plane, Home, CheckCircle, AlertCircle, Clock,
  MapPin, RefreshCw, Loader2, CircleDot, PackageX, Warehouse,
  ClipboardCheck, Navigation, Calendar, MessageSquare, Copy, Check,
  ExternalLink, Share2, Globe, CalendarCheck, Timer, Route,
  Building2, User, Phone, MoreHorizontal, ArrowRight,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const getStatusIcon = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("delivered"))       return <Home        className="w-3.5 h-3.5" />;
  if (s.includes("out for delivery"))return <Truck       className="w-3.5 h-3.5" />;
  if (s.includes("customs") || s.includes("clearance") || s.includes("brokerage"))
                                      return <ClipboardCheck className="w-3.5 h-3.5" />;
  if (s.includes("arrived") || s.includes("received") || s.includes("facility"))
                                      return <Warehouse   className="w-3.5 h-3.5" />;
  if (s.includes("departed") || s.includes("transit") || s.includes("dispatch") || s.includes("export"))
                                      return <Navigation  className="w-3.5 h-3.5" />;
  if (s.includes("flight") || s.includes("airport") || s.includes("hub"))
                                      return <Plane       className="w-3.5 h-3.5" />;
  if (s.includes("booked") || s.includes("created") || s.includes("label") || s.includes("pickup"))
                                      return <Package     className="w-3.5 h-3.5" />;
  if (s.includes("unsuccessful") || s.includes("failed") || s.includes("exception") || s.includes("delay"))
                                      return <PackageX    className="w-3.5 h-3.5" />;
  if (s.includes("processing") || s.includes("scan"))
                                      return <CircleDot   className="w-3.5 h-3.5" />;
  return <CheckCircle className="w-3.5 h-3.5" />;
};

// Date/time parsers
const parseTime12Hour = (t) => {
  if (!t) return { hours: 0, minutes: 0 };
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return { hours: 0, minutes: 0 };
  let h = +m[1], min = +m[2];
  const p = m[3]?.toUpperCase();
  if (p === "PM" && h !== 12) h += 12;
  else if (p === "AM" && h === 12) h = 0;
  return { hours: h, minutes: min };
};

const parseOrdinalDate = (s) => {
  if (!s) return null;
  const d = new Date(s.replace(/(\d+)(st|nd|rd|th)/i, "$1"));
  return isNaN(d.getTime()) ? null : d;
};

const parseInternalDate = (input) => {
  if (!input) return 0;
  const d = new Date(input);
  if (!isNaN(d.getTime())) return d.getTime();
  const p = String(input).match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (p) {
    const [yr, mo, dy] = p[1].length === 4
      ? [+p[1], +p[2] - 1, +p[3]]
      : [+p[3], +p[2] - 1, +p[1]];
    return new Date(yr, mo, dy, p[4]||0, p[5]||0, p[6]||0).getTime();
  }
  return 0;
};

const parseParcelsDate = (dateStr, timeStr) => {
  if (!dateStr) return 0;
  try {
    const dp = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (!dp) return 0;
    const months = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
    const mo = months[dp[2].toLowerCase().slice(0,3)];
    let h = 0, m = 0;
    if (timeStr) { const tp = timeStr.match(/(\d{1,2}):(\d{2})/); if (tp) { h=+tp[1]; m=+tp[2]; } }
    return new Date(+dp[3], mo, +dp[1], h, m).getTime();
  } catch { return 0; }
};

const parseEventTimestamp = (evt, softwareType) => {
  try {
    if (softwareType === "xpression" || softwareType === "itd") {
      const ds = evt.EventDate1 || evt.EventDate;
      const ts = evt.EventTime1  || evt.EventTime || "12:00 AM";
      let d = parseOrdinalDate(ds) || new Date(parseInternalDate(ds));
      if (!isNaN(d.getTime())) {
        const { hours, minutes } = parseTime12Hour(ts);
        d.setHours(hours, minutes, 0, 0);
        return d.getTime();
      }
      return 0;
    }
    return parseInternalDate(evt.timestamp);
  } catch { return 0; }
};

const fmtDate = (ts) => !ts ? "" : new Date(ts).toLocaleDateString("en-US", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
const fmtTime = (ts) => !ts ? "" : new Date(ts).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12:true });

const groupByDate = (events) => {
  const g = {};
  events.forEach(e => { const k = fmtDate(e.timestamp); if (!g[k]) g[k]=[]; g[k].push(e); });
  return g;
};

const calcProgress = (status, events) => {
  const s = (status||"").toLowerCase();
  if (s.includes("delivered"))       return 100;
  if (s.includes("out for delivery"))return 85;
  if (s.includes("customs") || s.includes("clearance")) return 65;
  if (s.includes("arrived") && events.length > 3) return 55;
  if (s.includes("transit") || s.includes("departed")) return 45;
  if (s.includes("flight") || s.includes("airport")) return 35;
  if (events.length > 1) return 25;
  return 10;
};

const detectCarrier = (link) => {
  if (!link) return null;
  const l = link.toLowerCase();
  if (l.includes("ups.com"))      return "ups";
  if (l.includes("dhl.com"))      return "dhl";
  if (l.includes("fedex.com"))    return "fedex";
  if (l.includes("usps.com"))     return "usps";
  if (l.includes("bluedart.com")) return "bluedart";
  if (l.includes("aramex.com"))   return "aramex";
  return null;
};

// ─────────────────────────────────────────────
// GEO MATH
// ─────────────────────────────────────────────
const toRad = (d) => d * Math.PI / 180;
const toDeg = (r) => r * 180 / Math.PI;

const greatCircle = (lat1, lng1, lat2, lng2, n = 100) => {
  const φ1=toRad(lat1), λ1=toRad(lng1), φ2=toRad(lat2), λ2=toRad(lng2);
  const d = 2*Math.asin(Math.sqrt(Math.sin((φ2-φ1)/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin((λ2-λ1)/2)**2));
  return Array.from({length:n+1},(_,i)=>{
    const f=i/n;
    if(d===0) return [lat1,lng1];
    const A=Math.sin((1-f)*d)/Math.sin(d), B=Math.sin(f*d)/Math.sin(d);
    const x=A*Math.cos(φ1)*Math.cos(λ1)+B*Math.cos(φ2)*Math.cos(λ2);
    const y=A*Math.cos(φ1)*Math.sin(λ1)+B*Math.cos(φ2)*Math.sin(λ2);
    const z=A*Math.sin(φ1)+B*Math.sin(φ2);
    return [toDeg(Math.atan2(z,Math.sqrt(x*x+y*y))),toDeg(Math.atan2(y,x))];
  });
};

const bearing = (lat1,lng1,lat2,lng2) => {
  const φ1=toRad(lat1),φ2=toRad(lat2),Δλ=toRad(lng2-lng1);
  return (toDeg(Math.atan2(Math.sin(Δλ)*Math.cos(φ2),Math.cos(φ1)*Math.sin(φ2)-Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ)))+360)%360;
};

const geocode = async (q) => {
  if (!q) return null;
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&accept-language=en`,
      { headers:{"Accept-Language":"en-US,en;q=0.9","User-Agent":"TrackingApp/1.0"} }
    );
    const d = await r.json();
    if (d?.[0]) return { lat:+d[0].lat, lng:+d[0].lon, name:d[0].display_name.split(",")[0].trim() };
  } catch {}
  return null;
};

// ─────────────────────────────────────────────
// MAP COMPONENT
// ─────────────────────────────────────────────
const ShipmentMap = ({ origin, destination, progress, isDelivered }) => {
  const mapDiv      = useRef(null);
  const mapInst     = useRef(null);
  const planeMarker = useRef(null);
  const ghostLine   = useRef(null);
  const travelLine  = useRef(null);
  const rafId       = useRef(null);
  const arcRef      = useRef([]);

  const [coords,    setCoords]    = useState(null);
  const [geocoding, setGeocoding] = useState(true);

  // Geocode on prop change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGeocoding(true);
      const [from, to] = await Promise.all([geocode(origin), geocode(destination)]);
      if (!cancelled && from && to) setCoords({ from, to });
      if (!cancelled) setGeocoding(false);
    })();
    return () => { cancelled = true; };
  }, [origin, destination]);

  // Build/update map when coords ready
  useEffect(() => {
    if (!coords || !mapDiv.current) return;
    let destroyed = false;

    import("leaflet").then((L) => {
      if (destroyed) return;

      // Delete broken icon path set by webpack
      delete L.Icon.Default.prototype._getIconUrl;

      const { from, to } = coords;
      const arc = greatCircle(from.lat, from.lng, to.lat, to.lng, 120);
      arcRef.current = arc;

      const clamped = Math.min(Math.max(progress || 10, 0), 100);
      const planeIdx = Math.floor((clamped / 100) * (arc.length - 1));

      // ── Create map once ──
      if (!mapInst.current) {
        mapInst.current = L.map(mapDiv.current, {
          zoomControl: false,        // we render our own
          scrollWheelZoom: false,
          doubleClickZoom: false,
          dragging: false,
          attributionControl: false,
          tap: true,                 // mobile
        });

        L.tileLayer(
          "https://tiles.stadiamaps.com/tiles/alidade_bright/{z}/{x}/{y}{r}.png",
          { zoom: 18 }
        ).addTo(mapInst.current);

        L.control.attribution({ position:"bottomright", prefix:false })
          .addAttribution("© Stadia Maps © OpenStreetMap")
          .addTo(mapInst.current);
      }

      const map = mapInst.current;

      // ── Remove old layers ──
      [ghostLine, travelLine, planeMarker].forEach(ref => {
        if (ref.current) { try { map.removeLayer(ref.current); } catch {} ref.current = null; }
      });

      // ── Ghost arc (dashed) ──
      ghostLine.current = L.polyline(arc, {
        color: "#ef4444", weight: 2.5, opacity: 0.75, dashArray: "7 9",
      }).addTo(map);

      // ── Traveled arc (solid) ──
      travelLine.current = L.polyline(arc.slice(0, planeIdx + 1), {
        color: isDelivered ? "#10b981" : "#6366f1", weight: 3.5, opacity: 1,
      }).addTo(map);

      // ── Origin dot ──
      L.marker([from.lat, from.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="
            width:14px;height:14px;
            background:#10b981;border:3px solid white;border-radius:50%;
            box-shadow:0 2px 8px rgba(16,185,129,.55);
          "></div>`,
          iconAnchor: [7, 7],
        }),
      }).addTo(map)
        .bindTooltip(`<b>${from.name}</b>`, { direction:"top", className:"tmap-tip" });

      // ── Destination dot (pulsing) ──
      L.marker([to.lat, to.lng], {
        icon: L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;inset:0;background:rgba(239,68,68,.22);border-radius:50%;animation:tmap-pulse 1.6s ease-out infinite;"></div>
              <div style="width:12px;height:12px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(239,68,68,.5);z-index:1;"></div>
            </div>`,
          iconAnchor: [12, 12],
        }),
      }).addTo(map)
        .bindTooltip(`<b>${to.name}</b>`, { direction:"top", className:"tmap-tip" });

      // ── Plane marker ──
      const planePos = arc[planeIdx];
      const accent   = isDelivered ? "#10b981" : "#6366f1";

      const makePlaneHTML = () => `
        <div id="plane-wrap" style="
          width:40px;height:40px;
          display:flex;align-items:center;justify-content:center;
          background:white;border-radius:50%;
          border:2.5px solid ${accent};
          box-shadow:0 4px 14px rgba(99,102,241,.35),0 1px 4px rgba(0,0,0,.12);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/>
            <path d="M12 22V12"/>
          </svg>
        </div>`;

      planeMarker.current = L.marker(planePos, {
        icon: L.divIcon({ className:"", html: makePlaneHTML(), iconAnchor:[20,20] }),
        zIndexOffset: 1000,
      }).addTo(map);

      // ── Smooth float animation ──
      let frame = 0;
      const RANGE = 4;   // how many arc steps to oscillate ±

      const animate = () => {
        frame = (frame + 1) % 360;
        const osc = Math.sin(frame * Math.PI / 180) * RANGE;
        const idx  = Math.max(0, Math.min(arc.length - 1, Math.round(planeIdx + osc)));
        const pos  = arc[idx];

        if (planeMarker.current) {
          planeMarker.current.setLatLng(pos);
        }
        rafId.current = requestAnimationFrame(animate);
      };

      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(animate);

      // ── Fit bounds ──
      map.fitBounds(
        L.latLngBounds([from.lat, from.lng], [to.lat, to.lng]).pad(0.28),
        { animate: true }
      );
    });

    return () => {
      destroyed = true;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [coords, progress, isDelivered]);

  // Teardown
  useEffect(() => () => {
    if (rafId.current)   cancelAnimationFrame(rafId.current);
    if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <style>{`
        .tmap-tip {
          background:white;border:none;border-radius:8px;
          padding:5px 11px;font-size:11px;font-weight:700;
          box-shadow:0 4px 14px rgba(0,0,0,.12);color:#1e1b4b;white-space:nowrap;
        }
        .leaflet-tooltip-top::before { border-top-color:white; }
        @keyframes tmap-pulse {
          0%   { transform:scale(0.8); opacity:0.9; }
          100% { transform:scale(2.6); opacity:0;   }
        }
        .leaflet-container        { font-family:inherit; background:#e8eef6; }
        .leaflet-attribution-flag { display:none!important; }
        .leaflet-control-attribution { font-size:9px!important; opacity:0.45; }
      `}</style>

      <div className="relative w-full h-full">
        {/* Map tile */}
        <div ref={mapDiv} style={{ width:"100%", height:"100%" }} />

        {/* ── Loading overlay ── */}
        {geocoding && (
          <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/96 rounded-l-2xl">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3 shadow-sm">
              <Plane className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Plotting route...</p>
            <p className="text-xs text-gray-400 mt-1">{origin} → {destination}</p>
          </div>
        )}

        {/* ── Progress badge ── */}
        {!geocoding && (
          <div className="absolute top-4 right-4 z-[9999] flex flex-col gap-1.5">
            <span className={`self-end text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md pointer-events-none ${
              isDelivered ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"
            }`}>
              {isDelivered ? "Delivered" : `${progress}% Complete`}
            </span>
          </div>
        )}

        {/* ── Route pill (bottom-center) ── */}
        {false && !geocoding && coords && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-100 rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-xs text-gray-700 whitespace-nowrap">
              <span className="font-bold text-gray-900 shrink-0">From:</span>
              <span className="font-bold text-gray-800">{origin}</span>
              <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="font-bold text-gray-900 shrink-0">To:</span>
              <span className="font-bold text-gray-800">{destination}</span>
            </div>
          </div>
        )}

        {/* ── Legend (bottom-left) ── */}
        {false && !geocoding && coords && (
          <div className="absolute bottom-4 left-4 z-[9999] pointer-events-none">
            <div className="bg-white/92 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold text-gray-900">From:</span> {(origin||"").toUpperCase()}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600">
                <Plane className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                Airway
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                <span className="font-bold text-gray-900">To:</span> {(destination||"").toUpperCase()}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function TrackingDetails({ parcelDetails }) {
  const [vendorData,      setVendorData]      = useState(null);
  const [forwardingData,  setForwardingData]  = useState(null);
  const [error,           setError]           = useState(null);
  const [fwdError,        setFwdError]        = useState(null);
  const [isLoading,       setIsLoading]       = useState(false);
  const [isFwdLoading,    setIsFwdLoading]    = useState(false);
  const [timeline,        setTimeline]        = useState([]);
  const [copied,          setCopied]          = useState(false);
  const [copiedFwd,       setCopiedFwd]       = useState(false);
  const [activeFilter,    setActiveFilter]    = useState("all");

  // ── Derived from parcelDetails ──
  const hasVendor       = parcelDetails?.cNoteNumber && parcelDetails?.cNoteVendorName;
  const fwdNumber       = parcelDetails?.forwardingNumber;
  const fwdLink         = parcelDetails?.forwardingLink || "";
  const fwdCarrier      = detectCarrier(fwdLink);
  const isDHL           = fwdNumber && fwdLink.toLowerCase().includes("dhl") && fwdCarrier === "dhl";
  const doVendor        = hasVendor || isDHL;
  const doForwarding    = fwdNumber && !isDHL;

  const trackNum  = parcelDetails?.trackingNumber;
  const originCountry = parcelDetails?.sender?.country || "";
  const destinationCountry = parcelDetails?.receiver?.country || "";
  const origin    = parcelDetails?.sender?.city    || parcelDetails?.sender?.country    || "Origin";
  const dest      = parcelDetails?.receiver?.city  || parcelDetails?.receiver?.country  || "Destination";
  const mapOrigin = originCountry || origin;
  const mapDestination = destinationCountry || dest;
  const hasFwdInfo= !!(fwdNumber || fwdLink);

  const rName     = parcelDetails?.receiver?.name    || "";
  const rPhone    = parcelDetails?.receiver?.phone   || "";
  const sAddr     = [parcelDetails?.sender?.address,  parcelDetails?.sender?.city,  parcelDetails?.sender?.state,  parcelDetails?.sender?.country ].filter(Boolean).join(", ");
  const rAddr     = [parcelDetails?.receiver?.address,parcelDetails?.receiver?.address2,parcelDetails?.receiver?.city,parcelDetails?.receiver?.state,parcelDetails?.receiver?.zip,parcelDetails?.receiver?.country].filter(Boolean).join(", ");

  const copyTrack = () => { navigator.clipboard.writeText(trackNum); setCopied(true);    setTimeout(() => setCopied(false),    2000); };
  const copyFwd   = () => { if (fwdNumber) { navigator.clipboard.writeText(fwdNumber); setCopiedFwd(true); setTimeout(() => setCopiedFwd(false), 2000); } };

  const shareWhatsApp = () => {
    const url = typeof window !== "undefined" ? window.location.href.replace(/^https?:\/\//,"") : "";
    const loc = timeline[0]?.location || "";
    const msg = `📦 *Shipment Update*\n──────────\n🆔 *ID:* ${trackNum}\n🚩 *Route:* ${origin} → ${dest}\n📊 *Status:* ${timeline[0]?.status || "In Transit"}\n${loc?`📍 *Location:* ${loc}\n`:""}──────────\n🔗 ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // ── API calls ──
  const fetchVendor = async () => {
    if (!doVendor) return;
    setIsLoading(true); setError(null);
    try {
      const payload = isDHL
        ? { awbNumber: fwdNumber, forceSoftwareType:"dhl" }
        : { awbNumber: parcelDetails?.cNoteNumber, vendorId: parcelDetails?.integratedVendorId, vendorName: parcelDetails?.cNoteVendorName };
      const r   = await fetch("/api/vendor-integrations/tracking", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const res = await r.json();
      if (!res.success) { setError(res.error || "Failed"); return; }
      setVendorData(res);
    } catch (e) { setError(e.message || "Failed"); }
    finally { setIsLoading(false); }
  };

  const fetchForwarding = async () => {
    if (!doForwarding) return;
    setIsFwdLoading(true); setFwdError(null);
    try {
      const r   = await fetch("/api/vendor-integrations/tracking/forwarding", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ trackingNumber: fwdNumber }) });
      const res = await r.json();
      if (!res.success) { setFwdError(res.error || "Failed"); return; }
      setForwardingData(res);
    } catch (e) { setFwdError(e.message || "Failed"); }
    finally { setIsFwdLoading(false); }
  };

  useEffect(() => { if (doVendor)     fetchVendor();     }, [doVendor, parcelDetails]);
  useEffect(() => { if (doForwarding) fetchForwarding(); }, [doForwarding, fwdNumber]);

  // ── Merge timeline ──
  useEffect(() => {
    const all = [];
    if (vendorData?.events?.length)
      vendorData.events.forEach(e => all.push({ timestamp: parseEventTimestamp(e, vendorData.softwareType), status: (e.Status||e.status||"Update").trim(), location:(e.Location||e.location||"").trim(), comment: e.Remark||e.comment||"", source:"vendor" }));
    if (parcelDetails?.parcelStatus?.length)
      parcelDetails.parcelStatus.forEach(e => all.push({ timestamp: parseInternalDate(e.timestamp), status:(e.status||"Update").trim(), location:(e.location||"").trim(), comment:e.comment||"", source:"database" }));
    if (forwardingData?.events?.length)
      forwardingData.events.forEach(e => all.push({ timestamp: parseParcelsDate(e.date, e.time), status:(e.status||"Update").trim(), location:(e.location||"").trim(), comment:"", source:"forwarding" }));

    all.sort((a,b) => b.timestamp - a.timestamp);
    setTimeline(all.filter((e,i,arr) => i===0 || !(
      e.status.toLowerCase()===arr[i-1].status.toLowerCase() &&
      e.location.toLowerCase()===arr[i-1].location.toLowerCase() &&
      Math.abs(e.timestamp-arr[i-1].timestamp) < 60000
    )));
  }, [vendorData, forwardingData, parcelDetails]);

  // ── Derived UI state ──
  const filtered     = activeFilter === "all" ? timeline : timeline.filter(e => e.source === activeFilter);
  const latestStatus = timeline[0]?.status   || "Awaiting Updates";
  const latestLoc    = timeline[0]?.location || "";
  const isDelivered  = latestStatus.toLowerCase().includes("delivered");
  const progress     = calcProgress(latestStatus, timeline);
  const grouped      = groupByDate(filtered);
  const vendorCnt    = timeline.filter(e => e.source === "vendor").length;
  const fwdCnt       = timeline.filter(e => e.source === "forwarding").length;
  const anyLoading   = isLoading || isFwdLoading;

  const estDelivery  = forwardingData?.estimatedDelivery;
  const shippingType = forwardingData?.shippingType;
  const daysTransit  = forwardingData?.daysInTransit;
  const carrier      = forwardingData?.carrier;
  const statusTone   = isDelivered
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : anyLoading
      ? "bg-gray-100 text-gray-600 border-gray-200"
      : "bg-blue-100 text-blue-700 border-blue-200";

  if (!parcelDetails) return null;

  return (
    <div className="w-full min-h-screen bg-gray-100 p-3 sm:p-4 md:p-6">

      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Latest Status</p>
          <div className={`mt-1 inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold ${statusTone}`}>
            {anyLoading ? "Updating..." : latestStatus}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Shipment No</p>
          <p className="text-sm font-bold text-gray-900">#{trackNum}</p>
        </div>
      </div>

      {/* ─── MAIN CARD ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col lg:flex-row" style={{ minHeight: "clamp(500px, 58vh, 560px)" }}>

          {/* ══════ LEFT: MAP ══════ */}
          <div className="relative flex-1 lg:flex-[1.35] min-h-[220px] sm:min-h-[280px] lg:min-h-[500px] border-b lg:border-b-0 lg:border-r border-gray-100 bg-slate-50">

            {/* Shipment badge – top-left */}
            <div className="absolute top-4 left-4 right-4 z-[9999] pointer-events-none">
              <div className="bg-white/96 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-gray-900 block truncate">Shipment #{trackNum}</span>
                    {latestLoc && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />{latestLoc}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-bold mb-1">Status</p>
                    <span className={`inline-flex text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                    isDelivered ? "bg-emerald-100 text-emerald-700"
                    : anyLoading ? "bg-gray-100 text-gray-500"
                    : "bg-violet-100 text-violet-700"
                  }`}>
                      {anyLoading ? "Updating…" : latestStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map fills the whole left panel */}
            <div className="absolute inset-0">
              <ShipmentMap
                origin={mapOrigin}
                destination={mapDestination}
                progress={progress}
                isDelivered={isDelivered}
              />
            </div>
          </div>

          {/* ══════ RIGHT: DETAILS ══════ */}
          <div className="w-full lg:w-[370px] xl:w-[400px] flex flex-col bg-white">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Route</p>
              <div className="flex items-center gap-2 text-sm leading-none">
                <span className="font-bold text-gray-900">{mapOrigin}</span>
                <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-bold text-gray-900">{mapDestination}</span>
              </div>
            </div>

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-bold text-gray-900">Details</h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { if (doVendor) fetchVendor(); if (doForwarding) fetchForwarding(); }}
                  disabled={anyLoading}
                  className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${anyLoading ? "animate-spin text-indigo-500" : ""}`} />
                </button>
                <button className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-gray-50">

              {/* Route */}
              <div className="px-5 py-4">
                <div className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center py-1 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <div className="w-px flex-1 bg-gray-200 my-1.5" />
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Departure</p>
                      <p className="text-xs font-bold text-gray-900 mb-1">From: {mapOrigin}</p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{sAddr || origin}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Arrival</p>
                      <p className="text-xs font-bold text-gray-900 mb-1">To: {mapDestination}</p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{rAddr || dest}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                {[
                  {
                    label: "Total Time",
                    value: daysTransit ? `${daysTransit} day${daysTransit > 1 ? "s" : ""}` : "—"
                  },
                  { label: "Progress", value: `${progress}%` },
                  {
                    label: estDelivery ? "Est. Delivery" : "Updates",
                    value: estDelivery || String(timeline.length),
                    small: !!estDelivery,
                  },
                ].map(({ label, value, small }) => (
                  <div key={label} className="px-3 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-0.5">{label}</p>
                    <p className={`font-bold text-gray-800 truncate ${small ? "text-[11px]" : "text-xs"}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Shipment # */}
              <div className="px-5 py-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Shipment No</p>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3.5 py-3 border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">#{trackNum}</p>
                    <p className="font-mono text-[11px] tracking-[0.28em] text-gray-500 truncate">||| || ||| || ||| || ||</p>
                  </div>
                  <button onClick={copyTrack} className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors shrink-0">
                    {copied
                      ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                      : <Copy  className="w-3.5 h-3.5 text-gray-400" />
                    }
                  </button>
                </div>
              </div>

              {/* Partner tracking # */}
              {hasFwdInfo && !isDHL && fwdNumber && (
                <div className="px-5 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Partner Tracking</p>
                  <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3.5 py-2.5 border border-orange-100">
                    <span className="font-mono text-sm font-bold text-gray-800 truncate flex-1">{fwdNumber}</span>
                    <button onClick={copyFwd} className="p-1.5 hover:bg-orange-100 active:bg-orange-200 rounded-lg transition-colors shrink-0">
                      {copiedFwd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
                    </button>
                    {fwdLink && (
                      <a href={fwdLink} target="_blank" rel="noopener noreferrer"
                         className="p-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-lg transition-colors shrink-0">
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Recipient */}
              {(rName || rPhone) && (
                <div className="px-5 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-3">Recipient</p>
                  <div className="space-y-2">
                    {rName && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{rName}</span>
                      </div>
                    )}
                    {rPhone && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <span className="text-sm text-gray-700">{rPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Carrier */}
              {(carrier || shippingType) && (
                <div className="px-5 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Carrier</p>
                  <div className="flex flex-wrap gap-2">
                    {carrier     && <span className="text-xs font-semibold bg-blue-50  text-blue-700  border border-blue-100  px-3 py-1.5 rounded-lg">{carrier}</span>}
                    {shippingType && <span className="text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-100 px-3 py-1.5 rounded-lg">{shippingType}</span>}
                  </div>
                </div>
              )}

              {/* Errors */}
              {(error || fwdError) && (
                <div className="px-5 py-3 space-y-2">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-xs text-red-700 flex-1 min-w-0 break-words">{error}</p>
                      <button onClick={fetchVendor} className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 whitespace-nowrap shrink-0">
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </div>
                  )}
                  {fwdError && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
                      <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                      <p className="text-xs text-orange-700 flex-1 min-w-0 break-words">{fwdError}</p>
                      <button onClick={fetchForwarding} className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 whitespace-nowrap shrink-0">
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Timeline ── */}
              <div>
                {/* Header */}
                <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs font-bold text-gray-700 truncate">Shipment History</span>
                    <span className="text-[10px] text-gray-400 shrink-0">({timeline.length})</span>
                  </div>
                  {(vendorCnt > 0 || fwdCnt > 0) && (
                    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
                      <button
                        onClick={() => setActiveFilter("all")}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${activeFilter==="all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                      >All</button>
                      {vendorCnt > 0 && (
                        <button
                          onClick={() => setActiveFilter("vendor")}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${activeFilter==="vendor" ? "bg-indigo-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >Primary</button>
                      )}
                      {fwdCnt > 0 && (
                        <button
                          onClick={() => setActiveFilter("forwarding")}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${activeFilter==="forwarding" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >Partner</button>
                      )}
                    </div>
                  )}
                </div>

                {/* Events */}
                {anyLoading && timeline.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Loader2 className="w-7 h-7 text-indigo-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Fetching updates…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Package className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No updates yet</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([date, evts], gi) => (
                    <div key={date}>
                      {/* Date divider */}
                      <div className="px-5 py-1.5 flex items-center gap-1.5 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                        <Calendar className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{date}</span>
                      </div>

                      {/* Event rows */}
                      {evts.map((evt, idx) => {
                        const isFirst = gi === 0 && idx === 0;
                        return (
                          <div
                            key={`${evt.timestamp}-${idx}`}
                            className={`flex gap-3 px-5 py-2.5 transition-colors hover:bg-gray-50/70 active:bg-gray-100/60 ${isFirst ? "bg-violet-50/50" : ""}`}
                          >
                            {/* Icon + line */}
                            <div className="flex flex-col items-center shrink-0 pt-0.5">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                isFirst               ? "bg-white border-violet-500 text-violet-600"
                                : evt.source==="forwarding" ? "bg-white border-orange-300 text-orange-500"
                                : evt.source==="vendor"     ? "bg-white border-blue-300 text-blue-500"
                                :                             "bg-white border-gray-200 text-gray-400"
                              }`}>
                                {getStatusIcon(evt.status)}
                              </div>
                              {idx !== evts.length - 1 && (
                                <div className="w-px flex-1 bg-gray-100 mt-1 min-h-[10px]" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 py-0.5">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-xs font-bold leading-snug ${isFirst ? "text-violet-700" : "text-gray-800"}`}>
                                  {evt.status}
                                </p>
                                <time className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                                  {fmtTime(evt.timestamp)}
                                </time>
                              </div>
                              {evt.location && (
                                <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{evt.location}</span>
                                </p>
                              )}
                              {evt.comment && (
                                <p className="text-[11px] text-gray-500 italic mt-1 leading-snug">{evt.comment}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}

                {/* Bottom padding */}
                <div className="h-4" />
              </div>
            </div>

            {/* ── Footer action bar ── */}
            <div className="shrink-0 border-t border-gray-100 px-5 py-3.5 flex items-center gap-2.5 bg-white">
              <button
                onClick={() => { if (doVendor) fetchVendor(); if (doForwarding) fetchForwarding(); }}
                disabled={anyLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${anyLoading ? "animate-spin text-indigo-500" : ""}`} />
                <span className="truncate">{anyLoading ? "Refreshing…" : "Track Shipment"}</span>
              </button>

              <button
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm shrink-0"
              >
                <FaWhatsapp className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Share</span>
              </button>

              <button
                onClick={copyTrack}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm shrink-0"
              >
                {copied
                  ? <Check className="w-3.5 h-3.5 shrink-0" />
                  : <Copy  className="w-3.5 h-3.5 shrink-0" />
                }
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy ID"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center mt-3">
        Updated: {new Date().toLocaleString()}
      </p>
    </div>
  );
}
