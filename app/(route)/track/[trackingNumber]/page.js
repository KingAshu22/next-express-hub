"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchAWBData = async () => {
      console.log(`AWB fetching data ${trackingNumber}`);
      setLoading(true);
      try {
        const response = await axios.get(`/api/awb/${trackingNumber}`);
        setAwbData(response.data[0]);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch AWB data");
        setLoading(false);
      }
    };

    if (trackingNumber) {
      fetchAWBData();
    }
  }, [trackingNumber]);

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
        message="We couldn't load this shipment right now. Please try again in a moment."
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
      <TrackingDetails parcelDetails={awbData} />
      <Footer />
    </>
  );
}
