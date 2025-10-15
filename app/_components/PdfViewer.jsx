"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"

export default function PDFViewer({ base64Data }) {
  const [error, setError] = useState(false)

  if (!base64Data) {
    return (
      <div className="bg-slate-700 rounded p-4 flex items-center gap-2 text-slate-300">
        <AlertCircle className="w-5 h-5" />
        <span>No PDF data available</span>
      </div>
    )
  }

  return (
    <div className="bg-slate-700 rounded overflow-hidden">
      {error ? (
        <div className="p-4 flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load PDF</span>
        </div>
      ) : (
        <iframe
          src={`data:application/pdf;base64,${base64Data}`}
          className="w-full h-96 border-0"
          onError={() => setError(true)}
          title="PDF Document"
        />
      )}
    </div>
  )
}
