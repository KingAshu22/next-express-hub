"use client"

import { Suspense, createRef, useMemo, useRef, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import EnhancedShippingPage from "../[trackingNumber]/page"

function BulkShippingAndLabelPage() {
  const searchParams = useSearchParams()
  const trackingNumbers = useMemo(() => {
    const raw = searchParams.get("trackingNumbers") || ""
    return [...new Set(raw.split(",").map((trackingNumber) => trackingNumber.trim()).filter(Boolean))]
  }, [searchParams])

  const componentRefs = useRef({})
  const [readyTrackingNumbers, setReadyTrackingNumbers] = useState({})
  const [printOptions, setPrintOptions] = useState({
    invoiceCopies: 1,
    printerType: "a4",
    labelSenderOption: "without",
    authorizationType: "",
    authorizationCopies: 1,
    selectedDocuments: {
      invoice: true,
      labels: true,
      authorization: true,
      nonHazardous: true,
    },
  })

  const readyCount = Object.keys(readyTrackingNumbers).length
  const allReady = trackingNumbers.length > 0 && readyCount === trackingNumbers.length

  const getRef = (trackingNumber) => {
    if (!componentRefs.current[trackingNumber]) {
      componentRefs.current[trackingNumber] = createRef()
    }
    return componentRefs.current[trackingNumber]
  }

  const handleReady = useCallback((trackingNumber) => {
    setReadyTrackingNumbers((prev) => ({ ...prev, [trackingNumber]: true }))
  }, [])

  const handlePrint = useCallback(() => {
    if (!allReady) return

    const payloads = trackingNumbers
      .map((trackingNumber) => componentRefs.current[trackingNumber]?.current?.buildCombinedPrintPayload?.())
      .filter(Boolean)

    const combinedContent = payloads.map((payload) => payload.combinedContent).filter(Boolean).join('<div class="page-break"></div>')
    const stylesContent = payloads[0]?.stylesContent || ""

    if (!combinedContent) {
      alert("Please select at least one document type to print.")
      return
    }

    const originalContent = document.body.innerHTML
    document.body.innerHTML = `
      <style>
        ${stylesContent}
      </style>
      ${combinedContent}
    `

    componentRefs.current[trackingNumbers[0]]?.current?.renderCombinedPrintBarcodes?.()

    setTimeout(() => {
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }, 500)
  }, [allReady, trackingNumbers])

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <div className="rounded-lg border bg-white">
          <div className="border-b bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
            Bulk selection: loaded {readyCount} of {trackingNumbers.length} AWBs. Use the normal Shipping & Label options below; the print button will print all selected AWBs.
          </div>
          <div className="divide-y">
            {trackingNumbers.map((trackingNumber) => (
              <div key={trackingNumber} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium">{trackingNumber}</span>
                <span className={readyTrackingNumbers[trackingNumber] ? "text-green-700" : "text-slate-500"}>
                  {readyTrackingNumbers[trackingNumber] ? "Ready" : "Loading..."}
                </span>
              </div>
            ))}
            {trackingNumbers.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-500">No AWBs selected.</div>}
          </div>
        </div>
      </div>

      {trackingNumbers.map((trackingNumber) => (
        <EnhancedShippingPage
          key={trackingNumber}
          ref={getRef(trackingNumber)}
          trackingNumberOverride={trackingNumber}
          hidden={trackingNumber !== trackingNumbers[0]}
          onReady={handleReady}
          onCombinedPrint={trackingNumber === trackingNumbers[0] ? handlePrint : undefined}
          onPrintOptionsChange={trackingNumber === trackingNumbers[0] ? setPrintOptions : undefined}
          printOptions={trackingNumber === trackingNumbers[0] ? undefined : printOptions}
        />
      ))}
    </>
  )
}

export default function BulkShippingAndLabelRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      }
    >
      <BulkShippingAndLabelPage />
    </Suspense>
  )
}
