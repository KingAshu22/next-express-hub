"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Truck,
  Plane,
  Home,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const getStatusIcon = (status) => {
  if (status.includes("Prepared"))
    return <Package className="w-6 h-6 text-blue-500" />;
  if (status.includes("Transit"))
    return <Truck className="w-6 h-6 text-green-500" />;
  if (status.includes("Airport"))
    return <Plane className="w-6 h-6 text-purple-500" />;
  if (status.includes("Delivered"))
    return <Home className="w-6 h-6 text-indigo-500" />;
  if (status.includes("Unsuccessful"))
    return <AlertCircle className="w-6 h-6 text-red-500" />;
  return <CheckCircle className="w-6 h-6 text-gray-500" />;
};

const getStatusColor = (status) => {
  if (status.includes("Delivered")) return "bg-green-100 text-green-800";
  if (status.includes("Transit")) return "bg-blue-100 text-blue-800";
  if (status.includes("Unsuccessful")) return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

export default function TrackingDetails({ parcelDetails }) {
  const [showAll, setShowAll] = useState(false);
  const latestStatus =
    parcelDetails.parcelStatus[parcelDetails.parcelStatus.length - 1]?.status ||
    "Unknown";
  const reversedUpdates = [...parcelDetails.parcelStatus].reverse();

  const visibleUpdates = showAll ? reversedUpdates : reversedUpdates.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Latest Status Banner */}
      <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg">
        <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 gap-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(latestStatus)}
            <div>
              <h2 className="text-2xl font-bold">{latestStatus}</h2>
              <p className="text-sm text-indigo-100">
                Last updated:{" "}
                {new Date(
                  parcelDetails.parcelStatus[
                    parcelDetails.parcelStatus.length - 1
                  ].timestamp
                ).toLocaleString("en-GB")}
              </p>
            </div>
          </div>
          <Badge className={`px-3 py-1 text-base ${getStatusColor(latestStatus)}`}>
            {parcelDetails.parcelType}
          </Badge>
        </CardContent>
      </Card>

      {/* Parcel Info */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-indigo-700">
            Parcel Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <InfoItem label="Tracking Number" value={parcelDetails.trackingNumber} />
          <InfoItem
            label="Invoice Number"
            value={parcelDetails.invoiceNumber}
          />
          <InfoItem label="From" value={parcelDetails.sender.country} />
          <InfoItem label="To" value={parcelDetails.receiver.country} />
          <InfoItem
            label="Forwarding Number"
            value={parcelDetails.forwardingNumber}
          />
          <div className="flex flex-col">
            <p className="font-semibold text-gray-600">Forwarding Link:</p>
            <Button
              variant="link"
              onClick={() => window.open(parcelDetails.forwardingLink, "_blank")}
              className="p-0 h-auto text-indigo-600 flex items-center gap-1"
            >
              View Link <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracking History */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-xl font-semibold text-indigo-700">
            Tracking History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1"
          >
            {showAll ? (
              <>
                Hide Details <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                View More <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="space-y-5 relative">
            {visibleUpdates.map((update, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(update.status)}
                </div>
                <div className="flex flex-col">
                  <p className="font-medium text-gray-800">{update.status}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(update.timestamp).toLocaleString("en-GB")}
                  </p>
                  {update.comment && (
                    <p className="text-sm text-gray-600 mt-1">
                      {update.comment}
                    </p>
                  )}
                </div>
              </li>
            ))}
            {reversedUpdates.length > 3 && !showAll && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Showing last 3 updates
              </p>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Sender & Receiver Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DetailCard
          title="Sender Details"
          details={parcelDetails.sender}
        />
        <DetailCard
          title="Receiver Details"
          details={parcelDetails.receiver}
        />
      </div>
    </div>
  );
}

const InfoItem = ({ label, value }) => (
  <div className="flex flex-col">
    <p className="font-semibold text-gray-600">{label}:</p>
    <p className="text-base text-indigo-700 font-medium break-words">{value}</p>
  </div>
);

const DetailCard = ({ title, details }) => (
  <Card className="shadow-sm border border-gray-100">
    <CardHeader>
      <CardTitle className="text-xl font-semibold text-indigo-700">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <InfoItem label="Name" value={details.name} />
      <InfoItem label="Contact" value={details.contact} />
      <InfoItem
        label="Address"
        value={`${details.address}, ${details.zip}, ${details.country}`}
      />
    </CardContent>
  </Card>
);
