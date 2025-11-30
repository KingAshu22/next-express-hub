"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { ToWords } from "to-words"
import { Loader2, AlertCircle } from "lucide-react"

export default function BillPage() {
  const params = useParams()
  const year = params?.year
  const billNo = params?.billNo
  
  const [bill, setBill] = useState(null)
  const [error, setError] = useState("")
  const invoiceRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)

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

  // Helper to format numbers with commas (Indian Format)
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  useEffect(() => {
    const fetchBill = async () => {
      if (!year || !billNo) return

      try {
        setIsLoading(true)
        const res = await fetch(`/api/billing/year/${year}/${billNo}`)
        
        if (!res.ok) {
          if (res.status === 404) throw new Error("Invoice not found")
          throw new Error("Failed to fetch invoice")
        }
        
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

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return
    try {
      const element = invoiceRef.current
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollY: -window.scrollY,
      })

      const imgData = canvas.toDataURL("image/png")
      
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      let heightLeft = imgHeight
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`${bill?.billNumber.replace('/', '-') || "invoice"}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF")
    }
  }

  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      })
      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `${bill?.billNumber.replace('/', '-') || "invoice"}.png`
      link.click()
    } catch (error) {
      console.error("Error generating image:", error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 text-lg">Loading invoice details...</p>
      </div>
    )
  }

  if (error || !bill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || "Invoice not found"}</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Logic to determine if it's a GST bill
  const isGstBill = (bill.cgstAmount > 0 || bill.sgstAmount > 0 || bill.igstAmount > 0) && bill.invoiceType !== 'non-gst';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Action Bar */}
      <div className="print:hidden sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 justify-between items-center">
          <h1 className="font-bold text-gray-700 dark:text-gray-200 hidden sm:block">
            Bill #{bill.billNumber}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition flex items-center gap-2"
            >
              Print
            </button>
            <button
              onClick={handleDownloadImage}
              className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium transition hidden sm:block"
            >
              Save Image
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="py-8 px-4 print:p-0 print:m-0">
        <div 
          ref={invoiceRef} 
          className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full print:max-w-none min-h-[297mm]"
        >
          {/* Page 1 */}
          <div data-page="1" className="p-8 relative flex flex-col min-h-[297mm]">
            
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div className="w-1/2">
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                    Kargo One
                  </h1>
                  <div className="text-xs text-gray-600 mt-2 space-y-1">
                    <p className="leading-relaxed">Shop no 10, Ground floor Prakashwadi CHS Beside Summit Business park, Gundavali, Andheri East, Mumbai, Maharashtra 400093</p>
                    <p>Email: info@kargoone.com</p>
                    {isGstBill && (
                      <p>GST No.: - | PAN No.: -</p>
                    )}
                  </div>
                </div>
                <div className="text-right w-1/2">
                  <h2 className="text-xl font-bold text-gray-900 border-2 border-gray-900 inline-block px-4 py-1 mb-2">
                    {isGstBill ? "TAX INVOICE" : "ESTIMATE"}
                  </h2>
                </div>
              </div>
            </div>

            {/* Bill To / Details */}
            <div className="flex gap-4 mb-6">
              <div className="w-1/2 border border-gray-300 rounded p-4 bg-gray-50">
                <h3 className="font-bold text-xs text-gray-500 uppercase mb-2">Bill To</h3>
                <p className="font-bold text-sm text-gray-900">{bill.billingInfo?.name}</p>
                <p className="text-xs text-gray-700 whitespace-pre-line mt-1">{bill.billingInfo?.address}</p>
                {isGstBill && (
                   <div className="mt-3 text-xs space-y-1">
                    <p><span className="font-semibold">GST No.:</span> {bill.billingInfo?.gst || "N/A"}</p>
                  </div>
                )}
              </div>
              <div className="w-1/2 border border-gray-300 rounded p-0 overflow-hidden">
                <div className="grid grid-cols-2 text-xs h-full">
                  <div className="p-2 border-b border-r border-gray-300 bg-gray-50 font-semibold">Invoice No.</div>
                  <div className="p-2 border-b border-gray-300 font-bold">{bill.billNumber}</div>
                  
                  <div className="p-2 border-b border-r border-gray-300 bg-gray-50 font-semibold">Invoice Date</div>
                  <div className="p-2 border-b border-gray-300">{new Date(bill.createdAt).toLocaleDateString("en-IN")}</div>
                  
                  {isGstBill && (
                    <>
                      <div className="p-2 border-b border-r border-gray-300 bg-gray-50 font-semibold">State Code</div>
                      <div className="p-2 border-b border-gray-300">{bill.billingInfo?.gst ? bill.billingInfo.gst.slice(0, 2) : "27"}</div>
                    </>
                  )}
                  
                  <div className={`p-2 border-r border-gray-300 bg-gray-50 font-semibold ${!isGstBill ? 'border-b' : ''}`}>Place of Supply</div>
                  <div className={`p-2 ${!isGstBill ? 'border-b border-gray-300' : ''}`}>Mumbai</div>

                  {!isGstBill && (
                     <>
                       <div className="p-2 border-r border-gray-300 bg-gray-50 font-semibold">Mode</div>
                       <div className="p-2">Air</div>
                     </>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Summary Table */}
            <div className="mb-6">
              <h3 className="font-bold text-xs uppercase bg-gray-200 p-2 border-t border-l border-r border-gray-300">
                Invoice Summary
              </h3>
              <table className="w-full text-xs border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Total AWBs</th>
                    <th className="border border-gray-300 p-2 text-right">Total Weight</th>
                    <th className="border border-gray-300 p-2 text-right">
                      {isGstBill ? "Taxable Amt" : "Amount"}
                    </th>
                    
                    {isGstBill && (
                      bill.igstAmount > 0 ? (
                        <th className="border border-gray-300 p-2 text-right">IGST</th>
                      ) : (
                        <>
                          <th className="border border-gray-300 p-2 text-right">CGST</th>
                          <th className="border border-gray-300 p-2 text-right">SGST</th>
                        </>
                      )
                    )}
                    
                    <th className="border border-gray-300 p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3 text-left">{bill.awbs?.length || 0}</td>
                    <td className="border border-gray-300 p-3 text-right">
                      {(bill.awbs?.reduce((sum, a) => sum + (a.weight || 0), 0) || 0).toFixed(2)} kg
                    </td>
                    <td className="border border-gray-300 p-3 text-right">₹{formatCurrency(bill.subtotal)}</td>
                    
                    {isGstBill && (
                      bill.igstAmount > 0 ? (
                        <td className="border border-gray-300 p-3 text-right">₹{formatCurrency(bill.igstAmount)}</td>
                      ) : (
                        <>
                           <td className="border border-gray-300 p-3 text-right">₹{formatCurrency(bill.cgstAmount)}</td>
                           <td className="border border-gray-300 p-3 text-right">₹{formatCurrency(bill.sgstAmount)}</td>
                        </>
                      )
                    )}
                    
                    <td className="border border-gray-300 p-3 text-right font-bold">₹{formatCurrency(bill.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount in Words */}
            <div className="mb-6 p-3 bg-gray-50 border border-gray-300 rounded">
              <p className="text-xs">
                <span className="font-bold">Amount in Words:</span> {toWords.convert(bill.total || 0)} Only
              </p>
            </div>

            {/* Bottom Section: Bank & Tax */}
            <div className="flex gap-6 mb-8">
              <div className="w-1/2">
                <h3 className="font-bold text-xs uppercase bg-gray-200 p-2 border border-gray-300">
                  Bank Details
                </h3>
                <table className="w-full text-xs border border-gray-300 border-t-0">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="font-semibold py-2 px-3 w-1/3">Bank Name</td>
                      <td className="py-2 px-3">IDFC FIRST BANK</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="font-semibold py-2 px-3">A/C Name</td>
                      <td className="py-2 px-3">Kargo One</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="font-semibold py-2 px-3">A/C No.</td>
                      <td className="py-2 px-3 font-mono font-bold">-</td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-2 px-3">IFSC Code</td>
                      <td className="py-2 px-3 font-mono font-bold">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="w-1/2">
                <h3 className="font-bold text-xs uppercase bg-gray-200 p-2 border border-gray-300">
                  Total Calculation
                </h3>
                <table className="w-full text-xs border border-gray-300 border-t-0">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="p-2 w-1/2">{isGstBill ? "Taxable Amount" : "Subtotal"}</td>
                      <td className="p-2 text-right font-semibold">₹{formatCurrency(bill.subtotal)}</td>
                    </tr>
                    
                    {isGstBill && bill.igstAmount > 0 && (
                      <tr className="border-b border-gray-300">
                         <td className="p-2">IGST ({bill.igst}%)</td>
                         <td className="p-2 text-right">₹{formatCurrency(bill.igstAmount)}</td>
                      </tr>
                    )}

                    {isGstBill && !bill.igstAmount && (bill.cgstAmount > 0 || bill.sgstAmount > 0) && (
                      <>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">CGST ({bill.cgst}%)</td>
                          <td className="p-2 text-right">₹{formatCurrency(bill.cgstAmount)}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">SGST ({bill.sgst}%)</td>
                          <td className="p-2 text-right">₹{formatCurrency(bill.sgstAmount)}</td>
                        </tr>
                      </>
                    )}

                    <tr className="bg-gray-100">
                      <td className="p-2 font-bold text-sm">Grand Total</td>
                      <td className="p-2 text-right font-bold text-sm">₹{formatCurrency(bill.total)}</td>
                    </tr>
                    <tr className="border-t border-gray-300">
                      <td className="p-2">Round Off</td>
                      <td className="p-2 text-right">{bill.roundOff || "-0.00"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer / Terms */}
            <div className="mt-auto">
               <div className="flex gap-4 items-end">
                 <div className="w-2/3 text-[10px] text-gray-600 space-y-1">
                    <h4 className="font-bold text-gray-800 uppercase mb-1">Terms & Conditions</h4>
                    <p>1. Payment required within 15 days of invoice date.</p>
                    <p>2. Interest @18% p.a. will be charged on delayed payments.</p>
                    <p>3. Subject to Mumbai Jurisdiction.</p>
                    <p>4. This is a computer generated invoice.</p>
                 </div>
                 <div className="w-1/3 text-center">
                    <p className="text-xs font-bold mb-8">For Kargo One.</p>
                    <div className="border-t border-gray-400 pt-1">
                      <p className="text-[10px] text-gray-500">Authorized Signatory</p>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Page 2: Annexure */}
          <div data-page="2" className="p-8 relative flex flex-col min-h-[297mm] page-break-before">
             <div className="mb-6 pb-4 border-b border-gray-300 flex justify-between items-end">
               <div>
                  <h2 className="text-lg font-bold uppercase">Shipment Annexure</h2>
                  <p className="text-xs text-gray-600">Attached to Invoice No: <span className="font-semibold">{bill.billNumber}</span></p>
               </div>
               <p className="text-xs text-gray-500">Page 2</p>
             </div>

             <div className="flex-grow">
                <table className="w-full text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200 text-gray-700">
                      <th className="border border-gray-300 p-2 text-center w-10">#</th>
                      <th className="border border-gray-300 p-2 text-left">Date</th>
                      <th className="border border-gray-300 p-2 text-left">AWB / Tracking</th>
                      <th className="border border-gray-300 p-2 text-left">Consignee</th>
                      <th className="border border-gray-300 p-2 text-left">Destination</th>
                      <th className="border border-gray-300 p-2 text-right">Weight</th>
                      <th className="border border-gray-300 p-2 text-right">Rate/Kg</th>
                      <th className="border border-gray-300 p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.awbs && bill.awbs.map((awb, idx) => {
                      // Safe access to populated fields
                      const date = awb.awbId?.date 
                        ? new Date(awb.awbId.date).toLocaleDateString("en-IN") 
                        : (awb.date ? new Date(awb.date).toLocaleDateString("en-IN") : "-");
                        
                      const consignee = awb.awbId?.receiver?.name 
                        || awb.consigneeName 
                        || "-";

                      const tracking = awb.trackingNumber || "-";
                      const country = awb.country || "-";
                      const weight = awb.weight || 0;
                      const amount = awb.amount || awb.subtotal || 0;
                      const ratePerKg = awb.ratePerKg || (weight > 0 ? amount / weight : 0);

                      return (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="border-r border-gray-300 p-2 text-center">{idx + 1}</td>
                          <td className="border-r border-gray-300 p-2 whitespace-nowrap">
                            {date}
                          </td>
                          <td className="border-r border-gray-300 p-2 font-mono">{tracking}</td>
                          <td className="border-r border-gray-300 p-2 max-w-[150px] truncate" title={consignee}>
                            {consignee}
                          </td>
                          <td className="border-r border-gray-300 p-2">{country}</td>
                          <td className="border-r border-gray-300 p-2 text-right">{weight.toFixed(2)}</td>
                          <td className="border-r border-gray-300 p-2 text-right text-gray-600">
                            ₹{formatCurrency(ratePerKg)}
                          </td>
                          <td className="p-2 text-right font-semibold">₹{formatCurrency(amount)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={5} className="border border-gray-300 p-2 text-right">Total</td>
                      <td className="border border-gray-300 p-2 text-right">
                        {(bill.awbs?.reduce((s,a)=>s+(a.weight||0),0) || 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 p-2"></td>
                      <td className="border border-gray-300 p-2 text-right">
                        ₹{formatCurrency(bill.subtotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
             </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white;
          }
          .page-break-before {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  )
}