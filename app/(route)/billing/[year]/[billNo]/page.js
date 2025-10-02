"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function BillPage() {
  const { year, billNo } = useParams();
  const [bill, setBill] = useState(null);
  const invoiceRef = useRef(null);

  useEffect(() => {
    const fetchBill = async () => {
      const res = await fetch(`/api/billing/${year}/${billNo}`);
      if (res.ok) {
        const data = await res.json();
        setBill(data);
      }
    };
    fetchBill();
  }, [year, billNo]);

  if (!bill) {
    return <p className="p-8 text-center text-gray-500">Loading invoice...</p>;
  }

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Download as Image
  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = `${bill.billNumber}.png`;
    link.click();
  };

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;
    const x = (pdfWidth - imgWidth) / 2;
    pdf.addImage(imgData, "PNG", x, 10, imgWidth, imgHeight);
    pdf.save(`${bill.billNumber}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Invoice Actions */}
      <div className="flex justify-end mb-4 space-x-3 print:hidden">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Print
        </button>
        <button
          onClick={handleDownloadImage}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Download Image
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Download PDF
        </button>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="bg-white shadow-md p-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-purple-700">
              SunEx Services Pvt Ltd.
            </h1>
            <p>Andheri East, Mumbai 400 093</p>
            <p className="text-gray-600">GSTIN: 27ABPCS6262F1ZX</p>
            <p className="text-gray-600">PAN: ABPCS6262F</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">TAX INVOICE</h2>
            <p>Original for Recipient</p>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-3 gap-6 my-6 text-sm text-center bg-gray-100 p-4 rounded-md">
            <p>
              <strong>Invoice No:</strong> {bill.billNumber}
            </p>
            <p>
              <strong>Invoice Date:</strong>{" "}
              {new Date(bill.createdAt).toLocaleDateString("en-IN")}
            </p>
            <p>
              <strong>Due Date:</strong>{" "}
              {new Date(bill.createdAt).toLocaleDateString("en-IN")}
            </p>
        </div>

        {/* Billing & Shipping */}
        <div className="grid grid-cols-2 gap-6 border-b pb-6 mb-6 text-sm">
          <div>
            <h3 className="font-bold">BILL TO</h3>
            <p>{bill.billingInfo.name}</p>
            <p>{bill.billingInfo.address}</p>
            <p>GST: {bill.billingInfo.gst || "-"}</p>
          </div>
          {/* <div>
            <h3 className="font-bold">SHIP TO</h3>
            <p>{bill.billingInfo.name}</p>
            <p>{bill.billingInfo.address}</p>
            <p>GST: {bill.billingInfo.gst || "-"}</p>
          </div> */}
        </div>

        {/* Items Table */}
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-3 py-2">AWB No.</th>
              <th className="border px-3 py-2">Tracking No.</th>
              <th className="border px-3 py-2">Country</th>
              <th className="border px-3 py-2">Weight (kg)</th>
              <th className="border px-3 py-2">Rate/kg</th>
              <th className="border px-3 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.awbs.map((a, idx) => (
              <tr key={idx}>
                <td className="border px-3 py-2">{a.awbId}</td>
                <td className="border px-3 py-2">{a.trackingNumber}</td>
                <td className="border px-3 py-2">{a.country}</td>
                <td className="border px-3 py-2">{a.weight.toFixed(2)}</td>
                <td className="border px-3 py-2">₹{a.ratePerKg.toFixed(2)}</td>
                <td className="border px-3 py-2">₹{a.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <table className="text-sm">
            <tbody>
              <tr>
                <td className="px-4 py-2">Subtotal</td>
                <td className="px-4 py-2 text-right">
                  ₹{bill.subtotal.toFixed(2)}
                </td>
              </tr>
              {bill.cgstAmount > 0 && (
                <tr>
                  <td className="px-4 py-2">CGST ({bill.cgst}%)</td>
                  <td className="px-4 py-2 text-right">
                    ₹{bill.cgstAmount.toFixed(2)}
                  </td>
                </tr>
              )}
              {bill.sgstAmount > 0 && (
                <tr>
                  <td className="px-4 py-2">SGST ({bill.sgst}%)</td>
                  <td className="px-4 py-2 text-right">
                    ₹{bill.sgstAmount.toFixed(2)}
                  </td>
                </tr>
              )}
              {bill.igstAmount > 0 && (
                <tr>
                  <td className="px-4 py-2">IGST ({bill.igst}%)</td>
                  <td className="px-4 py-2 text-right">
                    ₹{bill.igstAmount.toFixed(2)}
                  </td>
                </tr>
              )}
              <tr className="font-bold bg-gray-100">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right">
                  ₹{bill.total.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Paid</td>
                <td className="px-4 py-2 text-right">
                  ₹{bill.paid.toFixed(2)}
                </td>
              </tr>
              <tr className="font-bold">
                <td className="px-4 py-2">Balance Due</td>
                <td
                  className={`px-4 py-2 text-right ${
                    bill.balance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  ₹{bill.balance.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bank + QR */}
        <div className="grid grid-cols-2 gap-6 mt-10 text-sm">
          <div>
            <h3 className="font-bold mb-2">Bank Details</h3>
            <p>Name: Your Name</p>
            <p>Bank: HDFC Bank</p>
            <p>IFSC: HDFC0001234</p>
            <p>Account: 1234567890</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold mb-2">Payment QR</h3>
            <img
              src="/your-qr.png"
              alt="QR Code"
              className="inline-block w-32 h-32 border"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-xs text-gray-600 border-t pt-4">
          <p>1. Goods once sold will not be taken back or exchanged</p>
          <p>2. All disputes subject to local jurisdiction only</p>
        </div>
      </div>
    </div>
  );
}
