"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";

export default function AWBView({ params }) {
    const { trackingNumber } = use(params);
    console.log("Tracking number: " + trackingNumber);

    const [awbData, setAwbData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAWBData = async () => {
            console.log(`AWB fetching data ${trackingNumber}`);
            try {
                const response = await axios.get("/api/awb/awb-tracking-number", {
                    params: { trackingNumber: trackingNumber },
                });
                setAwbData(response.data);
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch AWB data");
                setLoading(false);
            }
        };

        fetchAWBData();
    }, []);

    if (loading) return <div className="text-center mt-8">Loading...</div>;
    if (error) return <div className="text-center mt-8 text-[#E31E24]">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-[#232C65]">Air Way Bill: {trackingNumber}</h1>
            {/* {awbData && (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold mb-2 text-[#232C65]">Sender Information</h2>
                            <InfoItem label="Name" value={awbData.senderName} />
                            <InfoItem label="Address" value={awbData.senderAddress} />
                            <InfoItem label="Phone" value={awbData.senderPhone} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold mb-2 text-[#232C65]">Recipient Information</h2>
                            <InfoItem label="Name" value={awbData.recipientName} />
                            <InfoItem label="Address" value={awbData.recipientAddress} />
                            <InfoItem label="Phone" value={awbData.recipientPhone} />
                        </div>
                    </div>
                    <div className="mt-6 space-y-4">
                        <h2 className="text-xl font-semibold mb-2 text-[#232C65]">Package Details</h2>
                        <InfoItem label="Weight" value={`${awbData.weight} kg`} />
                        <InfoItem label="Dimensions" value={awbData.dimensions} />
                        <InfoItem label="Contents" value={awbData.contents} />
                    </div>
                    <div className="mt-6 space-y-4">
                        <h2 className="text-xl font-semibold mb-2 text-[#232C65]">Shipping Information</h2>
                        <InfoItem label="Service Type" value={awbData.serviceType} />
                        <InfoItem label="Tracking Number" value={awbData.trackingNumber} />
                        <InfoItem label="Status" value={awbData.status} />
                    </div>
                </div>
            )} */}
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <p className="flex flex-wrap">
            <span className="font-semibold w-full sm:w-1/3">{label}:</span>
            <span className="w-full sm:w-2/3">{value}</span>
        </p>
    );
}