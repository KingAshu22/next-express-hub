// components/TrackingDetails.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package, Truck, Plane, Home, CheckCircle, AlertCircle, Clock,
  MapPin, RefreshCw, Loader2, CircleDot, PackageX, Warehouse,
  ClipboardCheck, Navigation, Calendar, MessageSquare, Copy, Check,
  ExternalLink, Share2, Globe, CalendarCheck, Timer, Route,
  Building2, User, Phone, MoreHorizontal, ArrowRight, TrendingUp,
  Shield, Zap, Star, Info, ChevronDown, ChevronRight,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Barcode from "react-barcode";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const getStatusIcon = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("delivered"))        return <Home           className="w-3.5 h-3.5" />;
  if (s.includes("out for delivery")) return <Truck          className="w-3.5 h-3.5" />;
  if (s.includes("customs") || s.includes("clearance") || s.includes("brokerage"))
                                       return <ClipboardCheck className="w-3.5 h-3.5" />;
  if (s.includes("arrived") || s.includes("received") || s.includes("facility"))
                                       return <Warehouse      className="w-3.5 h-3.5" />;
  if (s.includes("departed") || s.includes("transit") || s.includes("dispatch") || s.includes("export"))
                                       return <Navigation     className="w-3.5 h-3.5" />;
  if (s.includes("flight") || s.includes("airport") || s.includes("hub"))
                                       return <Plane          className="w-3.5 h-3.5" />;
  if (s.includes("booked") || s.includes("created") || s.includes("label") || s.includes("pickup"))
                                       return <Package        className="w-3.5 h-3.5" />;
  if (s.includes("unsuccessful") || s.includes("failed") || s.includes("exception") || s.includes("delay"))
                                       return <PackageX       className="w-3.5 h-3.5" />;
  if (s.includes("processing") || s.includes("scan"))
                                       return <CircleDot      className="w-3.5 h-3.5" />;
  return <CheckCircle className="w-3.5 h-3.5" />;
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

  useEffect(() => {
    if (!coords || !mapDiv.current) return;
    let destroyed = false;

    import("leaflet").then((L) => {
      if (destroyed) return;
      delete L.Icon.Default.prototype._getIconUrl;

      const { from, to } = coords;
      const arc = greatCircle(from.lat, from.lng, to.lat, to.lng, 120);
      arcRef.current = arc;

      const clamped  = Math.min(Math.max(progress || 10, 0), 100);
      const planeIdx = Math.floor((clamped / 100) * (arc.length - 1));

      if (!mapInst.current) {
        mapInst.current = L.map(mapDiv.current, {
          zoomControl:       false,
          scrollWheelZoom:   false,
          doubleClickZoom:   false,
          dragging:          false,
          attributionControl: false,
          tap:               true,
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

      [ghostLine, travelLine, planeMarker].forEach((ref) => {
        if (ref.current) {
          try { map.removeLayer(ref.current); } catch {}
          ref.current = null;
        }
      });

      ghostLine.current = L.polyline(arc, {
        color:     "#cbd5e1",
        weight:    2.5,
        opacity:   0.8,
        dashArray: "6 8",
      }).addTo(map);

      travelLine.current = L.polyline(arc.slice(0, planeIdx + 1), {
        color:   isDelivered ? "#10b981" : "#6366f1",
        weight:  3.5,
        opacity: 1,
      }).addTo(map);

      // Origin marker
      L.marker([from.lat, from.lng], {
        icon: L.divIcon({
          className: "",
          html: `
            <div style="
              width:14px;height:14px;
              background:#10b981;border:3px solid white;border-radius:50%;
              box-shadow:0 2px 8px rgba(16,185,129,.6);
            "></div>`,
          iconAnchor: [7, 7],
        }),
      })
        .addTo(map)
        .bindTooltip(`<b>${from.name}</b>`, {
          direction: "top",
          className: "tmap-tip",
        });

      // Destination marker
      L.marker([to.lat, to.lng], {
        icon: L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;inset:0;background:rgba(99,102,241,.2);border-radius:50%;animation:tmap-pulse 1.8s ease-out infinite;"></div>
              <div style="width:12px;height:12px;background:#6366f1;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(99,102,241,.5);z-index:1;"></div>
            </div>`,
          iconAnchor: [12, 12],
        }),
      })
        .addTo(map)
        .bindTooltip(`<b>${to.name}</b>`, {
          direction: "top",
          className: "tmap-tip",
        });

      const planePos = arc[planeIdx];
      const accent   = isDelivered ? "#10b981" : "#6366f1";

      const makePlaneHTML = () => `
        <div style="
          width:36px;height:36px;
          display:flex;align-items:center;justify-content:center;
          background:white;border-radius:50%;
          border:2.5px solid ${accent};
          box-shadow:0 4px 16px rgba(99,102,241,.3),0 1px 4px rgba(0,0,0,.1);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="${accent}"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-2 0-4 1-4 1L7 8.2l-4.3-.4c-.5-.1-.9.3-.9.8l.3 1.3 4.3 1.7 1.7 4.3 1.3.3c.5.1.9-.4.8-.9L10 11l4-2.5"/>
          </svg>
        </div>`;

      planeMarker.current = L.marker(planePos, {
        icon: L.divIcon({
          className:  "",
          html:       makePlaneHTML(),
          iconAnchor: [18, 18],
        }),
        zIndexOffset: 1000,
      }).addTo(map);

      let frame = 0;
      const RANGE = 4;
      const animate = () => {
        frame = (frame + 1) % 360;
        const osc = Math.sin((frame * Math.PI) / 180) * RANGE;
        const idx = Math.max(
          0,
          Math.min(arc.length - 1, Math.round(planeIdx + osc))
        );
        if (planeMarker.current) planeMarker.current.setLatLng(arc[idx]);
        rafId.current = requestAnimationFrame(animate);
      };

      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(animate);

      map.fitBounds(
        L.latLngBounds([from.lat, from.lng], [to.lat, to.lng]).pad(0.28),
        { animate: true }
      );

      setTimeout(() => { try { map.invalidateSize(); } catch {} }, 100);
    });

    return () => {
      destroyed = true;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [coords, progress, isDelivered]);

  useEffect(
    () => () => {
      if (rafId.current)   cancelAnimationFrame(rafId.current);
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
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(0,0,0,.12);
          color: #1e1b4b;
          white-space: nowrap;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }
        .leaflet-tooltip-top::before { border-top-color: white; }
        @keyframes tmap-pulse {
          0%   { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(2.8); opacity: 0;   }
        }
        .leaflet-container        { font-family: inherit; background: #f1f5f9; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution { font-size: 9px !important; opacity: 0.4; }
      `}</style>

      <div className="relative w-full h-full">
        <div ref={mapDiv} style={{ width: "100%", height: "100%" }} />

        {geocoding && (
          <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-lg border border-indigo-100 flex items-center justify-center mb-3">
              <Plane className="w-6 h-6 text-indigo-500 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Plotting route…</p>
            <p className="text-xs text-gray-400 mt-1">
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
    { label: "Customs",    pct: 65,  icon: ClipboardCheck  },
    { label: "Delivery",   pct: 85,  icon: Navigation     },
    { label: "Delivered",  pct: 100, icon: Home           },
  ];

  return (
    <div className="px-5 py-4">
      <div className="relative">
        {/* Track bar */}
        <div className="absolute top-4 left-4 right-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: isDelivered
                ? "linear-gradient(90deg,#10b981,#059669)"
                : "linear-gradient(90deg,#818cf8,#6366f1)",
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
              <div key={step.label} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    done
                      ? isDelivered
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-200"
                      : active
                      ? "bg-white border-indigo-400 text-indigo-500 shadow-sm"
                      : "bg-white border-gray-200 text-gray-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-[9px] font-semibold text-center leading-tight ${
                    done
                      ? isDelivered
                        ? "text-emerald-600"
                        : "text-indigo-600"
                      : active
                      ? "text-indigo-400"
                      : "text-gray-300"
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
  const [activeFilter,   setActiveFilter]   = useState("all");

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
    }\n${loc ? `📍 *Location:* ${loc}\n` : ""}──────────\n🔗 ${url}`;
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

  const filtered     = activeFilter === "all" ? timeline : timeline.filter((e) => e.source === activeFilter);
  const latestStatus = timeline[0]?.status   || "Awaiting Updates";
  const latestLoc    = timeline[0]?.location || "";
  const isDelivered  = latestStatus.toLowerCase().includes("delivered");
  const progress     = calcProgress(latestStatus, timeline);
  const grouped      = groupByDate(filtered);
  const vendorCnt    = timeline.filter((e) => e.source === "vendor").length;
  const fwdCnt       = timeline.filter((e) => e.source === "forwarding").length;
  const anyLoading   = isLoading || isFwdLoading;

  const estDelivery  = forwardingData?.estimatedDelivery;
  const shippingType = forwardingData?.shippingType;
  const daysTransit  = forwardingData?.daysInTransit;
  const carrier      = forwardingData?.carrier;

  if (!parcelDetails) return null;

  return (
    <div
      className="w-full min-h-screen font-sans"
      style={{
        background: "linear-gradient(135deg,#f0f4ff 0%,#f8faff 50%,#faf0ff 100%)",
      }}
    >
      {/* ── PAGE WRAPPER ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-8 py-5 sm:py-7">

        {/* ── TOP HERO BAR ── */}
        <div
          className="mb-5 rounded-2xl overflow-hidden shadow-xl relative"
          style={{
            background: isDelivered
              ? "linear-gradient(135deg,#064e3b,#065f46,#047857)"
              : "linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)",
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle,white,transparent)" }}
            />
            <div
              className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle,white,transparent)" }}
            />
          </div>

          <div className="relative px-5 py-5 sm:px-7 flex flex-wrap items-center justify-between gap-4">
            {/* Left: Status */}
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDelivered ? "bg-emerald-400/20" : "bg-white/10"
                }`}
              >
                {isDelivered
                  ? <Home  className="w-6 h-6 text-white" />
                  : <Truck className="w-6 h-6 text-white" />}
              </div>
              <div className="min-w-0">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
                  Current Status
                </p>
                <p className="text-white text-lg sm:text-xl font-bold leading-tight truncate">
                  {anyLoading ? "Updating…" : latestStatus}
                </p>
                {latestLoc && (
                  <p className="text-white/70 text-xs flex items-center gap-1.5 mt-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {latestLoc}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Shipment ID + Barcode Card — now includes forwarding number below */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 flex flex-col items-center shrink-0">
              <p className="text-white/60 text-[9px] uppercase tracking-widest font-semibold mb-2">
                Shipment ID
              </p>

              {/* Tracking number barcode */}
              <div className="bg-white rounded-xl px-3 py-2 flex flex-col items-center">
                <Barcode
                  value={String(trackNum || "0")}
                  width={1.4}
                  height={36}
                  margin={0}
                  displayValue={false}
                  background="transparent"
                  lineColor="#1e1b4b"
                />
                <p className="text-xs font-bold text-gray-900 tracking-wider mt-1.5">
                  #{trackNum}
                </p>
              </div>

              {/* Forwarding number — shown directly below tracking number */}
              {fwdNumber && (
                <div className="mt-2.5 w-full">
                  <p className="text-white/50 text-[9px] uppercase tracking-widest font-semibold text-center mb-1.5">
                    Forwarding No.
                  </p>
                  <div className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 transition-colors rounded-xl px-3 py-2 border border-white/20">
                    <Package className="w-3 h-3 text-orange-300 shrink-0" />
                    <span className="font-mono text-xs font-semibold text-white/90 truncate flex-1 min-w-0">
                      {fwdNumber}
                    </span>
                    <button
                      onClick={copyFwd}
                      className="p-1 hover:bg-white/20 rounded-md transition-colors shrink-0"
                      title="Copy forwarding number"
                    >
                      {copiedFwd
                        ? <Check        className="w-3 h-3 text-emerald-400" />
                        : <Copy         className="w-3 h-3 text-white/60"    />}
                    </button>
                    {fwdLink && (
                      <a
                        href={fwdLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 bg-orange-500 hover:bg-orange-600 rounded-md transition-colors shrink-0"
                        title="Track with carrier"
                      >
                        <ExternalLink className="w-3 h-3 text-white" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={copyTrack}
                  className="flex items-center gap-1.5 text-white/80 hover:text-white text-[10px] font-semibold transition-colors bg-white/10 hover:bg-white/20 rounded-lg px-2.5 py-1.5"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={shareWhatsApp}
                  className="flex items-center gap-1.5 text-white/80 hover:text-white text-[10px] font-semibold transition-colors bg-white/10 hover:bg-white/20 rounded-lg px-2.5 py-1.5"
                >
                  <FaWhatsapp className="w-3 h-3" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Route strip */}
          <div className="border-t border-white/10 px-5 sm:px-7 py-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-white/90 text-sm font-semibold truncate">{mapOrigin}</span>
            </div>
            <div className="flex-1 flex items-center gap-0.5 min-w-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                />
              ))}
              <ArrowRight className="w-3.5 h-3.5 text-white/50 shrink-0 mx-1" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-indigo-300 shrink-0" />
              <span className="text-white/90 text-sm font-semibold truncate">{mapDestination}</span>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-5">

          {/* ════ LEFT COLUMN ════ */}
          <div className="flex flex-col gap-5 min-w-0">

            {/* MAP CARD — height increased to 60vh */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Live Route</p>
                    <p className="text-[10px] text-gray-400">{mapOrigin} → {mapDestination}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    isDelivered
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {isDelivered ? "✓ Delivered" : `${progress}%`}
                </span>
              </div>

              {/* ── MAP — increased to 60vh (was ~300–360px ≈ 45%) ── */}
              <div className="h-[60vh] min-h-[320px] max-h-[600px]">
                <ShipmentMap
                  origin={mapOrigin}
                  destination={mapDestination}
                  progress={progress}
                  isDelivered={isDelivered}
                />
              </div>

              {/* Progress steps immediately below the map */}
              <div className="border-t border-gray-100">
                <ProgressSteps progress={progress} isDelivered={isDelivered} />
              </div>
            </div>

            {/* STATS CARDS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon:    Clock,
                  label:   "In Transit",
                  value:   daysTransit ? `${daysTransit}d` : "—",
                  color:   "blue",
                  bg:      "bg-blue-50",
                  iconClr: "text-blue-500",
                  valClr:  "text-blue-700",
                },
                {
                  icon:    TrendingUp,
                  label:   "Progress",
                  value:   `${progress}%`,
                  color:   "indigo",
                  bg:      "bg-indigo-50",
                  iconClr: "text-indigo-500",
                  valClr:  "text-indigo-700",
                },
                {
                  icon:    Route,
                  label:   "Events",
                  value:   String(timeline.length),
                  color:   "violet",
                  bg:      "bg-violet-50",
                  iconClr: "text-violet-500",
                  valClr:  "text-violet-700",
                },
                {
                  icon:    CalendarCheck,
                  label:   estDelivery ? "Est. Arrival" : "Status",
                  value:   estDelivery
                    ? estDelivery.length > 10
                      ? estDelivery.slice(0, 10)
                      : estDelivery
                    : isDelivered
                    ? "Done"
                    : "Active",
                  color:   "emerald",
                  bg:      "bg-emerald-50",
                  iconClr: "text-emerald-500",
                  valClr:  "text-emerald-700",
                },
              ].map(({ icon: Icon, label, value, bg, iconClr, valClr }) => (
                <div
                  key={label}
                  className={`${bg} rounded-2xl px-4 py-4 flex flex-col gap-2`}
                >
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Icon className={`w-4 h-4 ${iconClr}`} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                      {label}
                    </p>
                    <p className={`text-base font-bold mt-0.5 ${valClr}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CARRIER / FORWARDING INFO */}
            {(carrier || shippingType || (hasFwdInfo && !isDHL && fwdNumber)) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {(carrier || shippingType) && (
                  <div className="px-5 py-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-3">
                      Carrier Info
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {carrier && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-xl">
                          <Truck className="w-3 h-3" />{carrier}
                        </span>
                      )}
                      {shippingType && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-xl">
                          <Package className="w-3 h-3" />{shippingType}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {hasFwdInfo && !isDHL && fwdNumber && (
                  <div className="px-5 py-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-3">
                      Forwarding Tracking
                    </p>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl px-3.5 py-3 border border-orange-100">
                      <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <span className="font-mono text-sm font-semibold text-gray-800 truncate flex-1">
                        {fwdNumber}
                      </span>
                      <button
                        onClick={copyFwd}
                        className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors shrink-0"
                        title="Copy"
                      >
                        {copiedFwd
                          ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                          : <Copy  className="w-3.5 h-3.5 text-orange-500" />}
                      </button>
                      {fwdLink && (
                        <a
                          href={fwdLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shrink-0"
                          title="Track externally"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-white" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ERRORS */}
            {(error || fwdError) && (
              <div className="space-y-2">
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-xs text-red-700 flex-1 min-w-0 break-words">{error}</p>
                    <button
                      onClick={fetchVendor}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 whitespace-nowrap shrink-0 bg-red-100 hover:bg-red-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                )}
                {fwdError && (
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-xs text-orange-700 flex-1 min-w-0 break-words">{fwdError}</p>
                    <button
                      onClick={fetchForwarding}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-800 flex items-center gap-1 whitespace-nowrap shrink-0 bg-orange-100 hover:bg-orange-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div className="flex flex-col gap-5 min-w-0">

            {/* ADDRESS CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Addresses</p>
              </div>

              <div className="px-5 py-4 relative">
                {/* Vertical connector */}
                <div className="absolute left-[28px] top-[52px] bottom-[52px] w-px bg-gradient-to-b from-emerald-400 to-indigo-400 opacity-30" />

                <div className="space-y-4">
                  {/* From */}
                  <div className="flex gap-3.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-emerald-200 z-10">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">
                        Origin
                      </p>
                      <p className="text-xs font-bold text-gray-900">{mapOrigin}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {sAddr || origin}
                      </p>
                    </div>
                  </div>

                  {/* To */}
                  <div className="flex gap-3.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-200 z-10">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">
                        Destination
                      </p>
                      <p className="text-xs font-bold text-gray-900">{mapDestination}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {rAddr || dest}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient */}
              {(rName || rPhone) && (
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-3">
                    Recipient
                  </p>
                  <div className="space-y-2.5">
                    {rName && (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{rName}</span>
                      </div>
                    )}
                    {rPhone && (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                        <span className="text-sm text-gray-700">{rPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* TIMELINE CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Shipment History</p>
                    <p className="text-[10px] text-gray-400">
                      {timeline.length} event{timeline.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {(vendorCnt > 0 || fwdCnt > 0) && (
                    <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
                      {[
                        { key: "all",        label: "All"     },
                        ...(vendorCnt > 0 ? [{ key: "vendor",     label: "Primary" }] : []),
                        ...(fwdCnt    > 0 ? [{ key: "forwarding", label: "Partner" }] : []),
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setActiveFilter(key)}
                          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                            activeFilter === key
                              ? key === "vendor"
                                ? "bg-indigo-500 text-white shadow-sm"
                                : key === "forwarding"
                                ? "bg-orange-500 text-white shadow-sm"
                                : "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (doVendor)     fetchVendor();
                      if (doForwarding) fetchForwarding();
                    }}
                    disabled={anyLoading}
                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-gray-500 ${
                        anyLoading ? "animate-spin text-indigo-500" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Timeline Body */}
              <div className="overflow-y-auto max-h-[500px] overscroll-contain">
                {anyLoading && timeline.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 px-5">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Fetching updates…</p>
                    <p className="text-xs text-gray-400 mt-0.5">This may take a moment</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 px-5">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                      <Package className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-600">No updates yet</p>
                    <p className="text-xs text-gray-400 mt-0.5">Check back soon</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {Object.entries(grouped).map(([date, evts], gi) => (
                      <div key={date}>
                        {/* Date separator */}
                        <div className="sticky top-0 z-10 px-5 py-2 flex items-center gap-2 bg-white/95 backdrop-blur-sm">
                          <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2.5 py-1">
                            <Calendar className="w-2.5 h-2.5 text-gray-400" />
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                              {date}
                            </span>
                          </div>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {evts.map((evt, idx) => {
                          const isFirst = gi === 0 && idx === 0;
                          const isLast  = idx === evts.length - 1;
                          return (
                            <div
                              key={`${evt.timestamp}-${idx}`}
                              className={`flex gap-3 px-5 py-3 transition-colors hover:bg-gray-50/60 ${
                                isFirst ? "bg-indigo-50/40" : ""
                              }`}
                            >
                              {/* Icon + line */}
                              <div className="flex flex-col items-center shrink-0">
                                <div
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 shadow-sm shrink-0 ${
                                    isFirst
                                      ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-200"
                                      : evt.source === "forwarding"
                                      ? "bg-white border-orange-300 text-orange-500"
                                      : evt.source === "vendor"
                                      ? "bg-white border-blue-300 text-blue-500"
                                      : "bg-white border-gray-200 text-gray-400"
                                  }`}
                                >
                                  {getStatusIcon(evt.status)}
                                </div>
                                {!isLast && (
                                  <div className="w-px flex-1 bg-gradient-to-b from-gray-200 to-transparent mt-1.5 min-h-[12px]" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pb-0.5">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={`text-xs font-semibold leading-snug ${
                                      isFirst ? "text-indigo-700" : "text-gray-800"
                                    }`}
                                  >
                                    {evt.status}
                                  </p>
                                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                                    <time className="text-[10px] text-gray-400 whitespace-nowrap font-medium">
                                      {fmtTime(evt.timestamp)}
                                    </time>
                                    {isFirst && (
                                      <span className="text-[9px] bg-indigo-100 text-indigo-600 font-semibold px-1.5 py-0.5 rounded-full">
                                        Latest
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {evt.location && (
                                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                                    <MapPin className="w-2.5 h-2.5 shrink-0 text-gray-400" />
                                    <span className="truncate">{evt.location}</span>
                                  </p>
                                )}
                                {evt.comment && (
                                  <p className="text-[11px] text-gray-400 italic mt-1 leading-relaxed">
                                    {evt.comment}
                                  </p>
                                )}
                                {evt.source === "forwarding" && (
                                  <span className="inline-block mt-1.5 text-[9px] bg-orange-50 text-orange-500 border border-orange-100 font-semibold px-1.5 py-0.5 rounded-full">
                                    Partner
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

              {/* Footer action bar */}
              <div className="shrink-0 border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                <button
                  onClick={() => {
                    if (doVendor)     fetchVendor();
                    if (doForwarding) fetchForwarding();
                  }}
                  disabled={anyLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    anyLoading
                      ? "bg-indigo-50 text-indigo-400 cursor-not-allowed"
                      : isDelivered
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
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
          <p className="text-[11px] text-gray-400 font-medium">
            Last updated: {new Date().toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[11px] text-gray-400 font-medium">Live tracking active</p>
          </div>
        </div>
      </div>
    </div>
  );
}