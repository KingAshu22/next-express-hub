"use client";

import AWBForm from "@/app/_components/AWBForm";
import { useState, useEffect, use } from "react";
import axios from "axios";
import withAuth from "@/lib/withAuth";

const EditAWB = ({ params }) => {
  const { trackingNumber } = use(params);
  console.log("Tracking number: " + trackingNumber);

  const [awbData, setAwbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("AWb Data", awbData);
  }, [awbData]);

  useEffect(() => {
    const fetchAWBData = async () => {
      console.log(`AWB fetching data ${trackingNumber}`);
      try {
        const response = await axios.get(
          `/api/awb/${trackingNumber}`
          // ,{
          //   params: { trackingNumber: trackingNumber },
          // }
        );
        const data = response.data;
        setAwbData(data[0]);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch AWB data");
        setLoading(false);
      }
    };

    fetchAWBData();
  }, []);

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error)
    return <div className="text-center mt-8 text-[#E31E24]">{error}</div>;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <AWBForm isEdit={true} awb={awbData} />
    </div>
  );
};

export default withAuth(EditAWB);
