"use client"

import { useState, useEffect, use } from "react" // <-- Restored 'use' hook import
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    AlertCircle,
    CheckCircle,
    Loader2,
    Download,
    AlertTriangle,
} from "lucide-react"
import PDFViewer from "@/app/_components/PdfViewer"
import ShipmentDetails from "@/app/_components/ShipmentDetails"
import CourierIntegrationStatus from "@/app/_components/CourierIntegrationStatus"
import axios from "axios"

export default function AWBTrackingPage({ params }) {
    // CORRECTED: Unwrap the params promise using the `use` hook
    const { trackingNumber } = use(params)

    // Existing state
    const [awbData, setAwbData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [integrating, setIntegrating] = useState(false)
    const [showAwbPdf, setShowAwbPdf] = useState(false)
    const [showBoxPdf, setShowBoxPdf] = useState(false)

    // New state for service selection
    const [selectedService, setSelectedService] = useState("")
    const [otherService, setOtherService] = useState("")

    useEffect(() => {
        if (trackingNumber) {
            fetchAWBData()
        }
    }, [trackingNumber])

    const fetchAWBData = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`/api/awb/${trackingNumber}`)
            setAwbData(response.data[0])
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSendToCourierJourney = async () => {
        const serviceName =
            selectedService === "other" ? otherService.trim() : selectedService

        if (!serviceName) {
            setError("Please select a service before proceeding.")
            return
        }

        try {
            setIntegrating(true)
            setError(null)
            const response = await fetch("/api/courier-journey/send-awb", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    awbId: awbData._id,
                    trackingNumber,
                    service: serviceName,
                }),
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                setError(result.error || "Failed to send to Courier Journey")
                return
            }

            setAwbData(result.updatedAwb)
            setError(null)
        } catch (err) {
            setError(err.message || "An unexpected error occurred")
        } finally {
            setIntegrating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
                    <p className="text-slate-300">Loading shipment details...</p>
                </div>
            </div>
        )
    }

    if (!awbData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
                <div className="mx-auto max-w-4xl">
                    <Card className="border-slate-700 bg-slate-800 p-6">
                        <div className="flex items-center gap-3 text-red-400">
                            <AlertCircle className="h-6 w-6" />
                            <p>Shipment not found for tracking number: {trackingNumber}</p>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    const isEligibleForCJ = true
    const canIntegrate =
        isEligibleForCJ && !awbData.cNoteNumber && !awbData.cNoteVendorName
    const isIntegrated = awbData.cNoteVendorName === "Courier Journey"

    const isServiceSelectionValid =
        (selectedService && selectedService !== "other") ||
        (selectedService === "other" && otherService.trim() !== "")

    const serviceOptions = ["UK SELF", "AUS SELF", "DXB SELF", "SELF", "other"]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-white">
                            Shipment Tracking
                        </h1>
                        <p className="text-slate-400">Tracking #{trackingNumber}</p>
                    </div>
                    <div className="text-right">
                        <div className="mb-1 text-sm text-slate-400">Status</div>
                        <div className="flex items-center justify-end gap-2">
                            {isIntegrated ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="font-semibold text-green-500">Integrated</span>
                                </>
                            ) : canIntegrate ? (
                                <span className="font-semibold text-amber-500">
                                    Ready for Integration
                                </span>
                            ) : (
                                <span className="text-slate-400">Not Eligible</span>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <Card className="border-red-700 bg-red-900/20 p-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                            <div className="flex-1">
                                <h4 className="mb-1 font-semibold text-red-400">
                                    Integration Error
                                </h4>
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                        </div>
                    </Card>
                )}

                <CourierIntegrationStatus
                    awbData={awbData}
                    isIntegrated={isIntegrated}
                    canIntegrate={canIntegrate}
                    isEligibleForCJ={isEligibleForCJ}
                />

                {canIntegrate && (
                    <Card className="border-blue-700 bg-gradient-to-r from-blue-900/30 to-blue-800/30 p-6">
                        <div className="flex flex-col gap-4">
                            <div>
                                <h3 className="mb-1 text-lg font-semibold text-white">
                                    Send to Courier Journey
                                </h3>
                                <p className="text-sm text-slate-400">
                                    Select a service to generate AWB and labels for integration.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="lg:col-span-1">
                                    <label
                                        htmlFor="service-select"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Select Service
                                    </label>
                                    <select
                                        id="service-select"
                                        value={selectedService}
                                        onChange={(e) => {
                                            setSelectedService(e.target.value)
                                            if (e.target.value !== "other") {
                                                setOtherService("")
                                            }
                                        }}
                                        className="w-full rounded-md border-slate-600 bg-slate-700 p-2 text-white focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="" disabled>
                                            -- Choose a service --
                                        </option>
                                        {serviceOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option === "other" ? "Other..." : option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {selectedService === "other" && (
                                    <div className="lg:col-span-1">
                                        <label
                                            htmlFor="other-service-input"
                                            className="mb-2 block text-sm font-medium text-slate-300"
                                        >
                                            Enter Service Name
                                        </label>
                                        <input
                                            id="other-service-input"
                                            type="text"
                                            value={otherService}
                                            onChange={(e) => setOtherService(e.target.value)}
                                            placeholder="e.g., EU SELF"
                                            className="w-full rounded-md border-slate-600 bg-slate-700 p-2 text-white focus:border-blue-500 focus:ring-blue-500"
                                            autoFocus
                                        />
                                    </div>
                                )}
                                <div className="lg:col-span-1">
                                    <Button
                                        onClick={handleSendToCourierJourney}
                                        disabled={integrating || !isServiceSelectionValid}
                                        className="w-full bg-blue-600 px-6 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600"
                                    >
                                        {integrating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Send to Courier Journey"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <ShipmentDetails awbData={awbData} />
                    </div>
                    <div className="space-y-4">
                        <Card className="border-slate-700 bg-slate-800 p-4">
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
                                Quick Info
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs uppercase text-slate-500">
                                        Tracking Number
                                    </p>
                                    <p className="font-mono text-white">{awbData.trackingNumber}</p>
                                </div>
                                {awbData.cNoteNumber && (
                                    <div>
                                        <p className="text-xs uppercase text-slate-500">
                                            C-Note Number
                                        </p>
                                        <p className="font-mono text-white">{awbData.cNoteNumber}</p>
                                    </div>
                                )}
                                {awbData.cNoteVendorName && (
                                    <div>
                                        <p className="text-xs uppercase text-slate-500">Vendor</p>
                                        <p className="text-white">{awbData.cNoteVendorName}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs uppercase text-slate-500">Destination</p>
                                    <p className="text-white">{awbData.receiver?.country || "N/A"}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {isIntegrated && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {awbData.awbLabel && (
                            <Card className="overflow-hidden border-slate-700 bg-slate-800">
                                <div className="flex items-center justify-between bg-slate-700 px-4 py-3">
                                    <h3 className="font-semibold text-white">AWB Label</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAwbPdf(!showAwbPdf)}
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        {showAwbPdf ? "Hide" : "Show"}
                                    </Button>
                                </div>
                                {showAwbPdf && (
                                    <div className="p-4">
                                        <PDFViewer base64Data={awbData.awbLabel} />
                                    </div>
                                )}
                                <div className="border-t border-slate-700 px-4 py-3">
                                    <a
                                        href={`data:application/pdf;base64,${awbData.awbLabel}`}
                                        download={`${trackingNumber}-awb-label.pdf`}
                                        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                    </a>
                                </div>
                            </Card>
                        )}
                        {awbData.boxLabel && (
                            <Card className="overflow-hidden border-slate-700 bg-slate-800">
                                <div className="flex items-center justify-between bg-slate-700 px-4 py-3">
                                    <h3 className="font-semibold text-white">Box Label</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowBoxPdf(!showBoxPdf)}
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        {showBoxPdf ? "Hide" : "Show"}
                                    </Button>
                                </div>
                                {showBoxPdf && (
                                    <div className="p-4">
                                        <PDFViewer base64Data={awbData.boxLabel} />
                                    </div>
                                )}
                                <div className="border-t border-slate-700 px-4 py-3">
                                    <a
                                        href={`data:application/pdf;base64,${awbData.boxLabel}`}
                                        download={`${trackingNumber}-box-label.pdf`}
                                        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                    </a>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}