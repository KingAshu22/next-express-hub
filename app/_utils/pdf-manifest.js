import { jsPDF } from "jspdf"
import "jspdf-autotable"

export async function generateManifestPDF(awbs) {
  if (!awbs || awbs.length === 0) {
    throw new Error("No AWBs selected")
  }

  const doc = new jsPDF()
  let yPosition = 20
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 10

  // Title
  doc.setFontSize(18)
  doc.text("Shipment Manifest", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  // Date
  doc.setFontSize(10)
  const generatedDate = new Date().toLocaleDateString("en-GB")
  doc.text(`Generated on: ${generatedDate}`, margin, yPosition)
  yPosition += 10

  // Summary section
  doc.setFontSize(12)
  doc.text("Summary", margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.text(`Total Shipments: ${awbs.length}`, margin + 5, yPosition)
  yPosition += 10

  // Table data
  const tableColumn = ["Date", "Tracking No", "Sender", "Receiver", "Country", "No. of Boxes", "Total Weight (kg)"]
  const tableRows = awbs.map((awb) => [
    awb.date ? new Date(awb.date).toLocaleDateString("en-GB") : "N/A",
    awb.trackingNumber || "N/A",
    awb.sender?.name?.substring(0, 15) || "N/A",
    awb.receiver?.name?.substring(0, 15) || "N/A",
    awb.receiver?.country || "N/A",
    awb.boxes?.length || "N/A",
    awb.totalWeight || "N/A",
  ])

  // Add table
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: yPosition,
    margin: margin,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 44, 101],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  })

  // Footer
  const finalYPosition = doc.internal.pageSize.getHeight() - 10
  doc.setFontSize(8)
  doc.text(`Page 1 of 1`, pageWidth / 2, finalYPosition, { align: "center" })

  // Generate PDF and trigger download
  const fileName = `Manifest_${new Date().getTime()}.pdf`
  doc.save(fileName)
}
