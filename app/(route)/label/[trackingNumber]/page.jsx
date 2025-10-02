"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import Barcode from "react-barcode"
import JsBarcode from "jsbarcode"

export default function Label() {
  const { trackingNumber } = useParams()
  const [awbData, setAwbData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const printableAreaRef = useRef(null)
  const [totalBoxes, setTotalBoxes] = useState(1)

  useEffect(() => {
    const fetchAWBData = async () => {
      console.log(`AWB fetching data ${trackingNumber}`)
      setLoading(true)
      try {
        const response = await axios.get(`/api/awb/${trackingNumber}`)
        setAwbData(response.data[0])
        setTotalBoxes(response.data[0]?.boxes.length || 1)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch AWB data")
        setLoading(false)
      }
    }

    if (trackingNumber) {
      fetchAWBData()
    }
  }, [trackingNumber])

  const generateLabelHTML = (boxNumber) => {
    return `
      <div class="barcode-top-right">
        <svg class="barcode-svg" data-box="${boxNumber}"></svg>
      </div>
      <div class="address-section">
        <h2 class="font-bold mb-2">Receiver:</h2>
        <p class="font-bold uppercase">${awbData?.receiver?.name || ""}</p>
        ${awbData?.receiver?.companyName ? `<p class="font-bold uppercase">C/O ${awbData?.receiver?.companyName}</p>` : ""}
        <p>${awbData?.receiver?.address || ""}</p>
        <div class="contact-info">
          <p><strong>Zip Code:</strong> ${awbData?.receiver?.zip || ""}</p>
          <p><strong>Country:</strong> ${awbData?.receiver?.country || ""}</p>
        </div>
        <p>Cont No: ${awbData?.receiver?.contact || ""}</p>
      </div>
    `
  }

  const generatePageLayout = (boxesOnPage, startBox) => {
    const boxCount = Math.min(boxesOnPage, 4) // Max 4 boxes per page

    if (boxCount === 1) {
      return `
        <div class="page">
          <div class="label-full">
            ${generateLabelHTML(startBox)}
          </div>
        </div>
      `
    } else if (boxCount === 2) {
      return `
        <div class="page">
          <div class="label-half">
            ${generateLabelHTML(startBox)}
          </div>
          <div class="label-half">
            ${generateLabelHTML(startBox + 1)}
          </div>
        </div>
      `
    } else if (boxCount === 3) {
      return `
        <div class="page">
          <div class="top-half">
            <div class="label-quarter">
              ${generateLabelHTML(startBox)}
            </div>
            <div class="label-quarter">
              ${generateLabelHTML(startBox + 1)}
            </div>
          </div>
          <div class="bottom-half">
            <div class="label-half-full">
              ${generateLabelHTML(startBox + 2)}
            </div>
          </div>
        </div>
      `
    } else if (boxCount === 4) {
      return `
        <div class="page">
          <div class="top-half">
            <div class="label-quarter">
              ${generateLabelHTML(startBox)}
            </div>
            <div class="label-quarter">
              ${generateLabelHTML(startBox + 1)}
            </div>
          </div>
          <div class="bottom-half">
            <div class="label-quarter">
              ${generateLabelHTML(startBox + 2)}
            </div>
            <div class="label-quarter">
              ${generateLabelHTML(startBox + 3)}
            </div>
          </div>
        </div>
      `
    }
  }

  const handlePrint = () => {
    const originalContent = document.body.innerHTML

    // Calculate number of pages needed
    const totalPages = Math.ceil(totalBoxes / 4)
    let allPages = ""

    for (let page = 0; page < totalPages; page++) {
      const startBox = page * 4 + 1
      const boxesOnThisPage = Math.min(4, totalBoxes - page * 4)

      allPages += generatePageLayout(boxesOnThisPage, startBox)

      // Add page break if not the last page
      if (page < totalPages - 1) {
        allPages += '<div class="page-break"></div>'
      }
    }

    document.body.innerHTML = `
      <style>
        @page {
          size: A4;
          margin: 0.5cm;
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        
        .page {
          width: 100%;
          height: 28.7cm; /* A4 height minus margins */
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        
        .page-break {
          page-break-after: always;
        }
        
        /* Full page label (1 box) */
        .label-full {
          width: 100%;
          height: 100%;
          border: 2px solid #000;
          border-radius: 15px;
          padding: 1cm;
          box-sizing: border-box;
          position: relative;
        }
        
        /* Half page labels (2 boxes) */
        .label-half {
          width: 100%;
          height: 50%;
          border: 2px solid #000;
          border-radius: 10px;
          padding: 0.8cm;
          box-sizing: border-box;
          position: relative;
          margin-bottom: 0.2cm;
        }
        
        .label-half:last-child {
          margin-bottom: 0;
        }
        
        /* Top and bottom halves for 3 and 4 box layouts */
        .top-half, .bottom-half {
          width: 100%;
          height: 50%;
          display: flex;
          flex-direction: row;
          gap: 0.2cm;
        }
        
        .bottom-half {
          margin-top: 0.2cm;
        }
        
        /* Quarter labels (for 3 and 4 box layouts) */
        .label-quarter {
          width: 50%;
          height: 100%;
          border: 2px solid #000;
          border-radius: 8px;
          padding: 0.6cm;
          box-sizing: border-box;
          position: relative;
        }
        
        /* Full width label in bottom half (for 3 box layout) */
        .label-half-full {
          width: 100%;
          height: 100%;
          border: 2px solid #000;
          border-radius: 10px;
          padding: 0.8cm;
          box-sizing: border-box;
          position: relative;
        }
        
        /* Address section styling */
        .address-section {
          width: 70%;
          padding-top: 0.5cm;
        }
        
        /* Barcode positioning */
        .barcode-top-right {
          position: absolute;
          top: 0.5cm;
          right: 0.5cm;
          width: 25%;
          text-align: right;
        }
        
        /* Typography */
        h2 {
          margin-top: 0;
          margin-bottom: 0.3cm;
        }
        
        p {
          margin: 0.2cm 0;
          line-height: 1.2;
        }
        
        .font-bold {
          font-weight: bold;
        }
        
        .uppercase {
          text-transform: uppercase;
        }
        
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.1cm;
        }
        
        /* Responsive font sizes */
        .label-full h2 { font-size: 28pt; }
        .label-full p { font-size: 24pt; }
        
        .label-half h2 { font-size: 20pt; }
        .label-half p { font-size: 18pt; }
        
        .label-half-full h2 { font-size: 20pt; }
        .label-half-full p { font-size: 18pt; }
        
        .label-quarter h2 { font-size: 14pt; }
        .label-quarter p { font-size: 12pt; }
        
        /* Ensure text doesn't overflow */
        .address-section p {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
      </style>
      ${allPages}
    `

    // Render barcodes after HTML is set
    setTimeout(() => {
      const barcodeElements = document.querySelectorAll(".barcode-svg")
      barcodeElements.forEach((element) => {
        const boxNumber = element.getAttribute("data-box")

        // Determine barcode size based on label type
        let barcodeHeight = 40
        let barcodeWidth = 1.2

        const labelParent = element.closest(".label-full, .label-half, .label-quarter, .label-half-full")

        if (labelParent?.classList.contains("label-full")) {
          barcodeHeight = 60
          barcodeWidth = 2
        } else if (
          labelParent?.classList.contains("label-half") ||
          labelParent?.classList.contains("label-half-full")
        ) {
          barcodeHeight = 45
          barcodeWidth = 1.5
        } else if (labelParent?.classList.contains("label-quarter")) {
          barcodeHeight = 35
          barcodeWidth = 1
        }

        JsBarcode(element, awbData?.trackingNumber || "N/A", {
          format: "CODE128",
          width: barcodeWidth,
          height: barcodeHeight,
          displayValue: false,
          fontSize: 0,
          margin: 2,
        })
      })

      // Print after barcodes are rendered
      setTimeout(() => {
        window.print()
        document.body.innerHTML = originalContent
        window.location.reload()
      }, 300)
    }, 200)
  }

  const getLayoutDescription = () => {
    if (totalBoxes === 1) return "One full-page label"
    if (totalBoxes === 2) return "Two half-page labels (stacked vertically)"
    if (totalBoxes === 3) return "Two labels on top half (side by side), one full-width label on bottom half"
    if (totalBoxes === 4) return "Four quarter-page labels in a 2×2 grid"

    const pages = Math.ceil(totalBoxes / 4)
    return `${totalBoxes} labels across ${pages} page${pages > 1 ? "s" : ""} (max 4 labels per page)`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-center text-red-600">Error</h1>
        <p className="text-center text-xl">{error}</p>
      </div>
    )
  }

  if (!awbData) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">No Data Found</h1>
        <p className="text-center text-xl">No tracking information found for the given tracking number.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 bg-white">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#232C65]">Shipping Labels</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="totalBoxes" className="text-sm font-medium">
              Total Boxes:
            </label>
            <input
              id="totalBoxes"
              type="number"
              min="1"
              max="100"
              value={totalBoxes}
              onChange={(e) => setTotalBoxes(Math.max(1, Math.min(100, Number.parseInt(e.target.value) || 1)))}
              className="w-16 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button onClick={handlePrint} className="flex items-center gap-2 bg-[#232C65] hover:bg-[#1a2150]">
            <Printer className="h-4 w-4" />
            Print Labels
          </Button>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium mb-2">Preview Layout:</h2>
        <p className="text-sm text-gray-600">
          This will generate {totalBoxes} shipping label{totalBoxes > 1 ? "s" : ""} with barcodes positioned in the top
          right corner.
        </p>
        <p className="text-sm text-gray-700 font-medium mt-2">Layout: {getLayoutDescription()}</p>
      </div>

      <div ref={printableAreaRef} className="flex flex-col gap-4">
        {Array.from({ length: Math.min(totalBoxes, 2) }).map((_, index) => (
          <div key={index} className="border border-gray-300 rounded-lg p-4 relative">
            <div className="absolute top-2 right-2" style={{ width: "20%" }}>
              <Barcode
                height={30}
                width={1}
                fontSize={0}
                value={awbData?.trackingNumber || "N/A"}
                displayValue={false}
              />
            </div>
            <div className="pt-10 pr-24">
              <h2 className="font-bold mb-2">Receiver:</h2>
              <p className="font-bold uppercase">{awbData.receiver?.name}</p>
              {awbData.receiver?.companyName && (
                <p className="font-bold uppercase">C/O {awbData.receiver?.companyName}</p>
              )}
              <p>{awbData.receiver?.address}</p>
              <div className="flex flex-col gap-1 mt-2">
                <p>
                  <strong>Zip Code:</strong> {awbData.receiver?.zip}
                </p>
                <p>
                  <strong>Country:</strong> {awbData.receiver?.country}
                </p>
              </div>
              <p className="mt-2">Cont No: {awbData.receiver?.contact}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
