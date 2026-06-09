"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft, Mail, Phone, Globe, MapPin, Package, FileText, Image as ImageIcon, FileSpreadsheet, FileCheck } from "lucide-react"
import axios from "axios"
import { format } from "date-fns"
import { ToWords } from "to-words"
import { getCode } from "iso-3166-1-alpha-2"
import html2canvas from "html2canvas"

const COMPANY_DETAILS = {
    name: "KargoOne Express Now",
    address: "Andheri East, Mumbai 400069",
    court: "Mumbai",
    phone: "+91 91520 39557",
    email: "support@kargoone.com",
    gstin: "",
    website: "www.kargoone.com"
}

const BANK_DETAILS = {
    bankingName: "Kargo One",
    bankName: "",
    accountNumber: "",
    ifsc: ""
}

const UPI_ID = ""

// Reusable AWB Copy component (used twice on one A4)
function AwbCopy({ awb, boxRows, totalActualWeight, totalVolWeight, totalChargeableWeight, totalBoxes, hasFinancials, financials, formatCurrency, contentDescription, barcodeUrl, clientFranchiseName }) {
  return (
    <div
      className="h-full w-full bg-white border-2 border-black text-black overflow-hidden"
      style={{ fontSize: '9.5pt', fontFamily: 'Arial, sans-serif', lineHeight: '1.25' }}
    >

      {/* TOP HEADER */}
      <div className="flex border-b-2 border-black" style={{ minHeight: '58px' }}>

        {/* Logo - bigger, no company name below */}
        <div className="w-[25%] border-r-2 border-black px-1 flex flex-col justify-center items-center">
          <img
            src="/kargoone-logo.png"
            className="w-[204px] h-[70px] object-contain"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>

        {/* Destination Country & Zip - center */}
        <div className="w-[40%] border-r-2 border-black flex flex-col items-center justify-center py-1">
          <div className="font-bold uppercase text-gray-500" style={{ fontSize: '6.5pt', letterSpacing: '1px' }}>Destination</div>
          <div className="font-extrabold uppercase leading-tight text-center" style={{ fontSize: '12pt' }}>
            {awb.receiver?.country}
          </div>
          <div className="font-bold font-mono mt-0.5" style={{ fontSize: '16pt' }}>
            {awb.receiver?.zip || '-'}
          </div>
        </div>

        {/* Barcode + Tracking Number - right-center */}
        <div className="w-[25%] border-r-2 border-black flex flex-col items-center justify-center py-1">
          <img src={barcodeUrl} className="h-9 object-contain" alt="Barcode" />
          <div
            className="font-bold tracking-[2px] font-mono leading-tight mt-1"
            style={{ fontSize: '10.5pt' }}
          >
            {awb.trackingNumber.split('').join(' ')}
          </div>
        </div>

        {/* DOC / NON DOC - right */}
        <div className="w-[10%] flex flex-col items-start justify-center pl-1" style={{ fontSize: '8pt' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <input type="checkbox" className="w-3 h-3" readOnly />
            <span className="font-bold">DOC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input type="checkbox" className="w-3 h-3" checked readOnly />
            <span className="font-bold">NON DOC</span>
          </div>
        </div>
      </div>

      {/* SECTION HEADERS ROW 1 */}
      <div
        className="grid grid-cols-12 bg-blue-900 text-white font-bold border-b border-black"
        style={{ fontSize: '7.5pt' }}
      >
        <div className="col-span-5 border-r border-black px-1 py-0.5">1. FROM (SENDER)</div>
        <div className="col-span-5 border-r border-black px-1 py-0.5">3. SHIPMENT INFORMATION</div>
        <div className="col-span-2 px-1 py-0.5">4. SERVICE DETAILS</div>
      </div>

      {/* MAIN ROW 1 */}
      <div className="grid grid-cols-12 border-b border-black" style={{ minHeight: '98px' }}>

        {/* FROM (SENDER) */}
        <div className="col-span-5 border-r border-black p-1" style={{ fontSize: '7pt' }}>
          <div className="mt-0.5">
            <div className="font-bold leading-tight" style={{ fontSize: '6.5pt' }}>
              Individual / Company Name &amp; Address
            </div>
            <div className="font-bold" style={{ fontSize: '9pt' }}>{awb.sender?.name}</div>
            <div className="leading-snug" style={{ fontSize: '7.5pt' }}>
              {awb.sender?.address}{awb.sender?.address2 ? `, ${awb.sender.address2}` : ''}
            </div>
            <div style={{ fontSize: '7.5pt' }}>{awb.sender?.city}, {awb.sender?.state}</div>
            <div style={{ fontSize: '7.5pt' }}>{awb.sender?.country}</div>
          </div>
          <div className="flex mt-1" style={{ fontSize: '7.5pt' }}>
            <div>Postal code : <span className="font-bold">{awb.sender?.zip}</span></div>
          </div>
          <div className="flex mt-1" style={{ fontSize: '8pt' }}>
            <div className="font-bold">Contact:</div>
            <div className="ml-1">{awb.sender?.contact}</div>
          </div>
        </div>

        {/* SHIPMENT INFORMATION TABLE */}
        <div className="col-span-5 border-r border-black" style={{ fontSize: '6.5pt' }}>
          <table className="w-full border border-black border-collapse" style={{ fontSize: '6.5pt' }}>
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black px-1.5 text-center font-bold">Box No</th>
                <th className="border border-black px-1.5 text-center font-bold">Act. Wt</th>
                <th colSpan={3} className="border border-black px-1.5 text-center font-bold">
                  Dimension (cm)
                </th>
                <th className="border border-black px-1.5 text-center font-bold">Dim. Wt.</th>
                <th className="border border-black px-1.5 text-center font-bold">Chg. Wt.</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black px-1.5"></th>
                <th className="border border-black px-1.5"></th>
                <th className="border border-black px-1.5 text-center font-bold">L</th>
                <th className="border border-black px-1.5 text-center font-bold">B</th>
                <th className="border border-black px-1.5 text-center font-bold">H</th>
                <th className="border border-black px-1.5"></th>
                <th className="border border-black px-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {boxRows.map((box, i) => (
                <tr key={i} className="text-center">
                  <td className="border border-black px-1.5 font-medium">{box.boxNo}</td>
                  <td className="border border-black px-1.5">
                    {Number(box.actualWeight || 0).toFixed(2)} KG
                  </td>
                  <td className="border border-black px-1.5">{box.length || '-'}</td>
                  <td className="border border-black px-1.5">{box.breadth || box.width || '-'}</td>
                  <td className="border border-black px-1.5">{box.height || '-'}</td>
                  <td className="border border-black px-1.5">
                    {Number(box.dimensionalWeight || 0).toFixed(2)} KG
                  </td>
                  <td className="border border-black px-1.5 font-bold">
                    {Number(box.chargeableWeight || 0).toFixed(2)} KG
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-bold bg-gray-100">
              <tr className="text-center">
                <td className="border border-black px-1.5">Total</td>
                <td className="border border-black px-1.5">{totalActualWeight.toFixed(2)} KG</td>
                <td colSpan={3} className="border border-black px-1.5"></td>
                <td className="border border-black px-1.5">{totalVolWeight.toFixed(2)} KG</td>
                <td className="border border-black px-1.5">{totalChargeableWeight.toFixed(2)} KG</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* SERVICE DETAILS */}
        <div className="col-span-2 p-1" style={{ fontSize: '7.5pt' }}>
          <div className="mt-1">
            <div className="font-bold">Service:</div>
            <div className="font-bold uppercase" style={{ fontSize: '8pt' }}>
              {awb?.financials?.sales?.serviceType}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION HEADERS ROW 2 */}
      <div
        className="grid grid-cols-12 bg-blue-900 text-white font-bold border-b border-black"
        style={{ fontSize: '7.5pt' }}
      >
        <div className="col-span-8 border-r border-black px-1 py-0.5">2. TO (RECEIVER)</div>
        <div className="col-span-4 px-1 py-0.5">5. Description of Content (Non-Document)</div>
      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-12 border-b border-black" style={{ minHeight: '78px' }}>

        {/* TO (RECEIVER) */}
        <div className="col-span-8 border-r border-black p-1" style={{ fontSize: '7.5pt' }}>
          <div className="mt-0.5">
            <div className="font-bold leading-tight -mt-1" style={{ fontSize: '6.5pt' }}>
              Individual / Company Name &amp; Address
            </div>
            <div className="font-bold" style={{ fontSize: '9pt' }}>{awb.receiver?.name}</div>
            <div className="leading-snug" style={{ fontSize: '7.5pt' }}>
              {awb.receiver?.address}{awb.receiver?.address2 ? `, ${awb.receiver.address2}` : ''}
            </div>
            <div style={{ fontSize: '7.5pt' }}>{awb.receiver?.city}, {awb.receiver?.state}</div>
            <div className="font-bold" style={{ fontSize: '10.5pt' }}>{awb.receiver?.country}</div>
          </div>
          <div className="flex mt-1" style={{ fontSize: '10.5pt' }}>
            <div>Zip code : <span className="font-bold">{awb.receiver?.zip}</span></div>
          </div>
          <div className="flex mt-1" style={{ fontSize: '8pt' }}>
            <div className="font-bold">Contact</div>
            <div className="ml-1 font-bold" style={{ fontSize: '10pt' }}>{awb.receiver?.contact}</div>
          </div>
        </div>

        {/* DESCRIPTION OF CONTENT */}
        <div className="col-span-4 p-1 flex" style={{ fontSize: '7.5pt' }}>
          <div className="flex-1 pr-1">
            <div className="font-bold mb-1" style={{ fontSize: '6.5pt' }}>
              DESCRIPTION OF CONTENT (Non-Document)
            </div>
            <div
              className="leading-snug overflow-hidden"
              style={{ fontSize: '7pt', maxHeight: '50px' }}
            >
              {contentDescription}
            </div>
          </div>
        </div>
      </div>

      {/* SECTIONS 6 & 7 & CLIENT/FRANCHISE */}
      <div className="grid grid-cols-12 border-b border-black">
        <div className="col-span-8 border-r border-black">
          <div className="grid grid-cols-2">
            {/* SPECIAL INSTRUCTIONS */}
            <div className="border-r border-black p-1" style={{ fontSize: '7.5pt' }}>
              <div
                className="bg-blue-900 text-white font-bold px-1 -mx-1 -mt-1 mb-1"
                style={{ fontSize: '7.5pt' }}
              >
                6. SPECIAL INSTRUCTIONS
              </div>
              <div style={{ fontSize: '7pt' }}>
                {awb.financials?.sales?.specialInstructions || ''}
              </div>
            </div>
            {/* PICK UP */}
            <div className="p-1" style={{ fontSize: '7.5pt' }}>
              <div
                className="bg-blue-900 text-white font-bold px-1 -mx-1 -mt-1 mb-1"
                style={{ fontSize: '7.5pt' }}
              >
                7. PICK UP
              </div>
              <div className="flex" style={{ fontSize: '7pt' }}>
                <div className="flex-1">
                  <div style={{ fontSize: '6.5pt' }}>Courier Code</div>
                  <div className="font-bold">{awb.courierCode || '-'}</div>
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: '6.5pt' }}>Date / Time</div>
                  <div className="font-bold">
                    {format(new Date(awb.date || new Date()), "dd/MM/yyyy")} /{" "}
                    {format(new Date(awb.date || new Date()), "HH:mm")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* CLIENT / FRANCHISE BOX */}
        <div className="col-span-4 p-1" style={{ fontSize: '7.5pt' }}>
          <div
            className="bg-blue-900 text-white font-bold px-1 -mx-1 -mt-1 mb-1"
            style={{ fontSize: '7.5pt' }}
          >
            CLIENT / FRANCHISE
          </div>
          <div className="flex flex-col gap-1" style={{ fontSize: '7pt' }}>
            <div className="flex items-center gap-1">
              <span className="font-bold" style={{ fontSize: '6.5pt', minWidth: '38px' }}>Code</span>
              <span className="font-mono font-bold text-red-700" style={{ fontSize: '8pt' }}>
                {awb?.refCode || '-'}
              </span>
            </div>
            <div className="flex items-start gap-1">
              <span className="font-bold" style={{ fontSize: '6.5pt', minWidth: '38px' }}>Name</span>
              <span className="font-bold uppercase leading-tight" style={{ fontSize: '8pt' }}>
                {clientFranchiseName || awb?.refCode || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTIONS 8 & 9 — SIGNATURES */}
      <div className="grid grid-cols-12 border-b border-black" style={{ minHeight: '105px' }}>

        {/* SHIPPER'S SIGNATURE */}
        <div className="col-span-6 border-r border-black p-1" style={{ fontSize: '7pt' }}>
          <div
            className="bg-blue-900 text-white font-bold px-1 -mx-1 mb-1"
            style={{ fontSize: '7.5pt' }}
          >
            8. SHIPPER'S SIGNATURE &amp; AUTHORIZATION
          </div>
          <div className="leading-snug" style={{ fontSize: '6.5pt' }}>
            DESCRIPTION &amp; VALUES OF GOOD (Please attach a commercial invoice if shipping parcels):<br />
            I/WE authorize to make Computerised invoice on my/our behalf for custom purpose.<br />
            I/WE authorize as my / our agent to ship my/our shipments through courier or cargo mode.<br />
            The shipper has read, understood and agree's to the standard terms and conditions of carriage.
          </div>
          <div className="mt-1 flex justify-between" style={{ fontSize: '6.5pt' }}>
            <div><span className="font-bold">DECLARED VALUE :</span></div>
            <div>Signature</div>
            <div>
              Date {format(new Date(awb.date || new Date()), "dd/MM/yyyy")}{" "}
              Time {format(new Date(awb.date || new Date()), "HH:mm")}
            </div>
          </div>
        </div>

        {/* RECEIVER */}
        <div className="col-span-6 p-1" style={{ fontSize: '7pt' }}>
          <div
            className="bg-blue-900 text-white font-bold px-1 -mx-1 mb-1"
            style={{ fontSize: '7.5pt' }}
          >
            9. RECEIVER
          </div>
          <div className="leading-snug" style={{ fontSize: '6.5pt' }}>
            Acknowledgement : I/we agree and adhere to the Terms &amp; Conditions laid down on the
            reverse of the waybill. I/We acknowledge that the package/s have been received in good
            condition.
          </div>
          <div className="mt-2 flex justify-between" style={{ fontSize: '6.5pt' }}>
            <div>Name &amp; Signature / Seal</div>
            <div>
              Date {format(new Date(awb.date || new Date()), "dd/MM/yyyy")}{" "}
              Time {format(new Date(awb.date || new Date()), "HH:mm")}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InvoicePage({ params }) {
  const router = useRouter()
  const { trackingNumber } = use(params)
  const [awb, setAwb] = useState(null)
  const [loading, setLoading] = useState(true)
  const [clientFranchiseName, setClientFranchiseName] = useState("")

  const [viewMode, setViewMode] = useState("detailed")
  const [docMode, setDocMode] = useState("awb")

  const invoiceRef = useRef(null)

  const toWords = new ToWords({
    localeCode: 'en-IN',
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
      currencyOptions: {
        name: 'Rupee',
        plural: 'Rupees',
        symbol: '₹',
        fractionalUnit: {
          name: 'Paisa',
          plural: 'Paise',
          symbol: '',
        },
      },
    },
  })

  useEffect(() => {
    const fetchAwb = async () => {
      try {
        const res = await axios.get(`/api/awb/${trackingNumber}`)
        const data = Array.isArray(res.data) ? res.data[0] : res.data
        setAwb(data)

        const sales = data.financials?.sales
        const hasMoney = sales && (Number(sales.grandTotal) > 0 || Number(sales.rates?.ratePerKg) > 0)
        setDocMode(hasMoney ? "bill" : "awb")

        // Fetch client/franchise name from refCode
        if (data?.refCode) {
          await fetchClientFranchiseName(data.refCode)
        }
      } catch (error) {
        console.error("Error fetching invoice", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAwb()
  }, [trackingNumber])

  const fetchClientFranchiseName = async (refCode) => {
    if (!refCode) return

    // Try fetching from clients first
    try {
      const clientRes = await axios.get(`/api/clients/${refCode}`)
      const clientData = clientRes.data
      if (clientData) {
        const name = clientData.name || clientData.companyName || clientData.clientName || clientData.businessName || ""
        if (name) {
          setClientFranchiseName(name)
          return
        }
      }
    } catch (err) {
      // Client not found, try franchise
    }

    // Try fetching from franchises
    try {
      const franchiseRes = await axios.get(`/api/franchises/${refCode}`)
      const franchiseData = franchiseRes.data
      if (franchiseData) {
        const name = franchiseData.name || franchiseData.companyName || franchiseData.franchiseName || franchiseData.businessName || ""
        if (name) {
          setClientFranchiseName(name)
          return
        }
      }
    } catch (err) {
      // Franchise not found either
    }

    // Fallback: use refCode itself
    setClientFranchiseName("")
  }

  const handleDownloadImage = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
      })
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `${docMode === 'bill' ? 'Invoice' : 'AWB'}-${awb.trackingNumber}.png`
      link.click()
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (!awb) return <div className="text-center p-10">Data Not Found</div>

  // --- DATA PREP ---
  const financials = awb.financials?.sales || {
    weight: { chargeable: 0 },
    rates: { ratePerKg: 0, baseTotal: 0 },
    charges: { otherCharges: [], awbCharge: 0, fuelAmount: 0, gstAmount: 0 },
    grandTotal: 0
  }

  const hasFinancials = Number(financials.grandTotal) > 0 || Number(financials.rates.ratePerKg) > 0
  const isEstimate = Number(financials.charges.gstAmount) === 0
  const payments = awb.financials?.payments || []
  const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0)
  const balanceDue = financials.grandTotal - totalPaid
  const ratePerKg = Number(financials.rates.ratePerKg) || 0

  const boxRows = (awb.boxes || []).map((box, index) => {
    const chargeable = Number(box.chargeableWeight) || 0
    return {
      ...box,
      boxNo: box.boxNo || (index + 1),
      rowAmount: chargeable * ratePerKg
    }
  })

  const totalFreightAmount = boxRows.reduce((sum, box) => sum + box.rowAmount, 0)
  const totalBoxes = awb.boxes?.length || 0
  const totalActualWeight = awb.boxes?.reduce((a, b) => a + Number(b.actualWeight), 0) || 0
  const totalVolWeight = awb.boxes?.reduce((a, b) => a + Number(b.dimensionalWeight), 0) || 0
  const totalChargeableWeight = awb.boxes?.reduce((a, b) => a + Number(b.chargeableWeight), 0) || 0

  const contentDescription = (() => {
    const items = []
    ;(awb.boxes || []).forEach(box => {
      ;(box.items || []).forEach(item => {
        if (item?.name) items.push(item.name.trim())
      })
    })
    let text = items.join(", ")
    if (text.length > 100) text = text.substring(0, 97) + "..."
    return text || "Non-Document shipment"
  })()

  // --- LINKS ---
  const trackingPageUrl = `https://kargoone.com/track/${awb.trackingNumber}`
  const trackingQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${trackingPageUrl}`
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${COMPANY_DETAILS.name.replace(" ", "%20")}&am=${financials.grandTotal}&cu=INR`
  const upiQrData = `upi://pay?pa=${UPI_ID}%26pn=${COMPANY_DETAILS.name.replace(" ", "%20")}%26am=${financials.grandTotal}%26cu=INR`
  const paymentQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${upiQrData}`
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${awb.trackingNumber}&scale=2&height=10&incltext&textxalign=center`

  const formatCurrency = (amt) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amt || 0)

  const getCountryIso = (name) => {
    if (!name) return null
    const code = getCode(name)
    return code ? code.toLowerCase() : null
  }

  const senderCode = getCountryIso(awb.sender?.country)
  const receiverCode = awb?.receiver?.country === "United States Of America"
    ? "us"
    : getCountryIso(awb.receiver?.country)

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-8 print:bg-white print:p-0 print:block">
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; width: 100%; height: 100%; }
          .print-hidden { display: none !important; }
          .a4-page { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      {/* CONTROL BAR */}
      <div className="w-[210mm] mb-6 flex flex-col gap-4 print-hidden">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="flex gap-4">
            {/* AWB vs BILL */}
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setDocMode("awb")}
                className={`text-xs px-3 py-1.5 rounded flex items-center gap-2 transition-all ${
                  docMode === "awb"
                    ? "bg-white shadow text-blue-700 font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" /> AWB Copy
              </button>

              <div className="relative group">
                <button
                  onClick={() => hasFinancials && setDocMode("bill")}
                  disabled={!hasFinancials}
                  className={`text-xs px-3 py-1.5 rounded flex items-center gap-2 transition-all ${
                    docMode === "bill"
                      ? "bg-white shadow text-green-700 font-bold"
                      : "text-gray-500"
                  } ${!hasFinancials ? "opacity-50 cursor-not-allowed" : "hover:text-gray-900"}`}
                >
                  <FileCheck className="w-4 h-4" /> Bill / Invoice
                </button>
                {!hasFinancials && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-black text-white text-[10px] px-2 py-1 rounded hidden group-hover:block">
                    Bill Under Process
                  </div>
                )}
              </div>
            </div>

            {/* VIEW MODE */}
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setViewMode("detailed")}
                className={`text-xs px-3 py-1.5 rounded flex items-center gap-2 transition-all ${
                  viewMode === "detailed"
                    ? "bg-white shadow text-orange-600 font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Package className="w-4 h-4" /> Box Version
              </button>
              <button
                onClick={() => setViewMode("summary")}
                className={`text-xs px-3 py-1.5 rounded flex items-center gap-2 transition-all ${
                  viewMode === "summary"
                    ? "bg-white shadow text-orange-600 font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <FileText className="w-4 h-4" /> Summary Version
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadImage} className="border-gray-300">
              <ImageIcon className="w-4 h-4 mr-2" /> Save Image
            </Button>
            <Button size="sm" onClick={() => window.print()} className="bg-[#232C65] text-white">
              <Printer className="w-4 h-4 mr-2" /> Print / PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ========== A4 PAGE ========== */}
      <div
        ref={invoiceRef}
        className="a4-page shadow-2xl bg-white relative"
        style={{
          width: "210mm",
          height: "297mm",
          boxSizing: "border-box",
          padding: "4mm",
          margin: "0 auto"
        }}
      >
        {docMode === "awb" ? (
          /* ========== 2 AWB COPIES ON ONE A4 PAGE ========== */
          <div className="h-full w-full flex flex-col" style={{ gap: '3px' }}>

            {/* AWB COPY 1 */}
            <div
              className="border border-black overflow-hidden"
              style={{ flex: '1 1 0', padding: '1.5mm' }}
            >
              <AwbCopy
                awb={awb}
                boxRows={boxRows}
                totalActualWeight={totalActualWeight}
                totalVolWeight={totalVolWeight}
                totalChargeableWeight={totalChargeableWeight}
                totalBoxes={totalBoxes}
                hasFinancials={hasFinancials}
                financials={financials}
                formatCurrency={formatCurrency}
                contentDescription={contentDescription}
                barcodeUrl={barcodeUrl}
                clientFranchiseName={clientFranchiseName}
              />
            </div>

            {/* Dashed Separator */}
            <div
              className="flex-shrink-0 flex items-center"
              style={{ height: '10px' }}
            >
              <div className="w-full border-t-2 border-dashed border-gray-500"></div>
            </div>

            {/* AWB COPY 2 */}
            <div
              className="border border-black overflow-hidden"
              style={{ flex: '1 1 0', padding: '1.5mm' }}
            >
              <AwbCopy
                awb={awb}
                boxRows={boxRows}
                totalActualWeight={totalActualWeight}
                totalVolWeight={totalVolWeight}
                totalChargeableWeight={totalChargeableWeight}
                totalBoxes={totalBoxes}
                hasFinancials={hasFinancials}
                financials={financials}
                formatCurrency={formatCurrency}
                contentDescription={contentDescription}
                barcodeUrl={barcodeUrl}
                clientFranchiseName={clientFranchiseName}
              />
            </div>
          </div>

        ) : (
          /* ========== BILL / INVOICE (single full page) ========== */
          <div className="border-2 border-orange-600 rounded-3xl h-full p-4 flex flex-col justify-between relative overflow-hidden">
            <div>
              {/* HEADER */}
              <div className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-1/3">
                    <img
                      src="/kargoone-logo.png"
                      className="h-[80px] object-contain"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                  <div className="w-1/3 flex flex-col items-center pt-2 -mt-4">
                    <img src={barcodeUrl} className="h-12 object-contain" alt="Barcode" />
                    <div className="mt-2 flex items-center justify-center gap-3">
                      <div className="flex flex-col items-center">
                        {senderCode
                          ? <img src={`https://flagicons.lipis.dev/flags/4x3/${senderCode}.svg`} className="h-5 w-7 object-cover border shadow-sm" />
                          : <Globe className="h-5 w-5 text-gray-400" />
                        }
                        <span className="text-[8px] font-bold text-[#232C65] mt-0.5 uppercase">
                          {awb?.sender?.country}
                        </span>
                      </div>
                      <span className="text-[#E31E24] text-lg leading-none pb-2">→</span>
                      <div className="flex flex-col items-center">
                        {receiverCode
                          ? <img src={`https://flagicons.lipis.dev/flags/4x3/${receiverCode}.svg`} className="h-5 w-7 object-cover border shadow-sm" />
                          : <Globe className="h-5 w-5 text-gray-400" />
                        }
                        <span className="text-[8px] font-bold text-[#232C65] mt-0.5 uppercase">
                          {awb?.receiver?.country}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-1/3 text-right">
                    <h2 className="text-2xl font-bold text-[#E31E24] uppercase leading-none">
                      {isEstimate ? "ESTIMATE" : "TAX INVOICE"}
                    </h2>
                    <div className="text-[10px] mt-2 space-y-1">
                      <p><b>Date:</b> {format(new Date(awb.date), "dd MMM yyyy")}</p>
                      <p><b>AWB #:</b> {awb.trackingNumber}</p>
                      {!isEstimate && <p><b>GSTIN:</b> {COMPANY_DETAILS.gstin}</p>}
                    </div>
                  </div>
                </div>

                <div className="border-y-2 border-orange-600 py-1 -mx-4">
                  <div className="flex justify-center items-center flex-wrap gap-x-2 text-[8px] font-bold uppercase">
                    <div className="flex items-center gap-1"><MapPin className="h-3" /> {COMPANY_DETAILS.address}</div>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1"><Phone className="h-3" /> {COMPANY_DETAILS.phone}</div>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1"><Mail className="h-3" /> {COMPANY_DETAILS.email}</div>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1"><Globe className="h-3" /> {COMPANY_DETAILS.website}</div>
                  </div>
                </div>
              </div>

              {/* SHIPPER / CONSIGNEE */}
              <div className="flex border-b-2 border-red-600 -mx-4 -mt-2 relative">
                <div className="w-1/2 p-2 border-r border-orange-600 pr-16">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Shipper (From)</p>
                  <p className="font-bold text-orange-600 text-sm uppercase">{awb.sender?.name}</p>
                  <p className="text-[10px] mt-1 leading-snug">
                    {awb.sender?.address}, {awb?.sender?.address2}, {awb.sender?.city},{" "}
                    {awb.sender?.state}, {awb.sender?.country}
                  </p>
                  <div className="flex gap-3 mt-1 text-[10px]">
                    <p><b>ZIP:</b> {awb.sender?.zip}</p>
                    <p><b>Ph:</b> {awb.sender?.contact}</p>
                  </div>
                </div>
                <div className="w-1/2 p-2 pl-16 text-right">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Consignee (To)</p>
                  <p className="font-bold text-orange-600 text-sm uppercase">{awb.receiver?.name}</p>
                  <p className="text-[10px] mt-1 leading-snug">
                    {awb.receiver?.address}, {awb?.receiver?.address2}, {awb.receiver?.city},{" "}
                    {awb.receiver?.state}, {awb.receiver?.country}
                  </p>
                  <div className="flex gap-3 mt-1 text-[10px] justify-end">
                    <p><b>ZIP:</b> {awb.receiver?.zip}</p>
                    <p><b>Ph:</b> {awb.receiver?.contact}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 border border-orange-600 rounded-lg flex flex-col items-center shadow-sm">
                  <a href={trackingPageUrl} target="_blank" rel="noreferrer" className="cursor-pointer block">
                    <img src={trackingQrUrl} className="h-14 w-14 object-contain" alt="Track QR" />
                  </a>
                  <p className="text-[6px] font-bold uppercase mt-0.5 text-[#232C65]">Scan to Track</p>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="flex flex-grow py-2 flex-col">
              <table className="w-full text-[10px] border border-black border-collapse">
                <thead>
                  <tr className="bg-blue-200">
                    <th className="border p-1.5 text-center">
                      {viewMode === 'summary' ? 'Total Box' : '#'}
                    </th>
                    <th className="border p-1.5 text-left">Service</th>
                    <th className="border p-1.5">Act Wt</th>
                    <th className="border p-1.5">Vol Wt</th>
                    <th className="border p-1.5">Chg Wt</th>
                    {docMode === 'bill' && (
                      <>
                        <th className="border p-1.5 text-right">Rate</th>
                        <th className="border p-1.5 text-right">Amount</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {viewMode === "detailed" ? (
                    boxRows.map((box, i) => (
                      <tr key={i}>
                        <td className="border p-1 text-center">{i + 1}</td>
                        <td className="border p-1">{awb?.financials?.sales?.serviceType}</td>
                        <td className="border p-1 text-center">{Number(box.actualWeight).toFixed(2)} KG</td>
                        <td className="border p-1 text-center">{Number(box.dimensionalWeight).toFixed(2)} KG</td>
                        <td className="border p-1 text-center">{Number(box.chargeableWeight).toFixed(2)} KG</td>
                        {docMode === 'bill' && (
                          <>
                            <td className="border p-1 text-right">{formatCurrency(ratePerKg)}</td>
                            <td className="border p-1 text-right">{formatCurrency(box.rowAmount)}</td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border p-3 text-center font-bold">{totalBoxes}</td>
                      <td className="border p-3 font-bold uppercase text-orange-700">
                        {awb?.financials?.sales?.serviceType}
                      </td>
                      <td className="border p-3 text-center font-bold">{totalActualWeight.toFixed(2)} KG</td>
                      <td className="border p-3 text-center font-bold">{totalVolWeight.toFixed(2)} KG</td>
                      <td className="border p-3 text-center font-bold">{totalChargeableWeight.toFixed(2)} KG</td>
                      {docMode === 'bill' && (
                        <>
                          <td className="border p-3 text-right font-bold">{formatCurrency(ratePerKg)}</td>
                          <td className="border p-3 text-right font-bold">{formatCurrency(totalFreightAmount)}</td>
                        </>
                      )}
                    </tr>
                  )}
                </tbody>
                {viewMode === "detailed" && (
                  <tfoot className="font-bold bg-blue-200">
                    <tr>
                      <td colSpan={2} className="border p-1.5 text-right">TOTAL</td>
                      <td className="border p-1.5 text-center">{totalActualWeight.toFixed(2)} KG</td>
                      <td className="border p-1.5 text-center">{totalVolWeight.toFixed(2)} KG</td>
                      <td className="border p-1.5 text-center">{totalChargeableWeight.toFixed(2)} KG</td>
                      {docMode === 'bill' && (
                        <>
                          <td className="border p-1.5"></td>
                          <td className="border p-1.5 text-right">{formatCurrency(totalFreightAmount)}</td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* FOOTER */}
            <div className="border-t-2 border-orange-600 mt-2 -mx-4 px-2 flex">
              <div className={`${docMode === 'bill' ? 'w-4/5 border-r border-orange-300 -mb-3' : 'w-full'} pr-4 pt-2 border-gray-300`}>
                {docMode === 'bill' && (
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 text-[10px]">
                      <h4 className="font-bold text-[#232C65] border-b border-orange-300 mb-1 -mx-2 pl-2 pb-1">
                        BANK DETAILS
                      </h4>
                      <p>Banking Name: <b>{BANK_DETAILS.bankingName}</b></p>
                      <p>Bank Name: <b>{BANK_DETAILS.bankName}</b></p>
                      <p>A/C No: <b>{BANK_DETAILS.accountNumber}</b></p>
                      <p>IFSC: <b>{BANK_DETAILS.ifsc}</b></p>
                    </div>
                    <div className="text-center min-w-[120px] border border-orange-300 py-4 -mr-[17px] -mt-[9px] p-1 rounded-bl-lg">
                      <a href={upiLink} className="cursor-pointer block">
                        <img src={paymentQrUrl} className="w-16 h-16 p-1 mx-auto" alt="Payment QR" />
                      </a>
                      <p className="text-[8px] -mt-1 font-bold text-orange-600">{COMPANY_DETAILS.name}</p>
                      <p className="text-[8px] mt-1">{UPI_ID}</p>
                      <div className="mt-1 flex justify-center">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/BHIM_logo.svg/960px-BHIM_logo.svg.png"
                          className="h-3 object-contain"
                          alt="BHIM"
                        />
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg"
                          className="h-3 object-contain"
                          alt="UPI"
                        />
                      </div>
                      <p className="text-[8px] mt-1 font-bold">Scan to Pay using any UPI App</p>
                      <div className="flex justify-center gap-1.5 mt-1">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-2.5 w-auto object-contain" alt="GPay" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" className="h-2.5 w-auto object-contain" alt="Paytm" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" className="h-2.5 w-auto object-contain" alt="PhonePe" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/67/Font_Awesome_5_brands_cc-amazon-pay.svg" className="h-2.5 w-auto object-contain" alt="Amazon" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-[8px] mt-2 leading-tight">
                  {docMode === 'bill' && isEstimate && (
                    <p className="font-bold text-red-600 uppercase mb-1 text-[9px] border border-red-500 p-1 inline-block">
                      *** This is an Estimate Bill ***
                    </p>
                  )}
                  <h4 className="font-bold mt-1">Terms &amp; Conditions</h4>
                  <ol className="list-decimal ml-3">
                    <li>Any Extra Charges (Remote, Pickup, etc) are charged extra.</li>
                    <li>Maximum claim: Rs. 100/kg or Rs. 5,000.</li>
                    <li>No responsibility for delays due to airlines, customs, weather, etc.</li>
                    <li>No claim accepted after 48 hrs.</li>
                    <li>Incorrect declaration responsibility of consignor.</li>
                    <li>Court jurisdiction: {COMPANY_DETAILS.court}.</li>
                    <li>Shipment complies with P&amp;T + IATA regulations.</li>
                    <li>No committed delivery time for economy services.</li>
                    <li>Not responsible for duties/penalties at destination country.</li>
                  </ol>
                </div>

                <div className="mt-4">
                  <h4 className="font-bold text-[10px] mb-1">Notes:</h4>
                  <div
                    className="border rounded-lg p-1 text-[9px] h-16 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: (awb.financials?.notes || "") }}
                  ></div>
                </div>
              </div>

              {docMode === 'bill' && (
                <div className="w-2/5 pl-3 text-[10px]">
                  <div className="flex justify-between p-1.5 border-b">
                    <span>Freight Total</span>
                    <span className="font-bold">{formatCurrency(totalFreightAmount)}</span>
                  </div>
                  {financials.charges.otherCharges?.map((c, i) => (
                    <div key={i} className="flex justify-between p-1.5 border-b border-dashed">
                      <span>{c.name}</span>
                      <span>{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                  {financials.charges.awbCharge > 0 && (
                    <div className="flex justify-between p-1.5 border-b border-dashed">
                      <span>AWB Charges</span>
                      <span>{formatCurrency(financials.charges.awbCharge)}</span>
                    </div>
                  )}
                  {financials.charges.fuelAmount > 0 && (
                    <div className="flex justify-between p-1.5 border-b border-dashed">
                      <span>Fuel ({financials.charges.fuelSurcharge}%)</span>
                      <span>{formatCurrency(financials.charges.fuelAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-1.5 border-y mt-1 font-bold">
                    <span>Sub Total</span>
                    <span>
                      {formatCurrency(Number(financials.grandTotal) - Number(financials.charges.gstAmount))}
                    </span>
                  </div>
                  {!isEstimate && (
                    <>
                      <div className="flex justify-between p-1.5 border-b">
                        <span>CGST ({financials.charges.cgstPercent}%)</span>
                        <span>{formatCurrency(financials.charges.cgstAmount)}</span>
                      </div>
                      <div className="flex justify-between p-1.5 border-b">
                        <span>SGST ({financials.charges.sgstPercent}%)</span>
                        <span>{formatCurrency(financials.charges.sgstAmount)}</span>
                      </div>
                      <div className="flex justify-between p-1.5">
                        <span>IGST ({financials.charges.igstPercent}%)</span>
                        <span>{formatCurrency(financials.charges.igstAmount)}</span>
                      </div>
                    </>
                  )}
                  {payments.length > 0 && (
                    <div className="bg-green-50 border-y border-green-200 my-1 -mx-3">
                      {payments.map((p, idx) => (
                        <div key={idx} className="flex justify-between p-1 px-2 text-[9px] text-green-700">
                          <span>Paid ({format(new Date(p.date), "dd/MM")}) - {p.mode}</span>
                          <span>-{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {balanceDue > 0 ? (
                    <div className="flex justify-between p-1.5 font-bold text-red-600 bg-blue-50 border-t border-red-200 -mx-3">
                      <span>BALANCE DUE</span>
                      <span>{formatCurrency(balanceDue)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between p-1.5 font-bold text-green-600 bg-green-50 border-t border-green-200 -mx-3">
                      <span>PAYMENT STATUS</span>
                      <span>PAID</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2 mt-1 text-white bg-[#232C65] text-xs font-bold -mx-3">
                    <span>GRAND TOTAL</span>
                    <span>{formatCurrency(financials.grandTotal)}/-</span>
                  </div>
                  <p className="text-[8px] italic mt-1">
                    In Words - {toWords.convert(financials.grandTotal)}
                  </p>
                  <div className="text-center mt-4">
                    <p className="text-[8px] font-bold text-[#232C65] mb-8">
                      For {COMPANY_DETAILS.name}
                    </p>
                    <div className="border-t w-3/4 mx-auto pt-1">
                      <p className="text-[7px] uppercase">Authorized Signatory</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-[10px] text-gray-500 print-hidden">
        © {new Date().getFullYear()} Kargo One Express Now. All rights reserved. Designed and Developed by <a href="https://exprova.com" target="_blank" rel="noreferrer" className="underline">Exprova.com</a>
      </div>
    </div>
  )
}