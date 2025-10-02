"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RatesPage() {
  const { code } = useParams();
  const [rates, setRates] = useState([]);

  useEffect(() => {
    fetch(`/api/franchises/${code}/rates`)
      .then((res) => res.json())
      .then(setRates);
  }, [code]);

  const downloadExcel = (data, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rates");
    XLSX.writeFile(wb, fileName);
  };

  const downloadPDF = (data, fileName) => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Country", "Rate"]],
      body: data.map((r) => [r.country, r.rate]),
    });
    doc.save(fileName);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Rates for Franchise {code}</h1>
      {rates.map((sheet, idx) => (
        <div key={idx} className="mb-8 border p-4 rounded-md shadow">
          <h2 className="font-semibold mb-2">
            {sheet.fileName} (Updated:{" "}
            {new Date(sheet.uploadedAt).toLocaleDateString("en-IN")})
          </h2>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">Country</th>
                <th className="border px-3 py-2">Rate</th>
              </tr>
            </thead>
            <tbody>
              {sheet.data.map((row, i) => (
                <tr key={i}>
                  <td className="border px-3 py-2">{row.country}</td>
                  <td className="border px-3 py-2">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() =>
                downloadExcel(sheet.data, `${code}-rates-${idx + 1}.xlsx`)
              }
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Download Excel
            </button>
            <button
              onClick={() => downloadPDF(sheet.data, `${code}-rates-${idx + 1}.pdf`)}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Download PDF
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
