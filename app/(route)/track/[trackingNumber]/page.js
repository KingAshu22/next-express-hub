"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";
import TrackingDetails from "@/app/_components/TrackingDetails";
import FrontHeader from "@/app/_components/FrontHeader";
import Footer from "@/app/_components/Footer";

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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-indigo-50 to-white min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-center text-red-600">
          Error
        </h1>
        <p className="text-center text-xl">{error}</p>
      </div>
    );
  }

  if (!awbData) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-indigo-50 to-white min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-center text-indigo-800">
          No Data Found
        </h1>
        <p className="text-center text-xl">
          No tracking information found for the given tracking number.
        </p>
      </div>
    );
  }

  return (
    <>
      <FrontHeader className="mb-4" />
      <div className="container mx-auto px-4 py-24 bg-gradient-to-b from-indigo-50 to-white">
        <h1 className="text-4xl font-bold mb-8 text-center text-indigo-800">
          Tracking Details
        </h1>
        <TrackingDetails parcelDetails={awbData} />
      </div>
      <Footer />
    </>
  );
}
