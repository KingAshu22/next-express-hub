"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2, Download, AlertTriangle } from "lucide-react"
import PDFViewer from "@/app/_components/PdfViewer"
import ShipmentDetails from "@/app/_components/ShipmentDetails"
import CourierIntegrationStatus from "@/app/_components/CourierIntegrationStatus"
import axios from "axios"

export default function AWBTrackingPage({ params }) {
    const {trackingNumber} = use(params);

    const [awbData, setAwbData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [integrating, setIntegrating] = useState(false)
    const [showAwbPdf, setShowAwbPdf] = useState(false)
    const [showBoxPdf, setShowBoxPdf] = useState(false)

    useEffect(() => {
        fetchAWBData()
    }, [trackingNumber])

    const fetchAWBData = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`/api/awb/${trackingNumber}`);
            setAwbData(response.data[0]);
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSendToCourierJourney = async () => {
        try {
            setIntegrating(true)
            setError(null)
            const response = await fetch("/api/courier-journey/send-awb", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ awbId: awbData._id, trackingNumber }),
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
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-300">Loading shipment details...</p>
                </div>
            </div>
        )
    }

    if (!awbData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-slate-800 border-slate-700 p-6">
                        <div className="flex items-center gap-3 text-red-400">
                            <AlertCircle className="w-6 h-6" />
                            <p>Shipment not found</p>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    const isEligibleForCJ = true;
    const canIntegrate = isEligibleForCJ && !awbData.cNoteNumber && !awbData.cNoteVendorName
    const isIntegrated = awbData.cNoteVendorName === "Courier Journey"

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Shipment Tracking</h1>
                        <p className="text-slate-400">Tracking #{trackingNumber}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-400 mb-1">Status</div>
                        <div className="flex items-center gap-2 justify-end">
                            {isIntegrated ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-green-500 font-semibold">Integrated</span>
                                </>
                            ) : canIntegrate ? (
                                <span className="text-amber-500 font-semibold">Ready for Integration</span>
                            ) : (
                                <span className="text-slate-400">Not Eligible</span>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <Card className="bg-red-900/20 border-red-700 p-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-400 mb-1">Integration Error</h4>
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Integration Status Card */}
                <CourierIntegrationStatus
                    awbData={awbData}
                    isIntegrated={isIntegrated}
                    canIntegrate={canIntegrate}
                    isEligibleForCJ={isEligibleForCJ}
                />

                {/* Send to Courier Journey Button */}
                {canIntegrate && (
                    <Card className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 border-blue-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Send to Courier Journey</h3>
                                <p className="text-slate-400 text-sm">
                                    This shipment is eligible for Courier Journey integration. Click below to generate AWB and labels.
                                </p>
                            </div>
                            <Button
                                onClick={handleSendToCourierJourney}
                                disabled={integrating}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                            >
                                {integrating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Send to Courier Journey"
                                )}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Shipment Details */}
                    <div className="lg:col-span-2">
                        <ShipmentDetails awbData={awbData} />
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-4">
                        <Card className="bg-slate-800 border-slate-700 p-4">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Quick Info</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Tracking Number</p>
                                    <p className="text-white font-mono">{awbData.trackingNumber}</p>
                                </div>
                                {awbData.cNoteNumber && (
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">C-Note Number</p>
                                        <p className="text-white font-mono">{awbData.cNoteNumber}</p>
                                    </div>
                                )}
                                {awbData.cNoteVendorName && (
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Vendor</p>
                                        <p className="text-white">{awbData.cNoteVendorName}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Destination</p>
                                    <p className="text-white">{awbData.receiver?.country || "N/A"}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* PDF Labels Section */}
                {isIntegrated && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* AWB Label */}
                        {awbData.awbLabel && (
                            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
                                <div className="bg-slate-700 px-4 py-3 flex items-center justify-between">
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
                                <div className="px-4 py-3 border-t border-slate-700">
                                    <a
                                        href={`data:application/pdf;base64,${awbData.awbLabel}`}
                                        download="awb-label.pdf"
                                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                    </a>
                                </div>
                            </Card>
                        )}

                        {/* Box Label */}
                        {awbData.boxLabel && (
                            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
                                <div className="bg-slate-700 px-4 py-3 flex items-center justify-between">
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
                                <div className="px-4 py-3 border-t border-slate-700">
                                    <a
                                        href={`data:application/pdf;base64,${awbData.boxLabel}`}
                                        download="box-label.pdf"
                                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                        <Download className="w-4 h-4" />
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
