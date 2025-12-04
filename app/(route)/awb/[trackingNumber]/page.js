"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft, Mail, Phone, Globe, MapPin } from "lucide-react"
import axios from "axios"
import { format } from "date-fns"
import { ToWords } from "to-words"

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
    bankingName: "-",
    bankName: "-",
    accountNumber: "-",
    ifsc: "-"
}

const UPI_ID = "9898100733@okbizaxis"

export default function InvoicePage({ params }) {

    const router = useRouter()
    const { trackingNumber } = use(params)
    const [awb, setAwb] = useState(null)
    const [loading, setLoading] = useState(true)

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

    useEffect(() => {
        const fetchAwb = async () => {
            try {
                const res = await axios.get(`/api/awb/${trackingNumber}`)
                const data = Array.isArray(res.data) ? res.data[0] : res.data
                setAwb(data)
            } catch (error) {
                console.error("Error fetching invoice", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAwb()
    }, [trackingNumber])

    if (loading) return <div className="flex justify-center items-center h-screen">Loading Invoice...</div>
    if (!awb) return <div className="text-center p-10">Invoice Not Found</div>

    const financials = awb.financials?.sales || {
        weight: { chargeable: 0 },
        rates: { ratePerKg: 0, baseTotal: 0 },
        charges: { otherCharges: [], awbCharge: 0, fuelAmount: 0, gstAmount: 0 },
        grandTotal: 0
    }

    // --- LOGIC: CHECK IF ESTIMATE ---
    // If total tax is 0, treat as Estimate
    const isEstimate = Number(financials.charges.gstAmount) === 0

    const payments = awb.financials?.payments || []
    const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0)
    const balanceDue = financials.grandTotal - totalPaid
    const notes = awb.financials?.notes || ""

    const ratePerKg = Number(financials.rates.ratePerKg) || 0

    const boxRows = (awb.boxes || []).map(box => {
        const chargeable = Number(box.chargeableWeight) || 0
        return { ...box, rowAmount: chargeable * ratePerKg }
    })

    const totalFreightAmount = boxRows.reduce((sum, box) => sum + box.rowAmount, 0)

    // --- GENERATORS ---
    const paymentQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${UPI_ID}%26pn=${COMPANY_DETAILS.name.replace(" ", "%20")}%26am=${financials.grandTotal}%26cu=INR`
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${awb.trackingNumber}&scale=2&height=10&incltext&textxalign=center`
    const trackingQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://kargoone.com/track/${awb.trackingNumber}`

    const formatCurrency = (amt) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amt || 0)


    return (
        <div className="bg-gray-100 p-0 m-0 flex justify-center print:bg-white">

            {/* Global fixes for print */}
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
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .a4-page {
                      page-break-after: avoid !important;
                      page-break-before: avoid !important;
                      page-break-inside: avoid !important;
                    }
                }
            `}</style>

            {/* Print Controls */}
            <div className="fixed top-4 right-4 z-50 flex gap-2 print:hidden">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => window.print()} className="bg-[#232C65] hover:bg-[#1a214d] text-white">
                    <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
            </div>

            {/* A4 CONTAINER */}
            <div
                className="a4-page shadow-xl print:shadow-none bg-white"
                style={{
                    width: "210mm",
                    height: "297mm",
                    boxSizing: "border-box",
                    padding: "12mm",
                    margin: "0 auto"
                }}
            >


                {/* ---------------- HEADER ---------------- */}
                <div className="pb-2">
                    <div className="flex justify-between items-start mb-2">

                        {/* Logo */}
                        <div className="w-1/3">
                            <img src="/logo.jpg"
                                className="h-[100px] object-contain"
                                onError={(e) => e.target.style.display = 'none'} />
                        </div>

                        {/* Center: Barcode ONLY */}
                        <div className="w-1/3 flex flex-col items-center pt-2">
                            <img src={barcodeUrl} className="h-12 object-contain" alt="Barcode" />
                            <div className="mt-2 text-xs font-bold text-[#232C65] uppercase flex items-center gap-2">
                                <span>{awb.sender?.country}</span>
                                <span className="text-[#E31E24] text-lg leading-none">→</span>
                                <span>{awb.receiver?.country}</span>
                            </div>
                        </div>

                        {/* Right Details */}
                        <div className="w-1/3 text-right">
                            {/* ✅ CONDITIONAL TITLE */}
                            <h2 className="text-2xl font-bold text-[#E31E24] uppercase leading-none">
                                {isEstimate ? "ESTIMATE" : "TAX INVOICE"}
                            </h2>
                            <div className="text-[10px] mt-2 space-y-1">
                                <p><b>Date:</b> {format(new Date(awb.date), "dd MMM yyyy")}</p>
                                <p><b>AWB #:</b> {awb.trackingNumber}</p>
                                {/* ✅ HIDE GSTIN IF ESTIMATE */}
                                {!isEstimate && <p><b>GSTIN:</b> {COMPANY_DETAILS.gstin}</p>}
                            </div>
                        </div>

                    </div>

                    {/* Contact Strip */}
                    <div className="border-y-2 border-orange-600 py-1">
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


                {/* ---------------- SHIPPER / CONSIGNEE + TRACKING QR ---------------- */}
                <div className="flex border-b-2 border-red-600 relative">

                    {/* Shipper (Left) */}
                    <div className="w-1/2 p-2 border-r border-gray-300 pr-16">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Shipper (From)</p>
                        <p className="font-bold text-orange-600 text-sm uppercase">{awb.sender?.name}</p>
                        <p className="text-[10px] mt-1 leading-snug">{awb.sender?.address}, {awb.sender?.city}, {awb.sender?.state}, {awb.sender?.country}</p>
                        <div className="flex gap-3 mt-1 text-[10px]"><p><b>ZIP:</b> {awb.sender?.zip}</p><p><b>Ph:</b> {awb.sender?.contact}</p></div>
                    </div>

                    {/* Consignee (Right) */}
                    <div className="w-1/2 p-2 pl-16 text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Consignee (To)</p>
                        <p className="font-bold text-orange-600 text-sm uppercase">{awb.receiver?.name}</p>
                        <p className="text-[10px] mt-1 leading-snug">{awb.receiver?.address}, {awb.receiver?.city}, {awb.receiver?.state}, {awb.receiver?.country}</p>
                        <div className="flex gap-3 mt-1 text-[10px] justify-end"><p><b>ZIP:</b> {awb.receiver?.zip}</p><p><b>Ph:</b> {awb.receiver?.contact}</p></div>
                    </div>

                    {/* TRACKING QR (Center Absolute) */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 border border-gray-300 flex flex-col items-center shadow-sm">
                        <img src={trackingQrUrl} className="h-14 w-14 object-contain" alt="Track QR" />
                        <p className="text-[6px] font-bold uppercase mt-0.5 text-[#232C65]">Scan to Track</p>
                    </div>

                </div>


                {/* ---------------- TABLE ---------------- */}
                <div className="flex flex-grow py-2">
                    <table className="w-full text-[10px] border border-black border-collapse">
                        <thead>
                            <tr className="bg-orange-100">
                                <th className="border p-1.5">#</th>
                                <th className="border p-1.5 text-left">Service</th>
                                <th className="border p-1.5 text-center">Dims</th>
                                <th className="border p-1.5">Act Wt</th>
                                <th className="border p-1.5">Vol Wt</th>
                                <th className="border p-1.5">Chg Wt</th>
                                <th className="border p-1.5 text-right">Rate</th>
                                <th className="border p-1.5 text-right">Amount</th>
                            </tr>
                        </thead>

                        <tbody>
                            {boxRows.map((box, i) => (
                                <tr key={i}>
                                    <td className="border p-1 text-center">{i + 1}</td>
                                    <td className="border p-1">{awb?.financials?.sales?.serviceType}</td>
                                    <td className="border p-1 text-center">{box.length}x{box.breadth}x{box.height}</td>
                                    <td className="border p-1 text-center">{Number(box.actualWeight).toFixed(2)} KG</td>
                                    <td className="border p-1 text-center">{Number(box.dimensionalWeight).toFixed(2)} KG</td>
                                    <td className="border p-1 text-center">{Number(box.chargeableWeight).toFixed(2)} KG</td>
                                    <td className="border p-1 text-right">{formatCurrency(ratePerKg)}</td>
                                    <td className="border p-1 text-right">{formatCurrency(box.rowAmount)}</td>
                                </tr>
                            ))}
                        </tbody>

                        <tfoot className="font-bold bg-gray-50">
                            <tr>
                                <td colSpan={3} className="border p-1.5 text-right">TOTAL</td>
                                <td className="border p-1.5 text-center">{awb.boxes?.reduce((a, b) => a + Number(b.actualWeight), 0).toFixed(2)} KG</td>
                                <td className="border p-1.5 text-center">{awb.boxes?.reduce((a, b) => a + Number(b.dimensionalWeight), 0).toFixed(2)} KG</td>
                                <td className="border p-1.5 text-center">{Number(financials.weight.chargeable).toFixed(2)} KG</td>
                                <td className="border p-1.5"></td>
                                <td className="border p-1.5 text-right">{formatCurrency(totalFreightAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>


                {/* ---------------- FOOTER ---------------- */}
                <div className="border-t-2 border-orange-600 mt-2 flex">

                    {/* Left */}
                    <div className="w-4/5 pr-4 pt-2 border-r border-gray-300">
                        <div className="flex gap-2">
                            <div className="flex-1 text-[10px]">
                                <h4 className="font-bold text-[#232C65] border-b mb-1">BANK DETAILS</h4>
                                <p>Banking Name: <b>{BANK_DETAILS.bankingName}</b></p>
                                <p>Bank Name: <b>{BANK_DETAILS.bankName}</b></p>
                                <p>A/C No: <b>{BANK_DETAILS.accountNumber}</b></p>
                                <p>IFSC: <b>{BANK_DETAILS.ifsc}</b></p>
                            </div>

                            <div className="text-center">
                                <img src={paymentQrUrl} className="w-20 h-20 border p-1 mx-auto" alt="Payment QR" />
                                <p className="text-[8px] mt-1">Scan to Pay</p>
                            </div>
                        </div>

                        <div className="text-[8px] mt-2 leading-tight">
                            {/* ✅ ESTIMATE NOTICE */}
                            {isEstimate && (
                                <p className="font-bold text-red-600 uppercase mb-1 text-[9px] border border-red-500 p-1 inline-block">
                                    *** This is an Estimate Bill ***
                                </p>
                            )}
                            
                            <h4 className="font-bold mt-1">Terms & Conditions</h4>
                            <ol className="list-decimal ml-3">
                                <li>Any Extra Charges (Remote, Pickup, etc) are charged extra.</li>
                                <li>Maximum claim: Rs. 100/kg or Rs. 5,000.</li>
                                <li>No responsibility for delays due to airlines, customs, weather, etc.</li>
                                <li>No claim accepted after 48 hrs.</li>
                                <li>Incorrect declaration responsibility of consignor.</li>
                                <li>Court jurisdiction: {COMPANY_DETAILS.court}.</li>
                                <li>Shipment complies with P&T + IATA regulations.</li>
                                <li>No committed delivery time for economy services.</li>
                                <li>Not responsible for duties/penalties at destination country.</li>
                            </ol>
                        </div>
                        
                        {/* Notes Section */}
                        <div className="mt-4">
                            <h4 className="font-bold text-[10px] mb-1">Notes:</h4>
                            <div 
                                className="border p-1 text-[9px] h-16 overflow-hidden"
                                dangerouslySetInnerHTML={{ __html: notes}}
                            ></div>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="w-2/5 pl-3 text-[10px]">

                        <div className="flex justify-between p-1.5 border-b">
                            <span>Freight Total</span>
                            <span className="font-bold">{formatCurrency(totalFreightAmount)}</span>
                        </div>

                        {financials.charges.otherCharges.map((c, i) => (
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
                            <span>{formatCurrency(Number(financials.grandTotal) - Number(financials.charges.gstAmount))}</span>
                        </div>

                        {/* ✅ HIDE TAX BREAKDOWN IF ESTIMATE */}
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

                        {/* --- PAYMENTS RECEIVED SECTION --- */}
                        {payments.length > 0 && (
                            <div className="bg-green-50 border-y border-green-200 my-1">
                                {payments.map((p, idx) => (
                                    <div key={idx} className="flex justify-between p-1 px-2 text-[9px] text-green-700">
                                        <span>Paid ({format(new Date(p.date), "dd/MM")})</span>
                                        <span>-{formatCurrency(p.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* --- BALANCE DUE --- */}
                        {balanceDue > 0 ? (
                            <div className="flex justify-between p-1.5 font-bold text-red-600 bg-red-50 border-t border-red-200">
                                <span>BALANCE DUE</span>
                                <span>{formatCurrency(balanceDue)}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between p-1.5 font-bold text-green-600 bg-green-50 border-t border-green-200">
                                <span>PAYMENT STATUS</span>
                                <span>PAID</span>
                            </div>
                        )}

                        <div className="flex justify-between p-2 mt-1 text-white bg-[#232C65] text-xs font-bold">
                            <span>GRAND TOTAL</span>
                            <span>{formatCurrency(financials.grandTotal)}/-</span>
                        </div>
                        <p className="text-[8px] italic mt-1">In Words - {toWords.convert(financials.grandTotal)}</p>

                        <div className="text-center mt-4">
                            <p className="text-[8px] font-bold text-[#232C65] mb-8">For {COMPANY_DETAILS.name}</p>
                            <div className="border-t w-3/4 mx-auto pt-1">
                                <p className="text-[7px] uppercase">Authorized Signatory</p>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    )
}