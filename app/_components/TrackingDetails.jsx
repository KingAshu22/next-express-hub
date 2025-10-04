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
  const latestStatus =
    parcelDetails.parcelStatus[parcelDetails.parcelStatus.length - 1]?.status ||
    "Unknown";
  const reversedUpdates = [...parcelDetails.parcelStatus].reverse();

  return (
    <div className="max-w-4xl mx-auto items-center p-4">
      <div className="flex flex-rows md:flex-rows-2 gap-6">
        <Card className="bg-white shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-indigo-700">
              Tracking History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              {reversedUpdates.map((update, index) => (
                <li key={index} className="relative">
                  <div className="flex items-center mb-2">
                    <div className="mr-4">{getStatusIcon(update.status)}</div>
                    <div className="flex-grow">
                      <p className="font-semibold text-lg text-gray-800">
                        {update.status}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(update.timestamp).toLocaleString("en-GB")}
                      </p>
                    </div>
                  </div>
                  {update.comment && (
                    <p className="text-sm text-gray-600 ml-10">
                      {update.comment}
                    </p>
                  )}
                  {index !== reversedUpdates.length - 1 && (
                    <Separator className="absolute left-3 top-10 bottom-0 w-px bg-gray-200" />
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-indigo-700">
              Parcel Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Tracking Number:</p>
              <p className="text-2xl font-bold text-indigo-600">
                {parcelDetails.trackingNumber}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Status:</p>
              <Badge
                variant="outline"
                className={`text-lg px-3 py-1 ${getStatusColor(latestStatus)}`}
              >
                {latestStatus}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">From:</p>
              <p className="text-lg font-medium text-indigo-700">
                {parcelDetails.sender.country}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">To:</p>
              <p className="text-lg font-medium text-indigo-700">
                {parcelDetails.receiver.country}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Parcel Type:</p>
              <p className="text-lg font-medium text-indigo-700">
                {parcelDetails.parcelType}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Invoice Number:</p>
              <p className="text-lg font-medium text-indigo-700">
                {parcelDetails.invoiceNumber}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Forwarding Number:</p>
              <p className="text-lg font-medium text-indigo-700">
                {parcelDetails?.forwardingNumber}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Forwarding Link:</p>
              <Button
                onClick={() => {
                  window.open(
                    `${parcelDetails?.forwardingLink}`,
                    "_blank"
                  )
                }}
                className="text-lg font-medium text-indigo-700 bg-transparent b-0 hover:bg-transparent"
                target="_blank"
                rel="noopener noreferrer"
              >
                {parcelDetails?.forwardingLink}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-rows md:flex-rows-2 gap-6">
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-indigo-700">
              Sender Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-gray-600">Name:</p>
              <p className="text-lg">{parcelDetails.sender.name}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Contact:</p>
              <p className="text-lg">{parcelDetails.sender.contact}</p>
            </div>
            <div className="md:col-span-2">
              <p className="font-semibold text-gray-600">Address:</p>
              <p className="text-lg">
                {parcelDetails.sender.address}, {parcelDetails.sender.zip},{" "}
                {parcelDetails.sender.country}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-indigo-700">
              Receiver Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-gray-600">Name:</p>
              <p className="text-lg">{parcelDetails.receiver.name}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Contact:</p>
              <p className="text-lg">{parcelDetails.receiver.contact}</p>
            </div>
            <div className="md:col-span-2">
              <p className="font-semibold text-gray-600">Address:</p>
              <p className="text-lg">
                {parcelDetails.receiver.address}, {parcelDetails.receiver.zip},{" "}
                {parcelDetails.receiver.country}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}