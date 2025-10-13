"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Package,
  Truck,
  Plane,
  Home,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { fetchM5Tracking } from "./FetchM5Tracking"
import { fetchCourierJourneyTracking } from "./FetchCourierJourneyTracking"
import { getEventDescription } from "@/lib/m5-event-codes"

const getStatusIcon = (status) => {
  const statusLower = (status || "").toLowerCase()
  if (statusLower.includes("prepared") || statusLower.includes("received"))
    return <Package className="w-6 h-6 text-blue-500" />
  if (statusLower.includes("transit") || statusLower.includes("left") || statusLower.includes("dispatch"))
    return <Truck className="w-6 h-6 text-green-500" />
  if (statusLower.includes("airport") || statusLower.includes("flight"))
    return <Plane className="w-6 h-6 text-purple-500" />
  if (statusLower.includes("delivered")) return <Home className="w-6 h-6 text-indigo-500" />
  if (statusLower.includes("unsuccessful") || statusLower.includes("offload"))
    return <AlertCircle className="w-6 h-6 text-red-500" />
  return <CheckCircle className="w-6 h-6 text-gray-500" />
}

const getStatusColor = (status) => {
  const statusLower = (status || "").toLowerCase()
  if (statusLower.includes("delivered")) return "bg-green-100 text-green-800"
  if (statusLower.includes("transit") || statusLower.includes("dispatch")) return "bg-blue-100 text-blue-800"
  if (statusLower.includes("unsuccessful") || statusLower.includes("offload")) return "bg-red-100 text-red-800"
  return "bg-gray-100 text-gray-800"
}

export default function TrackingDetails({ parcelDetails }) {
  const [m5Data, setM5Data] = useState(null)
  const [m5Error, setM5Error] = useState(null)

  const [cjData, setCjData] = useState(null)
  const [cjError, setCjError] = useState(null)

  const [isLoading, setIsLoading] = useState(false)

  const shouldFetchM5 = parcelDetails?.cNoteVendorName === "M5" && parcelDetails?.cNoteNumber
  const shouldFetchCJ = parcelDetails?.cNoteVendorName === "Courier Journey" && parcelDetails?.cNoteNumber

  // Fetch M5 tracking
  useEffect(() => {
    if (!shouldFetchM5) return

    setIsLoading(true)
    setM5Error(null)
    fetchM5Tracking(parcelDetails.cNoteNumber)
      .then((result) => {
        if (result.success) {
          setM5Data(result.data)
          setM5Error(null)
        } else {
          setM5Data(null)
          setM5Error(result.error || "Failed to fetch tracking data")
        }
      })
      .catch((error) => {
        setM5Data(null)
        setM5Error(error.message || "An unexpected error occurred")
      })
      .finally(() => setIsLoading(false))
  }, [shouldFetchM5, parcelDetails?.cNoteNumber])

  // Fetch Courier Journey tracking
  useEffect(() => {
    if (!shouldFetchCJ) return

    setIsLoading(true)
    setCjError(null)
    fetchCourierJourneyTracking(parcelDetails.cNoteNumber)
      .then((result) => {
        if (result.success) {
          setCjData(result.data)
          setCjError(null)
        } else {
          setCjData(null)
          setCjError(result.error || "Failed to fetch Courier Journey tracking data")
        }
      })
      .catch((error) => {
        setCjData(null)
        setCjError(error.message || "An unexpected error occurred")
      })
      .finally(() => setIsLoading(false))
  }, [shouldFetchCJ, parcelDetails?.cNoteNumber])

  const trackingData = m5Data?.trackDetails?.[0] || cjData?.Tracking?.[0]
  const events = m5Data?.Event || cjData?.Events || []
  const normalTracking = parcelDetails?.parcelStatus || []

  const latestStatus =
    (trackingData && (trackingData.Status || trackingData.Status)) ||
    (events.length > 0
      ? (cjData ? events[0].Status : getEventDescription(events[0].EventCode, events[0].EventDescription))
      : null) ||
    (normalTracking.length > 0 ? normalTracking[normalTracking.length - 1]?.status : null) ||
    "Unknown"

  const reversedUpdates = (m5Data || cjData) ? [...events] : [...normalTracking].reverse()

  const origin = trackingData?.Origin || parcelDetails?.sender?.country || parcelDetails?.origin || "Origin"
  const destination =
    trackingData?.Destination || parcelDetails?.receiver?.country || parcelDetails?.destination || "Destination"

  const forwardingNumber = trackingData?.ForwardingNo || parcelDetails?.forwardingNumber
  const forwardingLink = parcelDetails?.forwardingLink
  const forwarder = trackingData?.Forwarder
  const awbNumber = trackingData?.Awbno || parcelDetails?.awbNumber || parcelDetails?.trackingNumber

  if (!parcelDetails) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No tracking information available.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Updated color and AWB section */}
      <Card className="bg-gradient-to-r from-rose-600 via-pink-600 to-red-500 text-white shadow-lg overflow-hidden border-none">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center justify-center gap-3 md:gap-6">
              <div>
                <p className="text-sm text-rose-100 mb-1">From</p>
                <p className="text-xl md:text-2xl font-bold">{origin}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-px w-8 md:w-16 bg-white/40"></div>
                <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
                <div className="h-px w-8 md:w-16 bg-white/40"></div>
              </div>
              <div>
                <p className="text-sm text-rose-100 mb-1">To</p>
                <p className="text-xl md:text-2xl font-bold">{destination}</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
              <p className="text-sm text-white/80">AWB Number</p>
              <p className="text-2xl font-extrabold tracking-wide">{awbNumber || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800 ml-2">Fetching tracking details...</AlertDescription>
        </Alert>
      )}

      {(m5Error || cjError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>API Error:</strong> {m5Error || cjError}
            <br />
            <span className="text-sm">Showing standard tracking details below.</span>
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg">
        <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 gap-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(latestStatus)}
            <div>
              <h2 className="text-2xl font-bold">{latestStatus}</h2>
              <p className="text-sm text-indigo-100">
                Last updated:{" "}
                {events.length > 0
                  ? cjData
                    ? `${events[0].EventDate1 || events[0].EventDate} ${events[0].EventTime1 || events[0].EventTime}`
                    : (() => {
                        const ev = events[0]
                        if (ev?.EventDate && ev.EventDate.includes("T") && ev?.EventTime) {
                          try {
                            return new Date(`${ev.EventDate.split("T")[0]}T${ev.EventTime}`).toLocaleString("en-GB")
                          } catch (e) {
                            return `${ev.EventDate} ${ev.EventTime}`
                          }
                        }
                        return `${ev?.EventDate1 || ev?.EventDate || ""} ${ev?.EventTime1 || ev?.EventTime || ""}`
                      })()
                  : normalTracking.length > 0
                  ? new Date(normalTracking[normalTracking.length - 1].timestamp).toLocaleString("en-GB")
                  : "N/A"}
              </p>
            </div>
          </div>
          <Badge className={`px-3 py-1 text-base ${getStatusColor(latestStatus)}`}>
            {parcelDetails?.parcelType || "Parcel"}
          </Badge>
        </CardContent>
      </Card>

      {/* Parcel Information Card */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-indigo-700">Parcel Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {awbNumber && <InfoItem label="AWB Number" value={awbNumber} />}
          {forwardingNumber && <InfoItem label="Forwarding Number" value={forwardingNumber} />}
          {forwardingLink && (
            <div className="flex flex-col">
              <p className="font-semibold text-gray-600">Forwarding Link:</p>
              <Button
                variant="link"
                onClick={() => window.open(forwardingLink, "_blank")}
                className="p-0 h-auto text-indigo-600 flex items-center gap-1 justify-start"
              >
                Track with {forwarder || "Forwarder"} <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracking History */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-indigo-700">Tracking History</CardTitle>
        </CardHeader>
        <CardContent>
          {reversedUpdates.length > 0 ? (
            <ul className="space-y-5 relative">
              {reversedUpdates.map((update, index) => {
                const isM5Event = update && "EventCode" in update
                const isCJEvent = cjData && ("Status" in update || "EventDate" in update)
                const status = isCJEvent
                  ? update.Status
                  : isM5Event
                  ? getEventDescription(update.EventCode, update.EventDescription)
                  : update.status

                const timestamp = isCJEvent
                  ? `${update.EventDate1 || update.EventDate || ""} ${update.EventTime1 || update.EventTime || ""}`
                  : isM5Event
                  ? (() => {
                      try {
                        return new Date(`${update.EventDate.split("T")[0]}T${update.EventTime}`).toLocaleString("en-GB")
                      } catch {
                        return `${update.EventDate || ""} ${update.EventTime || ""}`
                      }
                    })()
                  : new Date(update.timestamp).toLocaleString("en-GB")

                const location = isCJEvent ? update.Location : isM5Event ? update.Location : null
                const comment = !isM5Event && !isCJEvent ? update.comment : null

                return (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getStatusIcon(status)}</div>
                    <div className="flex flex-col flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <p className="font-medium text-gray-800">{status}</p>
                        {location && (
                          <Badge variant="outline" className="text-xs w-fit">
                            {location}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{timestamp}</p>
                      {comment && <p className="text-sm text-gray-600 mt-1">{comment}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">No tracking history available</p>
          )}
        </CardContent>
      </Card>

      {parcelDetails?.sender && parcelDetails?.receiver && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailCard title="Sender Details" details={parcelDetails.sender} />
          <DetailCard title="Receiver Details" details={parcelDetails.receiver} />
        </div>
      )}
    </div>
  )
}

const InfoItem = ({ label, value }) => (
  <div className="flex flex-col">
    <p className="font-semibold text-gray-600">{label}:</p>
    <p className="text-base text-indigo-700 font-medium break-words">{value}</p>
  </div>
)

const DetailCard = ({ title, details }) => (
  <Card className="shadow-sm border border-gray-100">
    <CardHeader>
      <CardTitle className="text-xl font-semibold text-indigo-700">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <InfoItem label="Name" value={details.name} />
      <InfoItem label="Address" value={`${details.address}, ${details.zip}, ${details.country}`} />
    </CardContent>
  </Card>
)
