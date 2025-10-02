"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Package, Truck, Plane, Home, CheckCircle, AlertCircle, MapPin, Clock, Calendar, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

const getStatusIcon = (status) => {
  if (status.includes("Prepared") || status.includes("picked up")) return <Package className="w-6 h-6 text-blue-500" />
  if (status.includes("Transit") || status.includes("departed") || status.includes("Processed"))
    return <Truck className="w-6 h-6 text-green-500" />
  if (status.includes("Airport") || status.includes("Arrived at DHL"))
    return <Plane className="w-6 h-6 text-purple-500" />
  if (status.includes("Delivered")) return <Home className="w-6 h-6 text-indigo-500" />
  if (status.includes("Unsuccessful")) return <AlertCircle className="w-6 h-6 text-red-500" />
  return <CheckCircle className="w-6 h-6 text-gray-500" />
}

const getStatusColor = (status) => {
  if (status.includes("Delivered")) return "bg-green-100 text-green-800"
  if (status.includes("Transit") || status.includes("Processed")) return "bg-blue-100 text-blue-800"
  if (status.includes("Unsuccessful")) return "bg-red-100 text-red-800"
  return "bg-gray-100 text-gray-800"
}

const getDHLStatusColor = (statusCode) => {
  switch (statusCode) {
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200"
    case "transit":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "unknown":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const formatDHLTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }
  return date.toLocaleDateString("en-US", options)
}

export default function TrackingDetails({ parcelDetails }) {
  const [dhlData, setDhlData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDHLTracking = async () => {
      if (parcelDetails.rateInfo?.courier === "dhl" && parcelDetails?.forwardingNumber) {
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(
            `/api/dhl?trackingNumber=${parcelDetails?.forwardingNumber}`,
            { method: "GET" }
          )

          if (!response.ok) {
            throw new Error(`DHL API error: ${response.status}`)
          }

          const data = await response.json()
          setDhlData(data)
        } catch (err) {
          console.error("DHL API Error:", err)
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchDHLTracking()
  }, [parcelDetails.rateInfo?.courier, parcelDetails.forwardingNumber])

  if (parcelDetails.rateInfo?.courier === "dhl" && dhlData?.shipments?.[0]) {
    const shipment = dhlData.shipments[0]
    const sortedEvents = [...shipment.events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-500">
        {/* DHL Header Card */}
        <Card className="bg-gradient-to-r from-red-50 via-yellow-50 to-red-50 border-red-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold text-red-600 flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">DHL</span>
                </div>
                Express Tracking
              </CardTitle>
              <Badge variant="outline" className="text-lg px-4 py-2 bg-white border-red-200">
                {shipment.id}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-red-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-full">{getStatusIcon(shipment.status.description)}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{shipment.status.description}</h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{shipment.status.location.address.addressLocality}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatDHLTimestamp(shipment.status.timestamp)}</span>
                  </div>
                </div>
                <Badge className={`${getDHLStatusColor(shipment.status.statusCode)} border`}>
                  {shipment.status.statusCode.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Service Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-700">Service</span>
                </div>
                <p className="text-lg font-medium text-gray-900">{shipment.details.product.productName}</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-700">Origin</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{shipment.origin.address.addressLocality}</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-700">Destination</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{shipment.destination.address.addressLocality}</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-700">ETA</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(shipment.estimatedTimeOfDelivery).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-600">{shipment.estimatedTimeOfDeliveryRemark}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Timeline */}
        <Card className="bg-white shadow-lg border-red-100">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Shipment Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sortedEvents.map((event, index) => (
                <div
                  key={index}
                  className="relative animate-in slide-in-from-left-5 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="relative">
                      <div className="w-4 h-4 bg-red-600 rounded-full border-4 border-white shadow-lg z-10 relative"></div>
                      {index !== sortedEvents.length - 1 && (
                        <div className="absolute top-4 left-2 w-px h-16 bg-red-200"></div>
                      )}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg">{event.description}</h4>
                        <Badge className={`${getDHLStatusColor(event.statusCode)} text-xs`}>{event.status}</Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location.address.addressLocality}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDHLTimestamp(event.timestamp)}</span>
                        </div>
                      </div>

                      {event.pieceIds && (
                        <div className="mt-2 text-xs text-gray-500">Piece ID: {event.pieceIds.join(", ")}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card className="bg-white shadow-lg border-red-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-red-600">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Total Pieces:</p>
              <p className="text-lg font-medium">{shipment.details.totalNumberOfPieces}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Waybill Number:</p>
              <p className="text-lg font-medium">{shipment.details.pieceIds?.[0] || "N/A"}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Service Code:</p>
              <p className="text-lg font-medium">{shipment.details.product.productCode}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Activation Date:</p>
              <p className="text-lg font-medium">
                {new Date(shipment.details.shipmentActivationDate).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (parcelDetails.rateInfo?.courier === "dhl" && loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-to-r from-red-50 to-yellow-50 border-red-200">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-red-600">Loading DHL tracking information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (parcelDetails.rateInfo?.courier === "dhl" && error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Unable to load DHL tracking</h3>
              <p className="text-red-600">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const latestStatus = parcelDetails.parcelStatus[parcelDetails.parcelStatus.length - 1]?.status || "Unknown"
  const reversedUpdates = [...parcelDetails.parcelStatus].reverse()

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-indigo-700">Parcel Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="font-semibold text-gray-600">Tracking Number:</p>
            <p className="text-2xl font-bold text-indigo-600">{parcelDetails.trackingNumber}</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-600">Status:</p>
            <Badge variant="outline" className={`text-lg px-3 py-1 ${getStatusColor(latestStatus)}`}>
              {latestStatus}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-600">From:</p>
            <p className="text-lg font-medium text-indigo-700">{parcelDetails.sender.country}</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-600">To:</p>
            <p className="text-lg font-medium text-indigo-700">{parcelDetails.receiver.country}</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-600">Parcel Type:</p>
            <p className="text-lg font-medium text-indigo-700">{parcelDetails.parcelType}</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-600">Forwarding Number:</p>
            <p className="text-lg font-medium text-indigo-700">{parcelDetails.forwardingNumber}</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-600">Forwarding Link:</p>
            {parcelDetails.forwardingLink ? (
              <a
                href={parcelDetails.forwardingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-indigo-700 hover:underline"
              >
                {parcelDetails.forwardingLink}
              </a>
            ) : (<p className="text-lg font-medium text-indigo-700">N/A</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-indigo-700">Tracking History</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-6">
            {reversedUpdates.map((update, index) => (
              <li key={index} className="relative">
                <div className="flex items-center mb-2">
                  <div className="mr-4">{getStatusIcon(update.status)}</div>
                  <div className="flex-grow">
                    <p className="font-semibold text-lg text-gray-800">{update.status}</p>
                    <p className="text-sm text-gray-500">{new Date(update.timestamp).toLocaleString("en-GB")}</p>
                  </div>
                </div>
                {update.comment && <p className="text-sm text-gray-600 ml-10">{update.comment}</p>}
                {index !== reversedUpdates.length - 1 && (
                  <Separator className="absolute left-3 top-10 bottom-0 w-px bg-gray-200" />
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
