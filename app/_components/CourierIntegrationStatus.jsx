import { Card } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Lock } from "lucide-react"

export default function CourierIntegrationStatus({ awbData, isIntegrated, canIntegrate, isEligibleForCJ }) {
  return (
    <Card className="bg-slate-800 border-slate-700 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {isIntegrated ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : canIntegrate ? (
            <AlertCircle className="w-8 h-8 text-blue-500" />
          ) : (
            <Lock className="w-8 h-8 text-slate-500" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            {isIntegrated
              ? "Courier Journey Integrated"
              : canIntegrate
                ? "Ready for Integration"
                : "Integration Not Available"}
          </h3>
          <div className="space-y-2 text-sm text-slate-400">
            {isIntegrated && (
              <>
                <p>
                  ✓ AWB Number: <span className="text-white font-mono">{awbData.cNoteNumber}</span>
                </p>
                <p>
                  ✓ Vendor: <span className="text-white">{awbData.cNoteVendorName}</span>
                </p>
                <p>✓ Labels generated and ready for download</p>
              </>
            )}
            {canIntegrate && (
              <>
                <p>✓ Destination country is eligible: {awbData.receiver?.country}</p>
                <p>✓ No existing Courier Journey integration</p>
                <p>Ready to generate AWB and shipping labels</p>
              </>
            )}
            {!isEligibleForCJ && (
              <>
                <p>✗ Destination country not supported</p>
                <p>Supported countries: United Kingdom (GB), Australia (AU), United Arab Emirates (AE)</p>
                <p>Current destination: {awbData.receiver?.country || "Unknown"}</p>
              </>
            )}
            {isEligibleForCJ && !canIntegrate && !isIntegrated && (
              <>
                <p>✗ Shipment already has an integration</p>
                <p>Current vendor: {awbData.cNoteVendorName}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
