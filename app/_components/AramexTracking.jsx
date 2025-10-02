"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  MapPin,
  Clock,
  AlertCircle,
  Package,
  Truck,
  Plane,
  Home,
  CheckCircle,
  Weight,
  Box,
  Search,
} from "lucide-react"

const getStatusIcon = (status) => {
  const statusLower = status.toLowerCase()
  if (statusLower.includes("delivered")) return <Home className="w-6 h-6 text-green-500" />
  if (statusLower.includes("transit") || statusLower.includes("processed") || statusLower.includes("way"))
    return <Truck className="w-6 h-6 text-blue-500" />
  if (statusLower.includes("airport") || statusLower.includes("departed"))
    return <Plane className="w-6 h-6 text-purple-500" />
  if (statusLower.includes("picked") || statusLower.includes("collected") || statusLower.includes("received"))
    return <Package className="w-6 h-6 text-orange-500" />
  if (statusLower.includes("delay")) return <AlertCircle className="w-6 h-6 text-yellow-500" />
  return <CheckCircle className="w-6 h-6 text-gray-500" />
}

const getStatusColor = (status) => {
  const statusLower = status.toLowerCase()
  if (statusLower.includes("delivered")) return "bg-green-100 text-green-800 border-green-200"
  if (statusLower.includes("transit") || statusLower.includes("processed") || statusLower.includes("way"))
    return "bg-blue-100 text-blue-800 border-blue-200"
  if (statusLower.includes("collected") || statusLower.includes("picked") || statusLower.includes("received"))
    return "bg-orange-100 text-orange-800 border-orange-200"
  if (statusLower.includes("delay")) return "bg-yellow-100 text-yellow-800 border-yellow-200"
  return "bg-gray-100 text-gray-800 border-gray-200"
}

export default function AramexTracking({ forwardingLink, trackingNumber: propTrackingNumber }) {
  const [trackingData, setTrackingData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inputTrackingNumber, setInputTrackingNumber] = useState(propTrackingNumber || "")

  const fetchAramex = async (trackingNum, forwardingUrl) => {
    setLoading(true)
    setError(null)

    try {
      let url = "/api/aramex?"
      if (trackingNum) {
        url += `trackingNumber=${encodeURIComponent(trackingNum)}`
      } else if (forwardingUrl) {
        url += `link=${encodeURIComponent(forwardingUrl)}`
      } else {
        throw new Error("No tracking number or forwarding link provided")
      }

      console.log("[v0] Fetching from:", url)
      const res = await fetch(url)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.details || `HTTP ${res.status}: Failed to fetch tracking data`)
      }

      const data = await res.json()
      console.log("[v0] Received tracking data:", data)
      setTrackingData(data)
    } catch (err) {
      console.error("[v0] Fetch error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (propTrackingNumber) {
      fetchAramex(propTrackingNumber, null)
    } else if (forwardingLink) {
      fetchAramex(null, forwardingLink)
    }
  }, [propTrackingNumber, forwardingLink])

  const handleTrackingSubmit = (e) => {
    e.preventDefault()
    if (inputTrackingNumber.trim()) {
      fetchAramex(inputTrackingNumber.trim(), null)
    }
  }

  if (!propTrackingNumber && !forwardingLink) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-red-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-red-600 flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">ARX</span>
              </div>
              Aramex Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackingSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter your Aramex tracking number"
                  value={inputTrackingNumber}
                  onChange={(e) => setInputTrackingNumber(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !inputTrackingNumber.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Track
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Show results below the form */}
        {(trackingData || error) && (
          <>
            {error && (
              <Card className="bg-red-50 border-red-200 shadow-lg">
                <CardContent className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-600 mb-2">Unable to load Aramex tracking</h3>
                  <p className="text-red-600">{error}</p>
                  <Button
                    onClick={() => fetchAramex(inputTrackingNumber.trim(), null)}
                    className="mt-4 bg-red-600 hover:bg-red-700"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {trackingData && <TrackingResults trackingData={trackingData} />}
          </>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-red-600">Loading Aramex tracking information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-red-50 border-red-200 shadow-lg">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Unable to load Aramex tracking</h3>
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => fetchAramex(propTrackingNumber, forwardingLink)}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return trackingData ? <TrackingResults trackingData={trackingData} /> : null
}

function TrackingResults({ trackingData }) {
  const { events = [], timeline = [], shipmentDetails = {}, currentStatus = {}, trackingNumber } = trackingData || {}
  const displayEvents = timeline.length > 0 ? timeline : events

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-500">
      <Card className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-red-200 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold text-red-600 flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">ARX</span>
              </div>
              Aramex Tracking
            </CardTitle>
            {trackingNumber && (
              <Badge variant="outline" className="text-lg px-4 py-2 bg-white border-red-200">
                {trackingNumber}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          {currentStatus.status && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-red-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-full">{getStatusIcon(currentStatus.status)}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{currentStatus.status}</h3>
                  {currentStatus.location && (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{currentStatus.location}</span>
                    </div>
                  )}
                  {currentStatus.timestamp && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(currentStatus.timestamp).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <Badge className={`${getStatusColor(currentStatus.status)} border`}>
                  {currentStatus.status.split(" ")[0].toUpperCase()}
                </Badge>
              </div>
            </div>
          )}

          {/* Shipment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {shipmentDetails.type && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-700">Service</span>
                </div>
                <p className="text-lg font-medium text-gray-900">{shipmentDetails.type}</p>
              </div>
            )}

            {shipmentDetails.origin && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-700">Origin</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {shipmentDetails.origin.city && `${shipmentDetails.origin.city}, `}
                  {shipmentDetails.origin.country}
                </p>
              </div>
            )}

            {shipmentDetails.destination && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-700">Destination</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {shipmentDetails.destination.city && `${shipmentDetails.destination.city}, `}
                  {shipmentDetails.destination.country}
                </p>
              </div>
            )}

            {(shipmentDetails.weight || shipmentDetails.items) && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  {shipmentDetails.weight ? (
                    <Weight className="w-5 h-5 text-red-600" />
                  ) : (
                    <Box className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold text-gray-700">{shipmentDetails.weight ? "Weight" : "Items"}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {shipmentDetails.weight || `${shipmentDetails.items} item(s)`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border-red-100">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Shipment Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayEvents.length > 0 ? (
            <div className="space-y-6">
              {displayEvents.map((event, index) => (
                <div
                  key={index}
                  className="relative animate-in slide-in-from-left-5 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="relative">
                      <div className="w-4 h-4 bg-red-600 rounded-full border-4 border-white shadow-lg z-10 relative"></div>
                      {index !== displayEvents.length - 1 && (
                        <div className="absolute top-4 left-2 w-px h-16 bg-red-200"></div>
                      )}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg">{event.status}</h4>
                        <Badge className={`${getStatusColor(event.status)} text-xs`}>
                          {event.status.split(" ")[0]}
                        </Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{event.timestamp || `${event.date}${event.time ? ` ${event.time}` : ""}`}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tracking events available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {trackingData?.metadata && (
        <Card className="bg-white shadow-lg border-red-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-red-600">Tracking Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Total Events:</p>
              <p className="text-lg font-medium">{trackingData.metadata.totalEvents}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Last Updated:</p>
              <p className="text-lg font-medium">{new Date(trackingData.metadata.scrapedAt).toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-600">Method:</p>
              <p className="text-lg font-medium">
                {trackingData.metadata.method === "tracking_number" ? "Tracking Number" : "Direct URL"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
