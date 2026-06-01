import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import Customer from "@/models/Customer"
import { NextResponse } from "next/server"

const TEMPLATE_COLUMNS = [
  "parcelType",
  "date",
  "via",
  "shipmentType",
  "refCode",
  "senderName",
  "senderCompanyName",
  "senderEmail",
  "senderAddress",
  "senderAddress2",
  "senderCity",
  "senderState",
  "senderCountry",
  "senderZip",
  "senderContact",
  "senderWhatsappContact",
  "senderKycType",
  "senderKycNumber",
  "senderKycDocument",
  "senderGst",
  "receiverName",
  "receiverCompanyName",
  "receiverEmail",
  "receiverAddress",
  "receiverAddress2",
  "receiverCity",
  "receiverState",
  "receiverCountry",
  "receiverZip",
  "receiverContact",
  "boxLength",
  "boxBreadth",
  "boxHeight",
  "actualWeight",
  "chargeableWeight",
  "itemName",
  "itemQuantity",
  "itemPrice",
  "hsnCode",
  "shippingCurrency",
  "cNoteVendorName",
  "cNoteNumber",
  "forwardingNumber",
  "forwardingLink",
]

const TEMPLATE_ROWS = [
  {
    parcelType: "International",
    date: new Date().toISOString().slice(0, 10),
    via: "Air Shipment",
    shipmentType: "Non Document",
    refCode: "SUNEX",
    senderName: "SunEx Demo Sender",
    senderCompanyName: "SunEx Services",
    senderEmail: "sender@example.com",
    senderAddress: "Andheri East",
    senderAddress2: "Near Metro Station",
    senderCity: "Mumbai",
    senderState: "Maharashtra",
    senderCountry: "India",
    senderZip: "400069",
    senderContact: "+91 9876543210",
    senderWhatsappContact: "+91 9876543210",
    senderKycType: "Aadhaar No -",
    senderKycNumber: "123412341234",
    senderKycDocument: "",
    senderGst: "",
    receiverName: "Demo Receiver",
    receiverCompanyName: "Receiver Company",
    receiverEmail: "receiver@example.com",
    receiverAddress: "221B Baker Street",
    receiverAddress2: "",
    receiverCity: "London",
    receiverState: "England",
    receiverCountry: "United Kingdom",
    receiverZip: "NW16XE",
    receiverContact: "+44 7700900000",
    boxLength: "10",
    boxBreadth: "10",
    boxHeight: "10",
    actualWeight: "1",
    chargeableWeight: "1",
    itemName: "Documents",
    itemQuantity: "1",
    itemPrice: "100",
    hsnCode: "482030",
    shippingCurrency: "INR",
    cNoteVendorName: "",
    cNoteNumber: "",
    forwardingNumber: "",
    forwardingLink: "",
  },
  {
    parcelType: "Domestic",
    date: new Date().toISOString().slice(0, 10),
    via: "Roadways",
    shipmentType: "Non Document",
    refCode: "SUNEX",
    senderName: "SunEx Demo Sender",
    senderCompanyName: "SunEx Services",
    senderEmail: "sender@example.com",
    senderAddress: "Andheri East",
    senderAddress2: "",
    senderCity: "Mumbai",
    senderState: "Maharashtra",
    senderCountry: "India",
    senderZip: "400069",
    senderContact: "+91 9876543210",
    senderWhatsappContact: "+91 9876543210",
    senderKycType: "Aadhaar No -",
    senderKycNumber: "123412341234",
    senderKycDocument: "",
    senderGst: "",
    receiverName: "Domestic Receiver",
    receiverCompanyName: "",
    receiverEmail: "domestic@example.com",
    receiverAddress: "Opera House",
    receiverAddress2: "",
    receiverCity: "Mumbai",
    receiverState: "Maharashtra",
    receiverCountry: "India",
    receiverZip: "400004",
    receiverContact: "+91 9000000000",
    boxLength: "12",
    boxBreadth: "10",
    boxHeight: "8",
    actualWeight: "0.5",
    chargeableWeight: "0.5",
    itemName: "Garment Sample",
    itemQuantity: "1",
    itemPrice: "500",
    hsnCode: "630790",
    shippingCurrency: "INR",
    cNoteVendorName: "SHREE MARUTI",
    cNoteNumber: "",
    forwardingNumber: "",
    forwardingLink: "",
  },
]

const REQUIRED_FIELDS = [
  "senderName",
  "senderAddress",
  "senderCity",
  "senderCountry",
  "senderZip",
  "senderContact",
  "receiverName",
  "receiverAddress",
  "receiverCity",
  "receiverCountry",
  "receiverZip",
  "receiverContact",
  "actualWeight",
  "itemName",
]

const escapeCsvValue = (value) => {
  const text = String(value ?? "")
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

const buildCsv = (rows) => {
  const header = TEMPLATE_COLUMNS.map(escapeCsvValue).join(",")
  const body = rows.map((row) => TEMPLATE_COLUMNS.map((column) => escapeCsvValue(row[column])).join(","))
  return [header, ...body].join("\n")
}

const parseCsv = (csvText) => {
  const rows = []
  let row = []
  let value = ""
  let inQuotes = false

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      row.push(value)
      value = ""
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1
      row.push(value)
      if (row.some((cell) => String(cell).trim() !== "")) rows.push(row)
      row = []
      value = ""
    } else {
      value += char
    }
  }

  row.push(value)
  if (row.some((cell) => String(cell).trim() !== "")) rows.push(row)

  if (rows.length === 0) return []

  const headers = rows[0].map((header) => String(header || "").trim())
  return rows.slice(1).map((cells, index) => {
    const parsed = { _rowNumber: index + 2 }
    headers.forEach((header, cellIndex) => {
      parsed[header] = String(cells[cellIndex] ?? "").trim()
    })
    return parsed
  })
}

const generateTrackingNumber = () =>
  String(Math.floor(1000000000 + Math.random() * 9000000000))

const getStartingInvoiceNumber = async () => {
  const lastAwb = await Awb.findOne({}).sort({ _id: -1 }).select("invoiceNumber").lean()
  const lastInvoiceNumber = Number.parseInt(lastAwb?.invoiceNumber || "0", 10)
  return Number.isFinite(lastInvoiceNumber) ? lastInvoiceNumber + 1 : 1
}

const generateUniqueTrackingNumbers = async (count) => {
  const trackingNumbers = new Set()
  while (trackingNumbers.size < count) {
    const candidate = generateTrackingNumber()
    if (trackingNumbers.has(candidate)) continue
    const exists = await Awb.exists({ trackingNumber: candidate })
    if (!exists) trackingNumbers.add(candidate)
  }
  return Array.from(trackingNumbers)
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const calculateDimensionalWeight = (length, breadth, height) => {
  const l = toNumber(length)
  const b = toNumber(breadth)
  const h = toNumber(height)
  if (!l || !b || !h) return 0
  return Number((l * b * h / 5000).toFixed(3))
}

const validateRow = (row) => {
  const missing = REQUIRED_FIELDS.filter((field) => !row[field])
  const errors = []
  if (missing.length > 0) errors.push(`Missing required fields: ${missing.join(", ")}`)
  if (row.actualWeight && toNumber(row.actualWeight) <= 0) errors.push("actualWeight must be greater than 0")
  if (row.itemQuantity && toNumber(row.itemQuantity) <= 0) errors.push("itemQuantity must be greater than 0")
  if (row.itemPrice && toNumber(row.itemPrice) < 0) errors.push("itemPrice cannot be negative")
  return errors
}

const buildAwbFromRow = ({ row, invoiceNumber, trackingNumber, staffId }) => {
  const length = row.boxLength || "1"
  const breadth = row.boxBreadth || "1"
  const height = row.boxHeight || "1"
  const actualWeight = row.actualWeight || "0"
  const dimensionalWeight = calculateDimensionalWeight(length, breadth, height)
  const chargeableWeight = row.chargeableWeight || String(Math.max(toNumber(actualWeight), dimensionalWeight))
  const itemQuantity = row.itemQuantity || "1"
  const itemPrice = row.itemPrice || "0"

  const box = {
    length,
    breadth,
    height,
    actualWeight,
    dimensionalWeight: String(dimensionalWeight),
    chargeableWeight,
    items: [
      {
        name: row.itemName,
        quantity: itemQuantity,
        price: itemPrice,
        hsnCode: row.hsnCode || "",
      },
    ],
  }

  const date = row.date ? new Date(row.date) : new Date()

  return {
    parcelType: row.parcelType || "International",
    staffId,
    invoiceNumber: String(invoiceNumber),
    date: Number.isNaN(date.getTime()) ? new Date() : date,
    trackingNumber,
    awbNumber: "",
    via: row.via || "Air Shipment",
    shipmentType: row.shipmentType || "Non Document",
    refCode: row.refCode || "",
    forwardingNumber: row.forwardingNumber || "",
    forwardingLink: row.forwardingLink || "",
    cNoteNumber: row.cNoteNumber || "",
    cNoteVendorName: row.cNoteVendorName || "",
    shippingCurrency: row.shippingCurrency || "INR",
    sender: {
      name: row.senderName,
      companyName: row.senderCompanyName || "",
      email: row.senderEmail || "",
      address: row.senderAddress,
      address2: row.senderAddress2 || "",
      city: row.senderCity,
      state: row.senderState || "",
      country: row.senderCountry,
      zip: row.senderZip,
      contact: row.senderContact,
      whatsappContact: row.senderWhatsappContact || "",
      kyc: {
        type: row.senderKycType || "Aadhaar No -",
        kyc: row.senderKycNumber || "",
        document: row.senderKycDocument || "",
      },
      gst: row.senderGst || "",
      owner: staffId,
    },
    receiver: {
      name: row.receiverName,
      companyName: row.receiverCompanyName || "",
      email: row.receiverEmail || "",
      address: row.receiverAddress,
      address2: row.receiverAddress2 || "",
      city: row.receiverCity,
      state: row.receiverState || "",
      country: row.receiverCountry,
      zip: row.receiverZip,
      contact: row.receiverContact,
      owner: staffId,
    },
    boxes: [box],
    ourBoxes: [box],
    vendorBoxes: [box],
    parcelStatus: [{ status: "Shipment AWB Prepared", timestamp: new Date(), comment: "" }],
  }
}

const upsertCustomersForAwb = async (awb) => {
  await Customer.findOneAndUpdate(
    { name: awb.sender.name, owner: awb.staffId },
    {
      $set: {
        ...awb.sender,
        role: "customer",
        owner: awb.staffId,
      },
    },
    { upsert: true, new: true }
  )

  await Customer.findOneAndUpdate(
    { name: awb.receiver.name, owner: awb.staffId },
    {
      $set: {
        ...awb.receiver,
        role: "customer",
        owner: awb.staffId,
      },
    },
    { upsert: true, new: true }
  )
}

export async function GET() {
  const csv = buildCsv(TEMPLATE_ROWS)
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sunex-awb-bulk-template.csv"',
    },
  })
}

export async function POST(request) {
  try {
    await connectToDB()

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ success: false, error: "CSV file is required" }, { status: 400 })
    }

    const csvText = await file.text()
    const rows = parseCsv(csvText)

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "CSV file has no data rows" }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ success: false, error: "Please upload 500 AWBs or fewer at a time" }, { status: 400 })
    }

    const userType = request.headers.get("userType")
    const userId = request.headers.get("userId") || ""
    const staffId = userType === "admin" ? "admin" : userId

    const results = rows.map((row) => ({
      rowNumber: row._rowNumber,
      senderName: row.senderName || "",
      receiverName: row.receiverName || "",
      errors: validateRow(row),
    }))

    const validRows = rows.filter((_, index) => results[index].errors.length === 0)
    if (validRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid rows found",
        results,
      }, { status: 400 })
    }

    const startingInvoiceNumber = await getStartingInvoiceNumber()
    const trackingNumbers = await generateUniqueTrackingNumbers(validRows.length)
    const awbs = []
    let validIndex = 0

    rows.forEach((row, rowIndex) => {
      if (results[rowIndex].errors.length > 0) return

      const invoiceNumber = startingInvoiceNumber + validIndex
      const trackingNumber = trackingNumbers[validIndex]
      const awb = buildAwbFromRow({ row, invoiceNumber, trackingNumber, staffId })
      awbs.push(awb)

      results[rowIndex] = {
        ...results[rowIndex],
        success: true,
        invoiceNumber: awb.invoiceNumber,
        trackingNumber: awb.trackingNumber,
        errors: [],
      }
      validIndex += 1
    })

    const insertedAwbs = await Awb.insertMany(awbs, { ordered: true })
    await Promise.all(insertedAwbs.map((awb) => upsertCustomersForAwb(awb.toObject())))

    return NextResponse.json({
      success: true,
      message: `${insertedAwbs.length} AWB${insertedAwbs.length === 1 ? "" : "s"} imported successfully`,
      createdCount: insertedAwbs.length,
      failedCount: rows.length - insertedAwbs.length,
      results,
    })
  } catch (error) {
    console.error("Bulk AWB import error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to import AWBs" },
      { status: 500 }
    )
  }
}
