"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import * as XLSX from "xlsx"
import toast from "react-hot-toast"
import withAuth from "@/lib/withAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Download, FileSpreadsheet, Upload, Loader2, CheckCircle2, AlertTriangle, X, FileText,
} from "lucide-react"
import {
  BULK_COLUMNS, EXAMPLE_ROWS, MAX_BULK_ROWS, PARCEL_TYPES, VIA_OPTIONS, SHIPMENT_TYPES,
  buildBookingsFromRows, normalizeSheetRows,
} from "@/lib/bulk-awb"

const headerLabel = (c) => (c.required ? `${c.label} *` : c.label)

function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new()

  // Values are written as text so Excel keeps phone / KYC numbers intact
  const sheet = XLSX.utils.aoa_to_sheet([
    BULK_COLUMNS.map(headerLabel),
    ...EXAMPLE_ROWS.map((row) => BULK_COLUMNS.map((c) => String(row[c.key] ?? ""))),
  ])
  sheet["!cols"] = BULK_COLUMNS.map((c) => ({ wch: Math.max(14, headerLabel(c).length + 2) }))
  XLSX.utils.book_append_sheet(wb, sheet, "Bookings")

  const instructions = XLSX.utils.aoa_to_sheet([
    ["HOW TO FILL THE BULK BOOKING TEMPLATE"],
    [],
    ["1. Fill your bookings in the 'Bookings' sheet. Delete the example rows first."],
    ["2. Columns marked * are required. Do not rename or remove the header row."],
    ["3. Simple booking (1 box, 1 item): one row = one booking. Leave Booking No and Box No blank."],
    ["4. Many boxes or items in one booking: give all its rows the same Booking No."],
    ["   Use Box No 1, 2, 3... for each box. Fill size and weight on the first row of each box."],
    ["   Each extra item in the same box = one more row with the same Booking No and Box No."],
    ["   Sender and receiver details are taken from the first row of the booking."],
    [`5. Upload up to ${MAX_BULK_ROWS} rows at a time. Save as .xlsx or .csv.`],
    [],
    ["Allowed values"],
    ["Parcel Type", PARCEL_TYPES.join(" / ")],
    ["Via", VIA_OPTIONS.join(" / ")],
    ["Shipment Type", SHIPMENT_TYPES.join(" / ")],
    ["Sender KYC Type", "Aadhaar / PAN / Passport / Driving License / Voter ID / GST"],
    ["Currency", "INR / USD"],
    [],
    ["Column", "Required", "How to fill", "Example"],
    ...BULK_COLUMNS.map((c) => [c.label, c.required ? "Yes" : "No", c.help, c.example]),
  ])
  instructions["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 90 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, instructions, "Instructions")

  XLSX.writeFile(wb, "kargoone-bulk-booking-template.xlsx")
}

async function readFileRows(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: "array", cellDates: true })
  // Use the "Bookings" sheet if present, otherwise the first sheet
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === "bookings") || wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true, blankrows: true })
  // sheet_to_json starts at the row below the header (Excel row 2)
  return normalizeSheetRows(raw.map((r, i) => ({ ...r, _rowNumber: i + 2 })))
}

function BulkBookingPage() {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState("")
  const [rows, setRows] = useState([])
  const [reading, setReading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const bookings = useMemo(() => buildBookingsFromRows(rows), [rows])
  const readyCount = bookings.filter((b) => b.booking).length
  const errorCount = bookings.length - readyCount

  const reset = () => {
    setRows([])
    setFileName("")
    setResult(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleFile = async (file) => {
    if (!file) return
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      toast.error("Please upload an .xlsx, .xls or .csv file")
      return
    }
    setReading(true)
    setResult(null)
    try {
      const parsed = await readFileRows(file)
      if (parsed.length === 0) {
        toast.error("No booking rows found. Check that the header row matches the template.")
        setRows([])
        return
      }
      if (parsed.length > MAX_BULK_ROWS) {
        toast.error(`Please upload ${MAX_BULK_ROWS} rows or fewer at a time (file has ${parsed.length})`)
        setRows([])
        return
      }
      setFileName(file.name)
      setRows(parsed)
    } catch (error) {
      console.error(error)
      toast.error("Could not read this file. Please use the template.")
    } finally {
      setReading(false)
    }
  }

  const handleImport = async () => {
    if (readyCount === 0) return
    setImporting(true)
    try {
      const response = await fetch("/api/awb/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          userType: localStorage.getItem("userType") || "",
          userId: localStorage.getItem("code") || "",
          staffId: localStorage.getItem("id") || "",
        },
        body: JSON.stringify({ rows }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        toast.error(data.error || "Bulk booking failed")
        return
      }
      setResult(data)
      toast.success(data.message)
    } catch (error) {
      console.error(error)
      toast.error("Bulk booking failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  const downloadResults = () => {
    const created = (result?.results || []).filter((r) => r.success)
    const sheet = XLSX.utils.json_to_sheet(
      created.map((r) => ({
        "Tracking Number": r.trackingNumber,
        "Invoice Number": r.invoiceNumber,
        "Sender": r.senderName,
        "Receiver": r.receiverName,
        "Boxes": r.boxCount,
        "File Rows": r.rowNumbers.join(", "),
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, "Created")
    XLSX.writeFile(wb, "bulk-booking-results.xlsx")
  }

  return (
    <div className="w-full px-4 pb-10 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/awb" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" /> Back to bookings
          </Link>
          <h1 className="text-2xl font-bold text-slate-950 mt-1">Bulk Booking</h1>
          <p className="text-sm text-slate-500">Create many AWB bookings at once from an Excel or CSV file.</p>
        </div>
      </div>

      {/* Step 1 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Step 1: Download the template</CardTitle>
          <CardDescription>
            Columns marked * are required. The Excel file has an <b>Instructions</b> sheet that explains every column.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadExcelTemplate} className="gap-2 bg-green-700 hover:bg-green-800">
              <FileSpreadsheet className="h-4 w-4" /> Excel template (.xlsx)
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href="/api/awb/bulk" download>
                <FileText className="h-4 w-4" /> CSV template
              </a>
            </Button>
          </div>
          <ul className="grid gap-1.5 text-sm text-slate-600 list-disc pl-5">
            <li><b>1 box, 1 item:</b> one row = one booking. Leave <i>Booking No</i> and <i>Box No</i> blank.</li>
            <li><b>Many boxes or items:</b> give all rows of a booking the same <i>Booking No</i>; use <i>Box No</i> 1, 2, 3… for each box.</li>
            <li>Fill box size and weight on the first row of each box. Each extra item = one more row.</li>
            <li>Dates as DD-MM-YYYY. Up to {MAX_BULK_ROWS} rows per file.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Step 2 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Step 2: Upload the filled file</CardTitle>
          <CardDescription>We check every row before anything is saved.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver ? "border-red-500 bg-red-50" : "border-slate-300 hover:border-slate-400 bg-slate-50"
            }`}
          >
            {reading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : <Upload className="h-8 w-8 text-slate-400" />}
            <p className="text-sm font-medium text-slate-700">
              {fileName ? fileName : "Drop your file here, or click to choose"}
            </p>
            <p className="text-xs text-slate-500">.xlsx, .xls or .csv</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 3: preview */}
      {bookings.length > 0 && !result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Step 3: Check and create</CardTitle>
                <CardDescription className="flex flex-wrap gap-2 mt-1.5">
                  <Badge className="bg-green-600 hover:bg-green-600">{readyCount} ready</Badge>
                  {errorCount > 0 && <Badge variant="destructive">{errorCount} with errors</Badge>}
                  <span className="text-xs text-slate-500">{rows.length} rows in file</span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} className="gap-2">
                  <X className="h-4 w-4" /> Clear
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || readyCount === 0}
                  className="gap-2 bg-red-600 hover:bg-red-700"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Create {readyCount} booking{readyCount === 1 ? "" : "s"}
                </Button>
              </div>
            </div>
            {errorCount > 0 && readyCount > 0 && (
              <p className="text-xs text-amber-700 mt-2">
                Bookings with errors will be skipped. Fix them in the file and upload again, or create the ready ones now.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>File rows</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-center">PCS</TableHead>
                    <TableHead className="text-right">Chg. Wt (kg)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b, i) => (
                    <TableRow key={b.key} className={b.booking ? "" : "bg-red-50/60"}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="text-xs text-slate-500">{b.rowNumbers.join(", ")}</TableCell>
                      <TableCell className="font-medium">{b.first.senderName || "—"}</TableCell>
                      <TableCell>{b.first.receiverName || "—"}</TableCell>
                      <TableCell>{[b.first.receiverCity, b.first.receiverCountry].filter(Boolean).join(", ") || "—"}</TableCell>
                      <TableCell className="text-center">{b.boxCount}</TableCell>
                      <TableCell className="text-right">{b.totalWeight ? b.totalWeight.toFixed(2) : "—"}</TableCell>
                      <TableCell>
                        {b.booking ? (
                          <span className="inline-flex items-center gap-1 text-green-700 text-sm">
                            <CheckCircle2 className="h-4 w-4" /> Ready
                          </span>
                        ) : (
                          <ul className="text-xs text-red-700 space-y-0.5">
                            {b.errors.map((err) => (
                              <li key={err} className="flex gap-1">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" /> {err}
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" /> {result.message}
                </CardTitle>
                <CardDescription>Your new tracking numbers are below.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={downloadResults} className="gap-2">
                  <Download className="h-4 w-4" /> Download list
                </Button>
                <Button variant="outline" onClick={reset}>Upload another file</Button>
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <Link href="/awb">Go to bookings</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File rows</TableHead>
                    <TableHead>Tracking No</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead className="text-center">PCS</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.results.map((r) => (
                    <TableRow key={r.rowNumbers.join("-")}>
                      <TableCell className="text-xs text-slate-500">{r.rowNumbers.join(", ")}</TableCell>
                      <TableCell className="font-mono">
                        {r.trackingNumber ? (
                          <Link href={`/awb/${r.trackingNumber}`} className="text-blue-600 hover:underline">
                            {r.trackingNumber}
                          </Link>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{r.invoiceNumber || "—"}</TableCell>
                      <TableCell>{r.senderName}</TableCell>
                      <TableCell>{r.receiverName}</TableCell>
                      <TableCell className="text-center">{r.boxCount}</TableCell>
                      <TableCell>
                        {r.success ? (
                          <Badge className="bg-green-600 hover:bg-green-600">Created</Badge>
                        ) : (
                          <span className="text-xs text-red-700">Skipped: {r.errors.join("; ")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default withAuth(BulkBookingPage)
