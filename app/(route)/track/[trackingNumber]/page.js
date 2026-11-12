"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Loader2, PackageSearch, AlertCircle } from "lucide-react";
import TrackingDetails from "@/app/_components/TrackingDetails";
import FrontHeader from "@/app/_components/FrontHeader";
import Footer from "@/app/_components/Footer";

// Shared shell for the loading / error / not-found states so they sit under
// the same light backdrop as the tracking page itself.
function StateScreen({ icon, title, message, showBack }) {
  return (
    <>
      <FrontHeader />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            {icon}
          </div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {message && <p className="text-sm text-slate-500 mt-2">{message}</p>}
          {showBack && (
            <Link
              href="/track"
              className="inline-flex items-center justify-center mt-6 text-sm font-bold text-primary-darker bg-accent hover:bg-accent-dark rounded-xl px-5 py-2.5 transition-colors"
            >
              Track another shipment
            </Link>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function TrackingPage() {
  const { trackingNumber } = useParams();
  const [awbData, setAwbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Public, minimal tracking data (no names, addresses, vendor or C-Note
  // details). The server merges our updates with the carrier's live scans.
  const fetchTracking = useCallback(async (showSpinner = true) => {
    if (!trackingNumber) return;
    if (showSpinner) setLoading(true);
    setError("");
    try {
      const response = await axios.get(`/api/track/${encodeURIComponent(trackingNumber)}`);
      const t = response.data?.data;
      setAwbData(
        t
          ? {
              trackingNumber: t.trackingNumber,
              sender: { city: t.origin?.city, country: t.origin?.country },
              receiver: { city: t.destination?.city, country: t.destination?.country },
              forwardingNumber: t.forwardingNumber,
              forwardingLink: t.forwardingLink,
              timeline: t.timeline || [],
              warning: response.data?.warning || null,
            }
          : null
      );
    } catch (err) {
      if (err?.response?.status === 404) setAwbData(null);
      else if (err?.response?.status === 429) setError("Too many tracking requests. Please wait a minute and try again.");
      else setError("We couldn't load this shipment right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [trackingNumber]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  if (loading) {
    return (
      <StateScreen
        icon={<Loader2 className="w-8 h-8 animate-spin" />}
        title="Finding your shipment…"
        message={`Tracking number ${trackingNumber}`}
      />
    );
  }

  if (error) {
    return (
      <StateScreen
        icon={<AlertCircle className="w-8 h-8" />}
        title="Something went wrong"
        message={error || "We couldn't load this shipment right now. Please try again in a moment."}
        showBack
      />
    );
  }

  if (!awbData) {
    return (
      <StateScreen
        icon={<PackageSearch className="w-8 h-8" />}
        title="No shipment found"
        message={`We couldn't find tracking information for ${trackingNumber}. Please check the number and try again.`}
        showBack
      />
    );
  }

  return (
    <>
      <FrontHeader />
      <TrackingDetails parcelDetails={awbData} onRefresh={() => fetchTracking(false)} />
      <Footer />
    </>
  );
}
