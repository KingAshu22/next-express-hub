// components/TrackingDetails.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package, Truck, Plane, Home, CheckCircle, AlertCircle, Clock,
  MapPin, RefreshCw, Loader2, CircleDot, PackageX, Warehouse,
  ClipboardCheck, Navigation, Calendar, Copy, Check,
  ExternalLink, Globe, CalendarCheck, Route,
  User, Phone, ArrowRight, TrendingUp,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Barcode from "react-barcode";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const getStatusIcon = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("delivered"))        return <Home           className="w-4 h-4" />;
  if (s.includes("out for delivery")) return <Truck          className="w-4 h-4" />;
  if (s.includes("customs") || s.includes("clearance") || s.includes("brokerage"))
                                       return <ClipboardCheck className="w-4 h-4" />;
  if (s.includes("arrived") || s.includes("received") || s.includes("facility"))
                                       return <Warehouse      className="w-4 h-4" />;
  if (s.includes("departed") || s.includes("transit") || s.includes("dispatch") || s.includes("export"))
                                       return <Navigation     className="w-4 h-4" />;
  if (s.includes("flight") || s.includes("airport") || s.includes("hub"))
                                       return <Plane          className="w-4 h-4" />;
  if (s.includes("booked") || s.includes("created") || s.includes("label") || s.includes("pickup"))
                                       return <Package        className="w-4 h-4" />;
  if (s.includes("unsuccessful") || s.includes("failed") || s.includes("exception") || s.includes("delay"))
                                       return <PackageX       className="w-4 h-4" />;
  if (s.includes("processing") || s.includes("scan"))
                                       return <CircleDot      className="w-4 h-4" />;
  return <CheckCircle className="w-4 h-4" />;
};

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
  const p = String(input).match(
    /(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (p) {
    const [yr, mo, dy] =
      p[1].length === 4
        ? [+p[1], +p[2] - 1, +p[3]]
        : [+p[3], +p[2] - 1, +p[1]];
    return new Date(yr, mo, dy, p[4] || 0, p[5] || 0, p[6] || 0).getTime();
  }
  return 0;
};

const parseParcelsDate = (dateStr, timeStr) => {
  if (!dateStr) return 0;
  try {
    const dp = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (!dp) return 0;
    const months = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const mo = months[dp[2].toLowerCase().slice(0, 3)];
    let h = 0, m = 0;
    if (timeStr) {
      const tp = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (tp) { h = +tp[1]; m = +tp[2]; }
    }
    return new Date(+dp[3], mo, +dp[1], h, m).getTime();
  } catch { return 0; }
};

const parseEventTimestamp = (evt, softwareType) => {
  try {
    if (softwareType === "xpression" || softwareType === "itd") {
      const ds = evt.EventDate1 || evt.EventDate;
      const ts = evt.EventTime1 || evt.EventTime || "12:00 AM";
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

const fmtDate = (ts) =>
  !ts
    ? ""
    : new Date(ts).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

const fmtTime = (ts) =>
  !ts
    ? ""
    : new Date(ts).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

const groupByDate = (events) => {
  const g = {};
  events.forEach((e) => {
    const k = fmtDate(e.timestamp);
    if (!g[k]) g[k] = [];
    g[k].push(e);
  });
  return g;
};

const calcProgress = (status, events) => {
  const s = (status || "").toLowerCase();
  if (s.includes("delivered"))                          return 100;
  if (s.includes("out for delivery"))                   return 85;
  if (s.includes("customs") || s.includes("clearance")) return 65;
  if (s.includes("arrived") && events.length > 3)       return 55;
  if (s.includes("transit") || s.includes("departed"))  return 45;
  if (s.includes("flight") || s.includes("airport"))    return 35;
  if (events.length > 1)                                return 25;
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
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

const greatCircle = (lat1, lng1, lat2, lng2, n = 100) => {
  const φ1 = toRad(lat1), λ1 = toRad(lng1),
        φ2 = toRad(lat2), λ2 = toRad(lng2);
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((φ2 - φ1) / 2) ** 2 +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
      )
    );
  return Array.from({ length: n + 1 }, (_, i) => {
    const f = i / n;
    if (d === 0) return [lat1, lng1];
    const A = Math.sin((1 - f) * d) / Math.sin(d),
          B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    return [
      toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
      toDeg(Math.atan2(y, x)),
    ];
  });
};

const geocode = async (q) => {
  if (!q) return null;
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&accept-language=en`,
      {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "TrackingApp/1.0",
        },
      }
    );
    const d = await r.json();
    if (d?.[0])
      return {
        lat: +d[0].lat,
        lng: +d[0].lon,
        name: d[0].display_name.split(",")[0].trim(),
      };
  } catch {}
  return null;
};

// ─────────────────────────────────────────────
// MAP COMPONENT  (simple origin → destination route)
// ─────────────────────────────────────────────
const ShipmentMap = ({ origin, destination, progress, isDelivered }) => {
  const mapDiv      = useRef(null);
  const mapInst     = useRef(null);
  const boxMarker   = useRef(null);

  const [coords,    setCoords]    = useState(null);  // { from, to }
  const [geocoding, setGeocoding] = useState(true);

  // ── Geocode origin + destination ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGeocoding(true);
      const [from, to] = await Promise.all([
        geocode(origin),
        geocode(destination),
      ]);
      if (!cancelled && from && to) setCoords({ from, to });
      if (!cancelled) setGeocoding(false);
    })();
    return () => { cancelled = true; };
  }, [origin, destination]);

  // ── Render the map ──
  useEffect(() => {
    if (!coords || !mapDiv.current) return;
    let destroyed = false;

    import("leaflet").then((L) => {
      if (destroyed) return;
      delete L.Icon.Default.prototype._getIconUrl;

      const { from, to } = coords;
      const arc = greatCircle(from.lat, from.lng, to.lat, to.lng, 120);
      const clamped  = Math.min(Math.max(progress || 10, 0), 100);
      const boxIdx   = Math.floor((clamped / 100) * (arc.length - 1));
      const accent   = isDelivered ? "#10b981" : "#2563eb";

      if (!mapInst.current) {
        mapInst.current = L.map(mapDiv.current, {
          zoomControl:        false,
          scrollWheelZoom:    false,
          doubleClickZoom:    false,
          dragging:           false,
          attributionControl: false,
          tap:                true,
        });

        L.tileLayer(
          "https://tiles.stadiamaps.com/tiles/alidade_bright/{z}/{x}/{y}{r}.png",
          { zoom: 18 }
        ).addTo(mapInst.current);

        L.control
          .attribution({ position: "bottomright", prefix: false })
          .addAttribution("© Stadia Maps © OpenStreetMap")
          .addTo(mapInst.current);
      }

      const map = mapInst.current;

      // dashed full route
      L.polyline(arc, {
        color: "#cbd5e1", weight: 2.5, opacity: 0.85, dashArray: "6 8",
      }).addTo(map);

      // travelled portion
      L.polyline(arc.slice(0, boxIdx + 1), {
        color: accent, weight: 3.5, opacity: 1,
      }).addTo(map);

      // origin marker
      L.marker([from.lat, from.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(16,185,129,.6);"></div>`,
          iconAnchor: [7, 7],
        }),
      }).addTo(map).bindTooltip(`<b>${from.name}</b>`, { direction: "top", className: "tmap-tip" });

      // destination marker (pulsing)
      L.marker([to.lat, to.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;inset:0;background:rgba(37,99,235,.2);border-radius:50%;animation:tmap-pulse 1.8s ease-out infinite;"></div>
              <div style="width:12px;height:12px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(37,99,235,.5);z-index:1;"></div>
            </div>`,
          iconAnchor: [12, 12],
        }),
      }).addTo(map).bindTooltip(`<b>${to.name}</b>`, { direction: "top", className: "tmap-tip" });

      // moving box marker at the current progress point
      const boxHTML = `
        <div style="
          width:36px;height:36px;display:flex;align-items:center;justify-content:center;
          background:white;border-radius:50%;border:2.5px solid ${accent};
          box-shadow:0 4px 16px rgba(37,99,235,.3),0 1px 4px rgba(0,0,0,.1);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="${accent}"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/>
            <path d="M12 22V12"/>
          </svg>
        </div>`;
      if (boxMarker.current) { try { map.removeLayer(boxMarker.current); } catch {} }
      boxMarker.current = L.marker(arc[boxIdx], {
        icon: L.divIcon({ className: "", html: boxHTML, iconAnchor: [18, 18] }),
        zIndexOffset: 1000,
      }).addTo(map);

      map.fitBounds(
        L.latLngBounds([from.lat, from.lng], [to.lat, to.lng]).pad(0.3),
        { animate: false }
      );

      setTimeout(() => { try { map.invalidateSize(); } catch {} }, 100);
    });

    return () => { destroyed = true; };
  }, [coords, progress, isDelivered]);

  // cleanup on unmount
  useEffect(
    () => () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    },
    []
  );

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <style>{`
        .tmap-tip {
          background: white;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(0,0,0,.12);
          color: #0f172a;
          white-space: nowrap;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }
        .leaflet-tooltip-top::before { border-top-color: white; }
        @keyframes tmap-pulse {
          0%   { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(2.8); opacity: 0;   }
        }
        .leaflet-container        { font-family: inherit; background: #eef2f7; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution { font-size: 9px !important; opacity: 0.4; }
      `}</style>

      <div className="relative w-full h-full">
        <div ref={mapDiv} style={{ width: "100%", height: "100%" }} />

        {geocoding && (
          <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-lg border border-blue-100 flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-blue-500 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-slate-800">Plotting route…</p>
            <p className="text-xs text-slate-400 mt-1">
              {origin} → {destination}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// PROGRESS STEPS COMPONENT
// ─────────────────────────────────────────────
const ProgressSteps = ({ progress, isDelivered }) => {
  const steps = [
    { label: "Booked",     pct: 10,  icon: Package        },
    { label: "In Transit", pct: 45,  icon: Truck          },
    { label: "Customs",    pct: 65,  icon: ClipboardCheck },
    { label: "Delivery",   pct: 85,  icon: Navigation     },
    { label: "Delivered",  pct: 100, icon: Home           },
  ];

  return (
    <div className="px-5 py-5">
      <div className="relative">
        {/* Track bar */}
        <div className="absolute top-5 left-5 right-5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: isDelivered
                ? "linear-gradient(90deg,#34d399,#059669)"
                : "linear-gradient(90deg,#3b82f6,#2563eb)",
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, i) => {
            const done   = progress >= step.pct;
            const active = !done && progress >= (steps[i - 1]?.pct ?? 0);
            const Icon   = step.icon;
            return (
              <div key={step.label} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    done
                      ? isDelivered
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                      : active
                      ? "bg-white border-blue-400 text-blue-500 shadow-sm"
                      : "bg-white border-slate-200 text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[11px] font-semibold text-center leading-tight ${
                    done
                      ? isDelivered
                        ? "text-emerald-600"
                        : "text-blue-600"
                      : active
                      ? "text-blue-500"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SECTION HEADER (reusable)
// ─────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle, right, iconBg = "bg-blue-50", iconColor = "text-blue-600" }) => (
  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-slate-900 leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function TrackingDetails({ parcelDetails }) {
  const [vendorData,     setVendorData]     = useState(null);
  const [forwardingData, setForwardingData] = useState(null);
  const [error,          setError]          = useState(null);
  const [fwdError,       setFwdError]       = useState(null);
  const [isLoading,      setIsLoading]      = useState(false);
  const [isFwdLoading,   setIsFwdLoading]   = useState(false);
  const [timeline,       setTimeline]       = useState([]);
  const [copied,         setCopied]         = useState(false);
  const [copiedFwd,      setCopiedFwd]      = useState(false);

  const hasVendor    = parcelDetails?.cNoteNumber && parcelDetails?.cNoteVendorName;
  const fwdNumber    = parcelDetails?.forwardingNumber;
  const fwdLink      = parcelDetails?.forwardingLink || "";
  const fwdCarrier   = detectCarrier(fwdLink);
  const isDHL        = fwdNumber && fwdLink.toLowerCase().includes("dhl") && fwdCarrier === "dhl";
  const doVendor     = hasVendor || isDHL;
  const doForwarding = fwdNumber && !isDHL;

  const trackNum           = parcelDetails?.trackingNumber;
  const originCountry      = parcelDetails?.sender?.country   || "";
  const destinationCountry = parcelDetails?.receiver?.country || "";
  const origin             = parcelDetails?.sender?.city    || parcelDetails?.sender?.country    || "Origin";
  const dest               = parcelDetails?.receiver?.city  || parcelDetails?.receiver?.country  || "Destination";
  const mapOrigin          = originCountry || origin;
  const mapDestination     = destinationCountry || dest;
  const hasFwdInfo         = !!(fwdNumber || fwdLink);

  const sName  = parcelDetails?.sender?.name    || "";
  const sPhone = parcelDetails?.sender?.phone   || "";
  const rName  = parcelDetails?.receiver?.name  || "";
  const rPhone = parcelDetails?.receiver?.phone || "";
  const sAddr  = [
    parcelDetails?.sender?.address,
    parcelDetails?.sender?.city,
    parcelDetails?.sender?.state,
    parcelDetails?.sender?.country,
  ]
    .filter(Boolean)
    .join(", ");
  const rAddr = [
    parcelDetails?.receiver?.address,
    parcelDetails?.receiver?.address2,
    parcelDetails?.receiver?.city,
    parcelDetails?.receiver?.state,
    parcelDetails?.receiver?.zip,
    parcelDetails?.receiver?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const copyTrack = () => {
    navigator.clipboard.writeText(trackNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyFwd = () => {
    if (fwdNumber) {
      navigator.clipboard.writeText(fwdNumber);
      setCopiedFwd(true);
      setTimeout(() => setCopiedFwd(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href.replace(/^https?:\/\//, "")
        : "";
    const loc = timeline[0]?.location || "";
    const msg = `📦 *Shipment Update*\n──────────\n🆔 *ID:* ${trackNum}\n🚩 *Route:* ${origin} → ${dest}\n📊 *Status:* ${
      timeline[0]?.status || "In Transit"
    }\n${loc ? `📍 Location: ${loc}\n` : ""}──────────\n🔗 ${url}`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const fetchVendor = async () => {
    if (!doVendor) return;
    setIsLoading(true);
    setError(null);
    try {
      const payload = isDHL
        ? { awbNumber: fwdNumber, forceSoftwareType: "dhl" }
        : {
            awbNumber:  parcelDetails?.cNoteNumber,
            vendorId:   parcelDetails?.integratedVendorId,
            vendorName: parcelDetails?.cNoteVendorName,
          };
      const r   = await fetch("/api/vendor-integrations/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const res = await r.json();
      if (!res.success) { setError(res.error || "Failed"); return; }
      setVendorData(res);
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchForwarding = async () => {
    if (!doForwarding) return;
    setIsFwdLoading(true);
    setFwdError(null);
    try {
      const r   = await fetch("/api/vendor-integrations/tracking/forwarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: fwdNumber }),
      });
      const res = await r.json();
      if (!res.success) { setFwdError(res.error || "Failed"); return; }
      setForwardingData(res);
    } catch (e) {
      setFwdError(e.message || "Failed");
    } finally {
      setIsFwdLoading(false);
    }
  };

  useEffect(() => { if (doVendor)     fetchVendor();     }, [doVendor,     parcelDetails]);
  useEffect(() => { if (doForwarding) fetchForwarding(); }, [doForwarding, fwdNumber]);

  useEffect(() => {
    const all = [];

    if (vendorData?.events?.length)
      vendorData.events.forEach((e) =>
        all.push({
          timestamp: parseEventTimestamp(e, vendorData.softwareType),
          status:    (e.Status    || e.status   || "Update").trim(),
          location:  (e.Location  || e.location || "").trim(),
          comment:    e.Remark    || e.comment   || "",
          source:    "vendor",
        })
      );

    if (parcelDetails?.parcelStatus?.length)
      parcelDetails.parcelStatus.forEach((e) =>
        all.push({
          timestamp: parseInternalDate(e.timestamp),
          status:    (e.status   || "Update").trim(),
          location:  (e.location || "").trim(),
          comment:    e.comment  || "",
          source:    "database",
        })
      );

    if (forwardingData?.events?.length)
      forwardingData.events.forEach((e) =>
        all.push({
          timestamp: parseParcelsDate(e.date, e.time),
          status:    (e.status   || "Update").trim(),
          location:  (e.location || "").trim(),
          comment:   "",
          source:    "forwarding",
        })
      );

    all.sort((a, b) => b.timestamp - a.timestamp);
    setTimeline(
      all.filter(
        (e, i, arr) =>
          i === 0 ||
          !(
            e.status.toLowerCase() === arr[i - 1].status.toLowerCase() &&
            e.location.toLowerCase() === arr[i - 1].location.toLowerCase() &&
            Math.abs(e.timestamp - arr[i - 1].timestamp) < 60000
          )
      )
    );
  }, [vendorData, forwardingData, parcelDetails]);

  const latestStatus = timeline[0]?.status   || "Awaiting Updates";
  const latestLoc    = timeline[0]?.location || "";
  const isDelivered  = latestStatus.toLowerCase().includes("delivered");
  const progress     = calcProgress(latestStatus, timeline);
  const grouped      = groupByDate(timeline);
  const anyLoading   = isLoading || isFwdLoading;

  const estDelivery  = forwardingData?.estimatedDelivery;
  const shippingType = forwardingData?.shippingType;
  const daysTransit  = forwardingData?.daysInTransit;
  const carrier      = forwardingData?.carrier;

  if (!parcelDetails) return null;

  const refreshAll = () => {
    if (doVendor)     fetchVendor();
    if (doForwarding) fetchForwarding();
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ──────────────────────────────────────
            CONCISE STATUS BAR
        ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
            {/* Left: current status */}
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDelivered ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                }`}
              >
                {isDelivered ? <Home className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      isDelivered
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isDelivered ? "bg-emerald-500" : "bg-blue-500 animate-pulse"}`} />
                    {isDelivered ? "Delivered" : "In Transit"}
                  </span>
                  <span className="text-xs text-slate-400">{progress}%</span>
                </div>
                <p className="text-lg font-bold text-slate-900 leading-tight truncate">
                  {anyLoading && timeline.length === 0 ? "Updating…" : latestStatus}
                </p>
                {latestLoc && (
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    {latestLoc}
                  </p>
                )}
              </div>
            </div>

            {/* Right: tracking id + actions */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Tracking ID</span>
                <span className="text-sm font-bold text-slate-900 tracking-wide">#{trackNum}</span>
              </div>
              <button
                onClick={copyTrack}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
                title="Copy tracking number"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span className="hidden xs:inline">{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={shareWhatsApp}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl px-3 py-2 transition-colors"
                title="Share via WhatsApp"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span className="hidden xs:inline">Share</span>
              </button>
              <button
                onClick={refreshAll}
                disabled={anyLoading}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                title="Refresh tracking"
              >
                <RefreshCw className={`w-4 h-4 ${anyLoading ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Route strip */}
          <div className="border-t border-slate-100 px-5 py-3 flex items-center gap-3 bg-slate-50/60">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700 truncate">{mapOrigin}</span>
            </div>
            <div className="flex-1 flex items-center gap-1 min-w-0">
              <div className="flex-1 h-px bg-slate-200" />
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700 truncate">{mapDestination}</span>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────
            STAT CARDS
        ────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon:    Clock,
              label:   "In Transit",
              value:   daysTransit ? `${daysTransit} days` : "—",
              iconBg:  "bg-blue-50",
              iconClr: "text-blue-600",
            },
            {
              icon:    TrendingUp,
              label:   "Progress",
              value:   `${progress}%`,
              iconBg:  "bg-indigo-50",
              iconClr: "text-indigo-600",
            },
            {
              icon:    Route,
              label:   "Events",
              value:   String(timeline.length),
              iconBg:  "bg-violet-50",
              iconClr: "text-violet-600",
            },
            {
              icon:    CalendarCheck,
              label:   estDelivery ? "Est. Arrival" : "Status",
              value:   estDelivery
                ? estDelivery.length > 10
                  ? estDelivery.slice(0, 10)
                  : estDelivery
                : isDelivered
                ? "Delivered"
                : "Active",
              iconBg:  "bg-emerald-50",
              iconClr: "text-emerald-600",
            },
          ].map(({ icon: Icon, label, value, iconBg, iconClr }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3"
            >
              <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconClr}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ──────────────────────────────────────
            MAIN GRID
            Left: Map + Forwarding + Addresses
            Right: Shipment History
        ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ════ LEFT COLUMN ════ */}
          <div className="flex flex-col gap-6 min-w-0">

            {/* MAP CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <SectionHeader
                icon={Globe}
                title="Live Route"
                subtitle={`${mapOrigin} → ${mapDestination}`}
                right={
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${
                      isDelivered
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isDelivered ? "✓ Delivered" : `${progress}%`}
                  </span>
                }
              />

              <div className="h-[340px] sm:h-[400px]">
                <ShipmentMap
                  origin={mapOrigin}
                  destination={mapDestination}
                  progress={progress}
                  isDelivered={isDelivered}
                />
              </div>

              <div className="border-t border-slate-100">
                <ProgressSteps progress={progress} isDelivered={isDelivered} />
              </div>
            </div>

            {/* ── FORWARDING / CARRIER CARD (below the map) ── */}
            {(fwdNumber || fwdLink || carrier || shippingType) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <SectionHeader
                  icon={Package}
                  title="Forwarding & Carrier"
                  subtitle="Track this shipment with the partner carrier"
                  iconBg="bg-amber-50"
                  iconColor="text-amber-600"
                />

                <div className="p-5 space-y-4">
                  {/* Carrier chips */}
                  {(carrier || shippingType) && (
                    <div className="flex flex-wrap gap-2">
                      {carrier && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-xl">
                          <Truck className="w-4 h-4" /> {carrier}
                        </span>
                      )}
                      {shippingType && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl">
                          <Package className="w-4 h-4" /> {shippingType}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Forwarding number — clearly explained */}
                  {fwdNumber && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                      <p className="text-xs uppercase tracking-wider text-amber-700 font-semibold mb-2">
                        Forwarding Number
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-900 tracking-wide break-all flex-1 min-w-0">
                          {fwdNumber}
                        </span>
                        <button
                          onClick={copyFwd}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 transition-colors shrink-0"
                          title="Copy forwarding number"
                        >
                          {copiedFwd
                            ? <Check className="w-4 h-4 text-emerald-600" />
                            : <Copy  className="w-4 h-4 text-amber-600" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Use this number on the carrier's website to view the latest live updates directly from them.
                      </p>
                    </div>
                  )}

                  {/* Forwarding link button — clear CTA */}
                  {fwdLink && (
                    <a
                      href={fwdLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-3 transition-colors shadow-sm shadow-blue-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Track on Carrier Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── SENDER / RECEIVER DETAILS (below) ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <SectionHeader
                icon={MapPin}
                title="Sender & Receiver"
                subtitle="Pickup and delivery details"
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {/* SENDER */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">From (Sender)</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{mapOrigin}</p>
                  {sName && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-700">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium">{sName}</span>
                    </div>
                  )}
                  {sPhone && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{sPhone}</span>
                    </div>
                  )}
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{sAddr || origin}</p>
                </div>

                {/* RECEIVER */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">To (Receiver)</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{mapDestination}</p>
                  {rName && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-700">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium">{rName}</span>
                    </div>
                  )}
                  {rPhone && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{rPhone}</span>
                    </div>
                  )}
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{rAddr || dest}</p>
                </div>
              </div>
            </div>

            {/* BARCODE CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Shipment Barcode</p>
              <div className="bg-white rounded-xl px-3 py-2 flex flex-col items-center">
                <Barcode
                  value={String(trackNum || "0")}
                  width={1.6}
                  height={48}
                  margin={0}
                  displayValue={false}
                  background="transparent"
                  lineColor="#0f172a"
                />
                <p className="text-sm font-bold text-slate-900 tracking-widest mt-2">#{trackNum}</p>
              </div>
            </div>

            {/* ERRORS */}
            {(error || fwdError) && (
              <div className="space-y-3">
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-sm text-red-700 flex-1 min-w-0 break-words">{error}</p>
                    <button
                      onClick={fetchVendor}
                      className="text-sm font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 whitespace-nowrap shrink-0 bg-red-100 hover:bg-red-200 px-3 py-2 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                  </div>
                )}
                {fwdError && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-sm text-amber-700 flex-1 min-w-0 break-words">{fwdError}</p>
                    <button
                      onClick={fetchForwarding}
                      className="text-sm font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1 whitespace-nowrap shrink-0 bg-amber-100 hover:bg-amber-200 px-3 py-2 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN — SHIPMENT HISTORY ════ */}
          <div className="min-w-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:sticky lg:top-6">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-slate-900 leading-tight">Shipment History</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {timeline.length} event{timeline.length !== 1 ? "s" : ""} tracked
                    </p>
                  </div>
                </div>
                <button
                  onClick={refreshAll}
                  disabled={anyLoading}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 shrink-0"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${anyLoading ? "animate-spin text-blue-600" : ""}`} />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto max-h-[640px] overscroll-contain">
                {anyLoading && timeline.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-5">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                      <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Fetching updates…</p>
                    <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
                  </div>
                ) : timeline.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-5">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                      <Package className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">No updates yet</p>
                    <p className="text-xs text-slate-400 mt-1">Check back soon</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {Object.entries(grouped).map(([date, evts], gi) => (
                      <div key={date}>
                        {/* Date separator */}
                        <div className="sticky top-0 z-10 px-5 py-2.5 flex items-center gap-3 bg-white/95 backdrop-blur-sm">
                          <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {date}
                            </span>
                          </div>
                          <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        {evts.map((evt, idx) => {
                          const isFirst = gi === 0 && idx === 0;
                          const isLast  = idx === evts.length - 1;
                          return (
                            <div
                              key={`${evt.timestamp}-${idx}`}
                              className={`flex gap-3.5 px-5 py-3.5 transition-colors hover:bg-slate-50 ${
                                isFirst ? "bg-blue-50/50" : ""
                              }`}
                            >
                              {/* Icon + line */}
                              <div className="flex flex-col items-center shrink-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 shadow-sm shrink-0 ${
                                    isFirst
                                      ? "bg-blue-600 border-blue-600 text-white shadow-blue-200"
                                      : evt.source === "forwarding"
                                      ? "bg-white border-amber-300 text-amber-500"
                                      : evt.source === "vendor"
                                      ? "bg-white border-blue-300 text-blue-500"
                                      : "bg-white border-slate-200 text-slate-400"
                                  }`}
                                >
                                  {getStatusIcon(evt.status)}
                                </div>
                                {!isLast && (
                                  <div className="w-px flex-1 bg-gradient-to-b from-slate-200 to-transparent mt-1.5 min-h-[14px]" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pb-0.5">
                                <div className="flex items-start justify-between gap-3">
                                  <p
                                    className={`text-sm font-semibold leading-snug ${
                                      isFirst ? "text-blue-700" : "text-slate-800"
                                    }`}
                                  >
                                    {evt.status}
                                  </p>
                                  <div className="shrink-0 flex flex-col items-end gap-1">
                                    <time className="text-xs text-slate-400 whitespace-nowrap font-medium">
                                      {fmtTime(evt.timestamp)}
                                    </time>
                                    {isFirst && (
                                      <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                                        Latest
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {evt.location && (
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                                    <span className="truncate">{evt.location}</span>
                                  </p>
                                )}
                                {evt.comment && (
                                  <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed">
                                    {evt.comment}
                                  </p>
                                )}
                                {evt.source === "forwarding" && (
                                  <span className="inline-block mt-2 text-[10px] bg-amber-50 text-amber-600 border border-amber-100 font-semibold px-2 py-0.5 rounded-full">
                                    Partner Carrier
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div className="h-3" />
                  </div>
                )}
              </div>

              {/* Footer refresh */}
              <div className="shrink-0 border-t border-slate-100 px-4 py-3 bg-slate-50/60">
                <button
                  onClick={refreshAll}
                  disabled={anyLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    anyLoading
                      ? "bg-blue-50 text-blue-400 cursor-not-allowed"
                      : isDelivered
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                  }`}
                >
                  {anyLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Refreshing…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Refresh Tracking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-slate-400 font-medium">
            Last updated: {new Date().toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-slate-400 font-medium">Live tracking active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
