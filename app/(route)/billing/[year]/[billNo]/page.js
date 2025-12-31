"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import html2canvas from "html2canvas"
import { ToWords } from "to-words"
import { Loader2, Printer, Image as ImageIcon, ArrowLeft, MapPin, Phone, Mail, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

// --- CONSTANTS ---
const COMPANY_DETAILS = {
  name: "Kargo One",
  address: "Andheri East, Mumbai 400069",
  court: "Mumbai",
  phone: "+91 81691 55537",
  email: "info@kargoone.com",
  gstin: "-",
  website: "www.kargoone.com"
}

const BANK_DETAILS = {
  bankingName: "KARGO ONE PRIVATE LIMITED",
  bankName: "IDFC FIRST BANK",
  accountNumber: "-",
  ifsc: "-"
}

const UPI_ID = "-"

export default function BillPage() {
  const params = useParams()
  const router = useRouter()
  const year = params?.year
  const billNo = params?.billNo
  
  const [bill, setBill] = useState(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [awbDetails, setAwbDetails] = useState({})
  const [isLoadingAwbDetails, setIsLoadingAwbDetails] = useState(false)
  
  // Refs for printing/saving
  const page1Ref = useRef(null)
  const page2Ref = useRef(null)

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
  });

  // Helper to format numbers with commas
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  // Fetch bill data
  useEffect(() => {
    const fetchBill = async () => {
      if (!year || !billNo) return
      try {
        setIsLoading(true)
        const res = await fetch(`/api/billing/year/${year}/${billNo}`)
        if (!res.ok) throw new Error("Invoice not found")
        const data = await res.json()
        setBill(data)
      } catch (error) {
        console.error("Error fetching bill:", error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBill()
  }, [year, billNo])

  // Fetch AWB details for annexure from /api/[trackingNumber]
  useEffect(() => {
    const fetchAwbDetails = async () => {
      if (!bill?.awbs || bill.awbs.length === 0) return
      
      setIsLoadingAwbDetails(true)
      const details = {}
      
      const fetchPromises = bill.awbs.map(async (awb) => {
        const tracking = awb.trackingNumber
        if (!tracking) return
        
        // Check if we need to fetch (missing date or consignee)
        const existingDate = awb.awbId?.date || awb.date
        const existingConsignee = awb.awbId?.receiver?.name || awb.consigneeName
        
        if (!existingDate || !existingConsignee) {
          try {
            const res = await fetch(`/api/awb/${tracking}`)
            if (res.ok) {
              const data = await res.json()
              details[tracking] = {
                date: data[0].date,
                consigneeName: data[0].receiver?.name,
                destination: data[0].receiver?.country || data[0].receiver?.city
              }
            }
          } catch (error) {
            console.error(`Error fetching AWB ${tracking}:`, error)
          }
        }
      })
      
      await Promise.all(fetchPromises)
      setAwbDetails(details)
      setIsLoadingAwbDetails(false)
    }
    
    if (bill) {
      fetchAwbDetails()
    }
  }, [bill])

  // Download all pages as images
  const handleDownloadImage = async () => {
    try {
      const pages = [page1Ref.current, page2Ref.current].filter(Boolean)
      
      for (let i = 0; i < pages.length; i++) {
        if (!pages[i]) continue
        
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        })
        
        const link = document.createElement("a")
        link.href = canvas.toDataURL("image/png")
        link.download = `Invoice-${bill?.billNumber.replace('/', '-')}-Page${i + 1}.png`
        link.click()
        
        // Small delay between downloads
        if (i < pages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } catch (error) {
      console.error("Error generating image:", error)
    }
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="animate-spin mr-2" /> Loading...
    </div>
  )
  
  if (error || !bill) return (
    <div className="text-center p-10">Invoice Not Found</div>
  )

  const isGstBill = (bill.cgstAmount > 0 || bill.sgstAmount > 0 || bill.igstAmount > 0) && bill.invoiceType !== 'non-gst';
  const isEstimate = !isGstBill;

  // Generators for Links/QR
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${bill.billNumber}&scale=2&height=10&incltext&textxalign=center`
  
  // UPI Links (only used if not estimate)
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${COMPANY_DETAILS.name.replace(" ", "%20")}&am=${bill.total}&cu=INR`;
  const upiQrData = `upi://pay?pa=${UPI_ID}%26pn=${COMPANY_DETAILS.name.replace(" ", "%20")}%26am=${bill.total}%26cu=INR`;
  const paymentQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${upiQrData}`;

  // Helper to get AWB date (from existing data or fetched data)
  const getAwbDate = (awb) => {
    const existingDate = awb.awbId?.date || awb.date
    if (existingDate) {
      return new Date(existingDate).toLocaleDateString("en-IN")
    }
    const fetchedData = awbDetails[awb.trackingNumber]
    if (fetchedData?.date) {
      return new Date(fetchedData.date).toLocaleDateString("en-IN")
    }
    return "-"
  }

  // Helper to get consignee name (from existing data or fetched data)
  const getConsigneeName = (awb) => {
    const existingName = awb.awbId?.receiver?.name || awb.consigneeName
    if (existingName) return existingName
    
    const fetchedData = awbDetails[awb.trackingNumber]
    if (fetchedData?.consigneeName) return fetchedData.consigneeName
    
    return "-"
  }

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-8 print:bg-white print:p-0 print:block">
      
      {/* --- GLOBAL PRINT STYLES --- */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important; /* Changed from 100% to auto */
            background: white !important;
            overflow: visible !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden {
            display: none !important;
          }
          /* This class handles the page break logic */
          .a4-page {
            box-shadow: none !important;
            margin: 0 !important;
            break-after: page; 
            page-break-after: always;
            width: 210mm !important; /* Exact A4 Width */
            height: 297mm !important; /* Exact A4 Height */
            overflow: hidden !important; /* Prevent content spill */
            position: relative;
          }
          
          /* Specifically target the annexure page to stop breaking */
          .annexure-page {
             break-after: auto !important;
             page-break-after: auto !important;
             break-inside: avoid !important;
             margin-bottom: 0 !important;
          }
        }
      `}</style>

      {/* ---------------- CONTROL BAR ---------------- */}
      <div className="w-[210mm] mb-6 flex flex-col gap-4 print-hidden">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <h1 className="font-bold text-gray-700">
                {isEstimate ? "Estimate" : "Bill"} #{bill.billNumber}
              </h1>
              {isLoadingAwbDetails && (
                <span className="text-xs text-gray-500 flex items-center">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" /> Loading AWB details...
                </span>
              )}
            </div>

            <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                 <ImageIcon className="w-4 h-4 mr-2" /> Save All Pages
               </Button>
               <Button size="sm" onClick={handlePrint} className="bg-[#232C65] text-white">
                 <Printer className="w-4 h-4 mr-2" /> Print Bill
               </Button>
            </div>
        </div>
      </div>

      {/* ================= PAGE 1: INVOICE/ESTIMATE SUMMARY ================= */}
      <div 
        ref={page1Ref}
        className="a4-page shadow-2xl bg-white relative mb-8 print:mb-0"
        style={{
          width: "210mm",
          height: "297mm",
          boxSizing: "border-box",
          padding: "10mm",
          margin: "0 auto"
        }}
      >
        {/* Main Rounded Border */}
        <div className="border-2 border-orange-600 rounded-3xl h-full p-4 flex flex-col justify-between relative overflow-hidden">
          
          {/* Header Section */}
          <div>
              <div className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-1/3">
                      <img src="/logo.jpg" className="h-[100px] object-contain -mt-8 pr-2" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                  {/* Center: Barcode */}
                  <div className="w-1/3 flex flex-col items-center pt-2 -mt-4">
                      <img src={barcodeUrl} className="h-12 object-contain" alt="Barcode" />
                  </div>
                  <div className="w-1/3 text-right">
                      <h2 className="text-2xl font-bold text-[#E31E24] uppercase leading-none">
                          {isGstBill ? "TAX INVOICE" : "ESTIMATE"}
                      </h2>
                      {/* Estimate Notice */}
                      {isEstimate && (
                        <p className="text-[10px] text-orange-600 font-semibold mt-1 italic">
                          This is an Estimate Bill
                        </p>
                      )}
                      <div className="text-[10px] mt-2 space-y-1">
                          <p><b>{isEstimate ? "Estimate No:" : "Invoice No:"}</b> {bill.billNumber}</p>
                          <p><b>Date:</b> {new Date(bill.createdAt).toLocaleDateString("en-IN")}</p>
                          {isGstBill && <p><b>GSTIN:</b> {COMPANY_DETAILS.gstin}</p>}
                      </div>
                  </div>
                </div>

                <div className="border-y-2 border-orange-600 py-1 -mx-4">
                  <div className="flex justify-center items-center flex-wrap gap-x-2 text-[9px] font-bold uppercase">
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

              {/* Bill To Section */}
              <div className="flex border-b-2 border-red-600 -mx-4 -mt-2 relative">
                <div className="w-full p-2 pl-6">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Bill To</p>
                    <p className="font-bold text-orange-600 text-sm uppercase">{bill.billingInfo?.name}</p>
                    <p className="text-[10px] mt-1 leading-snug w-3/4">{bill.billingInfo?.address}</p>
                    {isGstBill && (
                      <div className="flex gap-4 mt-1 text-[10px]">
                          <p><b>GSTIN:</b> {bill.billingInfo?.gst || "N/A"}</p>
                          <p><b>State Code:</b> {bill.billingInfo?.gst ? bill.billingInfo.gst.slice(0, 2) : "27"}</p>
                      </div>
                    )}
                </div>
              </div>

              {/* Summary Table */}
              <div className="mt-4">
                <h3 className="font-bold text-xs uppercase text-[#232C65] mb-2 pl-1">
                  {isEstimate ? "Estimate Summary" : "Invoice Summary"}
                </h3>
                <table className="w-full text-[10px] border border-black border-collapse">
                  <thead>
                    <tr className="bg-orange-100">
                      <th className="border p-1.5 text-center">Total AWBs</th>
                      <th className="border p-1.5 text-center">Total Weight</th>
                      <th className="border p-1.5 text-right">{isGstBill ? "Taxable Amt" : "Amount"}</th>
                      {isGstBill && (
                          bill.igstAmount > 0 ? (
                            <th className="border p-1.5 text-right">IGST</th>
                          ) : (
                            <>
                              <th className="border p-1.5 text-right">CGST</th>
                              <th className="border p-1.5 text-right">SGST</th>
                            </>
                          )
                      )}
                      <th className="border p-1.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-3 text-center font-bold">{bill.awbs?.length || 0}</td>
                      <td className="border p-3 text-center font-bold">
                          {(bill.awbs?.reduce((sum, a) => sum + (a.weight || 0), 0) || 0).toFixed(2)} kg
                      </td>
                      <td className="border p-3 text-right">₹{formatCurrency(bill.subtotal)}</td>
                      {isGstBill && (
                          bill.igstAmount > 0 ? (
                            <td className="border p-3 text-right">₹{formatCurrency(bill.igstAmount)}</td>
                          ) : (
                            <>
                              <td className="border p-3 text-right">₹{formatCurrency(bill.cgstAmount)}</td>
                              <td className="border p-3 text-right">₹{formatCurrency(bill.sgstAmount)}</td>
                            </>
                          )
                      )}
                      <td className="border p-3 text-right font-bold text-sm">₹{formatCurrency(bill.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
          </div>

          {/* Footer Section (Notes, Bank, UPI, Total) */}
          <div className="border-t-2 border-orange-600 mt-2 -mx-4 px-2 flex">
              {/* Left Side */}
              <div className={`${isEstimate ? 'w-3/5' : 'w-4/5'} border-r border-orange-300 pr-4 pt-2 -mb-3`}>
                
                {/* Bank & UPI Row - Only show for Tax Invoice */}
                <div className="flex gap-2 items-start">
                    <div className="flex-1 text-[10px]">
                      <h4 className="font-bold text-[#232C65] border-b border-orange-300 mb-1 -mx-2 pl-2 pb-1">BANK DETAILS</h4>
                      <p>Banking Name: <b>{BANK_DETAILS.bankingName}</b></p>
                      <p>Bank Name: <b>{BANK_DETAILS.bankName}</b></p>
                      <p>A/C No: <b>{BANK_DETAILS.accountNumber}</b></p>
                      <p>IFSC: <b>{BANK_DETAILS.ifsc}</b></p>
                    </div>

                    {/* --- UPI SECTION (Only for Tax Invoice, NOT for Estimate) --- */}
                    {!isEstimate && (
                      <div className="text-center min-w-[120px] border border-orange-300 py-4 -mr-[17px] -mt-[9px] p-1 rounded-bl-lg bg-white">
                          <a href={upiLink} className="cursor-pointer block">
                              <img src={paymentQrUrl} className="w-16 h-16 p-1 mx-auto" alt="Payment QR" />
                          </a>
                          <p className="text-[8px] -mt-1 font-bold text-orange-600">{COMPANY_DETAILS.name}</p>
                          <p className="text-[8px] mt-1">{UPI_ID}</p>
                          
                          <div className="mt-1 flex justify-center">
                              <img src="https://upload.wikimedia.org/wikipedia/commons/6/65/BHIM_SVG_Logo.svg" className="h-3 object-contain" alt="BHIM" />
                              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-3 object-contain" alt="UPI" />
                          </div>

                          <p className="text-[8px] mt-1 font-bold">Scan to Pay using any UPI App</p>

                          <div className="flex justify-center gap-1.5 mt-1">
                              <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-2.5 w-auto object-contain" alt="GPay" />
                              <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" className="h-2.5 w-auto object-contain" alt="Paytm" />
                              <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" className="h-2.5 w-auto object-contain" alt="PhonePe" />
                              <img src="https://upload.wikimedia.org/wikipedia/commons/6/67/Font_Awesome_5_brands_cc-amazon-pay.svg" className="h-2.5 w-auto object-contain" alt="Amazon" />
                          </div>
                      </div>
                    )}
                </div>

                {/* Terms - Only for Tax Invoice, NOT for Estimate */}
                {!isEstimate && (
                  <div className="text-[8px] mt-2 leading-tight">
                      <h4 className="font-bold mt-1">Terms & Conditions</h4>
                      <ol className="list-decimal ml-3">
                          <li>Payment required within 15 days of invoice date.</li>
                          <li>Interest @18% p.a. will be charged on delayed payments.</li>
                          <li>Subject to {COMPANY_DETAILS.court} Jurisdiction.</li>
                          <li>This is a computer generated invoice.</li>
                      </ol>
                  </div>
                )}

                {/* Estimate Disclaimer */}
                {isEstimate && (
                  <div className="text-[9px] mt-4 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="font-bold text-orange-600">Important Notice:</p>
                      <p className="text-gray-600 mt-1">
                        This is an estimate and not a final invoice. Prices are subject to change. 
                        A final tax invoice will be generated upon confirmation and completion of services.
                      </p>
                  </div>
                )}
                
                {/* Notes */}
                <div className="mt-4">
                    <h4 className="font-bold text-[10px] mb-1">Notes:</h4>
                    <div 
                        className="border rounded-lg p-1 text-[9px] h-10 overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: bill.notes || "No additional notes." }}
                    ></div>
                </div>
              </div>

              {/* Right Side: Totals */}
              <div className={`${isEstimate ? 'w-2/5' : 'w-2/5'} pl-3 text-[10px]`}>
                  <div className="flex justify-between p-1.5 border-b">
                      <span>{isGstBill ? "Taxable Amount" : "Subtotal"}</span>
                      <span className="font-bold">₹{formatCurrency(bill.subtotal)}</span>
                  </div>
                  
                  {isGstBill && bill.igstAmount > 0 && (
                      <div className="flex justify-between p-1.5 border-b">
                          <span>IGST ({bill.igst}%)</span>
                          <span>₹{formatCurrency(bill.igstAmount)}</span>
                      </div>
                  )}
                  {isGstBill && !bill.igstAmount && (bill.cgstAmount > 0 || bill.sgstAmount > 0) && (
                      <>
                        <div className="flex justify-between p-1.5 border-b">
                            <span>CGST ({bill.cgst}%)</span>
                            <span>₹{formatCurrency(bill.cgstAmount)}</span>
                        </div>
                        <div className="flex justify-between p-1.5 border-b">
                            <span>SGST ({bill.sgst}%)</span>
                            <span>₹{formatCurrency(bill.sgstAmount)}</span>
                        </div>
                      </>
                  )}
                  
                  <div className="flex justify-between p-1.5 border-b">
                      <span>Round Off</span>
                      <span>{bill.roundOff || "0.00"}</span>
                  </div>

                  <div className="flex justify-between p-2 mt-1 text-white bg-[#232C65] text-xs font-bold -mx-3">
                      <span>{isEstimate ? "ESTIMATED TOTAL" : "GRAND TOTAL"}</span>
                      <span>₹{formatCurrency(bill.total)}/-</span>
                  </div>
                  <p className="text-[8px] italic mt-1">In Words - {toWords.convert(bill.total || 0)}</p>

                  {/* Authorized Signatory - Only for Tax Invoice, NOT for Estimate */}
                  {!isEstimate && (
                    <div className="text-center mt-8">
                        <p className="text-[8px] font-bold text-[#232C65] mb-8">For {COMPANY_DETAILS.name}</p>
                        <div className="border-t w-3/4 mx-auto pt-1">
                            <p className="text-[7px] uppercase">Authorized Signatory</p>
                        </div>
                    </div>
                  )}

                  {/* Estimate Validity */}
                  {isEstimate && (
                    <div className="text-center mt-4 text-[8px] text-gray-500">
                        <p>Estimate valid for 7 days from date of issue</p>
                    </div>
                  )}
              </div>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2: ANNEXURE ================= */}
      <div 
        ref={page2Ref}
        className="a4-page annexure-page shadow-2xl bg-white relative print:shadow-none"
        style={{
          width: "210mm",
          height: "297mm",
          boxSizing: "border-box",
          padding: "10mm",
          margin: "0 auto"
        }}
      >
        <div className="border-2 border-orange-600 rounded-3xl h-full p-4 flex flex-col relative overflow-hidden">
            
            {/* Annexure Header */}
            <div className="mb-4 pb-2 border-b border-gray-300 flex justify-between items-end">
              <div>
                  <h2 className="text-lg font-bold uppercase text-[#232C65]">Shipment Annexure</h2>
                  <p className="text-[10px] text-gray-600">
                    Attached to {isEstimate ? "Estimate" : "Invoice"} No: 
                    <span className="font-bold text-orange-600 ml-1">{bill.billNumber}</span>
                  </p>
              </div>
              <div className="text-right">
                  <p className="text-[10px] font-bold">{COMPANY_DETAILS.name}</p>
                  <p className="text-[8px] text-gray-500">Page 2 (Details)</p>
              </div>
            </div>

            {/* Loading indicator for AWB details */}
            {isLoadingAwbDetails && (
              <div className="text-center py-2 text-xs text-gray-500 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Fetching shipment details...
              </div>
            )}

            {/* Annexure Table */}
            <div className="flex-grow overflow-auto">
                <table className="w-full text-[9px] border border-black border-collapse">
                  <thead>
                      <tr className="bg-orange-100">
                        <th className="border p-1.5 text-center w-8">#</th>
                        <th className="border p-1.5 text-left">Date</th>
                        <th className="border p-1.5 text-left">AWB No</th>
                        <th className="border p-1.5 text-left">Consignee</th>
                        <th className="border p-1.5 text-left">Dest.</th>
                        <th className="border p-1.5 text-center">Weight</th>
                        <th className="border p-1.5 text-right">Rate</th>
                        <th className="border p-1.5 text-right">Amount</th>
                      </tr>
                  </thead>
                  <tbody>
                      {bill.awbs && bill.awbs.map((awb, idx) => {
                        // Use helper functions to get date and consignee
                        const date = getAwbDate(awb)
                        const consignee = getConsigneeName(awb)
                        
                        const tracking = awb.trackingNumber || "-"
                        const country = awb.country || awbDetails[awb.trackingNumber]?.destination || "-"
                        const weight = awb.weight || 0
                        const amount = awb.amount || awb.subtotal || 0
                        const ratePerKg = awb.ratePerKg || (weight > 0 ? amount / weight : 0)

                        return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="border p-1.5 text-center">{idx + 1}</td>
                              <td className="border p-1.5">{date}</td>
                              <td className="border p-1.5 font-mono">{tracking}</td>
                              <td className="border p-1.5 max-w-[100px] truncate" title={consignee}>{consignee}</td>
                              <td className="border p-1.5">{country}</td>
                              <td className="border p-1.5 text-center">{weight.toFixed(2)}</td>
                              <td className="border p-1.5 text-right">₹{formatCurrency(ratePerKg)}</td>
                              <td className="border p-1.5 text-right font-semibold">₹{formatCurrency(amount)}</td>
                            </tr>
                        )
                      })}
                  </tbody>
                  <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td colSpan={5} className="border p-2 text-right">TOTAL</td>
                        <td className="border p-2 text-center">
                            {(bill.awbs?.reduce((s,a)=>s+(a.weight||0),0) || 0).toFixed(2)}
                        </td>
                        <td className="border p-2"></td>
                        <td className="border p-2 text-right">
                            ₹{formatCurrency(bill.subtotal)}
                        </td>
                      </tr>
                  </tfoot>
                </table>
            </div>

            {/* Page 2 Footer */}
            <div className="mt-4 pt-2 border-t border-gray-200 text-[8px] text-gray-500 text-center">
              {isEstimate && (
                <p className="text-orange-600 font-semibold mb-1">
                  This is an Estimate - Final amounts may vary
                </p>
              )}
              <p>This annexure is an integral part of {isEstimate ? "Estimate" : "Invoice"} #{bill.billNumber}</p>
            </div>
        </div>
      </div>

      <div className="mt-4 text-center text-[10px] text-gray-500 print-hidden">
          © {new Date().getFullYear()} Kargo One. All rights reserved. Designed & Developed by <a href="https://exprova.com" target="_blank" rel="noreferrer" className="underline">Exprova.com</a>
      </div>

    </div>
  )
}