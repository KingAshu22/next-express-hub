'use client';

import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRouter, useParams } from 'next/navigation';

export default function ViewEstimate() {
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { code } = useParams();
  const printRef = useRef(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      const res = await fetch(`/api/estimate/${code}`);
      const data = await res.json();
      if (res.ok) {
        setEstimate(data);
      } else {
        alert('Estimate not found');
        router.push('/estimate');
      }
      setLoading(false);
    };
    fetchEstimate();
  }, [code, router]);

  const exportAsImage = () => {
    if (!printRef.current) return;
    html2canvas(printRef.current).then((canvas) => {
      const link = document.createElement('a');
      link.download = `estimate-${code}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  const exportAsPDF = () => {
    if (!printRef.current) return;
    html2canvas(printRef.current).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`estimate-${code}.pdf`);
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <p className="text-lg">Loading Estimate...</p>
    </div>
  );

  if (!estimate) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gray-50 min-h-screen">
      {/* Action Buttons */}
      <div className="flex justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Estimate #{estimate?.code}</h1>
        <div className="space-x-3">
          <button
            onClick={exportAsPDF}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Save as PDF
          </button>
          <button
            onClick={exportAsImage}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Save as Image
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div
        ref={printRef}
        className="bg-white p-8 border shadow-lg rounded-lg space-y-6"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Letterhead */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-blue-900">SunEx Services</h2>
          <p className="text-lg text-gray-700 mt-1">International Courier & Cargo Services</p>
          <p className="text-sm text-gray-600 mt-3">
            📞 +91 81691 55537 | ✉️ sunexcourierandcargo@gmail.com | 🌐 www.sunexservices.com
          </p>
          <p className="text-xs text-gray-600 mt-1 whitespace-nowrap">
            Shop no 10, Ground floor Prakashwadi CHS Beside Summit Business park, Gundavali, Andheri East, Mumbai 400 093
          </p>
          <hr className="border-t-2 border-gray-300 my-4" />
        </div>

        {/* Title */}
        <h3 className='text-center font-bold text-[#F44336] text-xl'>ESTIMATE</h3>

        {/* Estimate Info */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          {/* Sender */}
          <div>
            <strong>Estimate To:</strong>
            <div className="mt-1 font-bold">{estimate.name}</div>
            <div>{estimate.address}</div>
            <div>{estimate.city} - {estimate.zipCode}</div>
            <div>{estimate.country}</div>
          </div>
          {/* Estimate Details */}
          <div className="text-right">
            <div><strong>Estimate #:</strong> {estimate.code}</div>
            <div><strong>Date:</strong> {new Date(estimate.date).toLocaleDateString()}</div>
            <div><strong>Receiver Country:</strong> {estimate.receiverCountry}</div>
            {estimate?.awbNumber && <div><strong>AWB Number:</strong> {estimate.awbNumber || 'N/A'}</div>}
            {estimate?.forwardingNumber && <div><strong>Forwarding Number:</strong> {estimate.forwardingNumber || 'N/A'}</div>}
            {estimate?.forwardingLink && <div><strong>Forwarding Link:</strong> {estimate.forwardingLink ? <a href={estimate.forwardingLink} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Track Here</a> : 'N/A'}</div>}
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-hidden">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Weight (kg)</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Rate (₹/kg)</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3 text-xs">
                  Shipping Service to {estimate?.receiverCity}, {estimate.receiverCountry}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">{estimate.weight.toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-3 text-right">₹{estimate.rate.toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-3 text-right">₹{estimate.subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot>
              {estimate?.discount > 0 && 
              <tr>
                <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right font-bold">Subtotal</td>
                <td className="border border-gray-300 px-4 py-2 text-right">₹{estimate.subtotal.toFixed(2)}</td>
              </tr>
              }
              {estimate?.discount > 0 &&
              <tr>
                <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right font-bold">Discount</td>
                <td className="border border-gray-300 px-4 py-2 text-right">- ₹{estimate.discount?.toFixed(2) || "0.00"}</td>
              </tr>
              }
              <tr className="bg-blue-50">
                <td colSpan={3} className="border border-gray-300 px-4 py-3 text-right font-bold text-lg">TOTAL</td>
                <td className="border border-gray-300 px-4 py-3 text-right font-bold text-lg">₹{estimate.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-sm text-gray-600">
          <p><strong>Notes:</strong> This is a computer-generated estimate. No signature required.</p>
          <p className="mt-1 text-center">Thank you for choosing SunEx Services!</p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex space-x-4 justify-center">
        <button
          onClick={() => router.push(`/edit-estimate/${code}`)}
          className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
        >
          Edit Estimate
        </button>
        <button
          onClick={() => router.push('/estimate')}
          className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          Back to List
        </button>
      </div>
    </div>
  );
}
