// lib/bulk-awb.js
// Bulk booking template + row validation. Shared by the /awb/bulk page
// (preview before upload) and /api/awb/bulk (final check before saving),
// so both always agree on what a valid row is.
import { Countries, countryCodeMap } from "@/app/constants/country"

export const PARCEL_TYPES = ["International", "Domestic"]
export const VIA_OPTIONS = ["Air Shipment", "Cargo", "Roadways", "Railways"]
export const SHIPMENT_TYPES = ["Non Document", "Document"]
export const KYC_TYPES = [
  "Aadhaar No -",
  "Pan No -",
  "Passport No -",
  "Driving License No -",
  "Voter ID Card No -",
  "GST No -",
]
export const MAX_BULK_ROWS = 500

// key = field name, label = column header in the template
export const BULK_COLUMNS = [
  { key: "bookingNo", label: "Booking No", help: "Optional. Give rows the same Booking No to put several boxes/items in one booking. Leave blank for one row = one booking.", example: "1" },
  { key: "date", label: "Date", help: "Booking date as DD-MM-YYYY or YYYY-MM-DD. Blank = today.", example: "" },
  { key: "parcelType", label: "Parcel Type", help: `${PARCEL_TYPES.join(" / ")}. Blank = International.`, example: "International" },
  { key: "via", label: "Via", help: `${VIA_OPTIONS.join(" / ")}. Blank = Air Shipment.`, example: "Air Shipment" },
  { key: "shipmentType", label: "Shipment Type", help: `${SHIPMENT_TYPES.join(" / ")}. Blank = Non Document.`, example: "Non Document" },
  { key: "refCode", label: "Ref Code", help: "Client / franchise code (admin only). Ignored for client and franchise logins - your own code is used.", example: "" },

  { key: "senderName", label: "Sender Name", required: true, help: "Required.", example: "Rahul Sharma" },
  { key: "senderCompanyName", label: "Sender Company", help: "Optional.", example: "" },
  { key: "senderEmail", label: "Sender Email", help: "Optional.", example: "rahul@example.com" },
  { key: "senderAddress", label: "Sender Address", required: true, help: "Required.", example: "Shop 10, Prakashwadi CHS" },
  { key: "senderAddress2", label: "Sender Address 2", help: "Optional.", example: "Andheri East" },
  { key: "senderCity", label: "Sender City", required: true, help: "Required.", example: "Mumbai" },
  { key: "senderState", label: "Sender State", help: "Optional.", example: "Maharashtra" },
  { key: "senderCountry", label: "Sender Country", required: true, help: "Required. Full country name, e.g. India.", example: "India" },
  { key: "senderZip", label: "Sender Zip", required: true, help: "Required.", example: "400093" },
  { key: "senderContact", label: "Sender Contact", required: true, help: "Required. Country code is added automatically if missing.", example: "9876543210" },
  { key: "senderKycType", label: "Sender KYC Type", help: "Aadhaar / PAN / Passport / Driving License / Voter ID / GST. Blank = Aadhaar.", example: "Aadhaar" },
  { key: "senderKycNumber", label: "Sender KYC Number", help: "Optional.", example: "123412341234" },
  { key: "senderGst", label: "Sender GST", help: "Optional.", example: "" },

  { key: "receiverName", label: "Receiver Name", required: true, help: "Required.", example: "John Smith" },
  { key: "receiverCompanyName", label: "Receiver Company", help: "Optional.", example: "" },
  { key: "receiverEmail", label: "Receiver Email", help: "Optional.", example: "john@example.com" },
  { key: "receiverAddress", label: "Receiver Address", required: true, help: "Required.", example: "221B Baker Street" },
  { key: "receiverAddress2", label: "Receiver Address 2", help: "Optional.", example: "" },
  { key: "receiverCity", label: "Receiver City", required: true, help: "Required.", example: "London" },
  { key: "receiverState", label: "Receiver State", help: "Optional.", example: "England" },
  { key: "receiverCountry", label: "Receiver Country", required: true, help: "Required. Full country name, e.g. United Kingdom.", example: "United Kingdom" },
  { key: "receiverZip", label: "Receiver Zip", required: true, help: "Required.", example: "NW1 6XE" },
  { key: "receiverContact", label: "Receiver Contact", required: true, help: "Required. Digits only, with country code.", example: "447700900000" },

  { key: "boxNo", label: "Box No", help: "Optional. Rows of one booking with the same Box No go in the same box. Blank = box 1.", example: "1" },
  { key: "length", label: "Length (cm)", help: "Box length in cm. Fill on the first row of each box.", example: "30" },
  { key: "breadth", label: "Breadth (cm)", help: "Box breadth in cm.", example: "20" },
  { key: "height", label: "Height (cm)", help: "Box height in cm.", example: "15" },
  { key: "actualWeight", label: "Actual Weight (kg)", required: true, help: "Required on the first row of each box. Must be more than 0.", example: "2.5" },
  { key: "itemName", label: "Item Name", required: true, help: "Required. One item per row; add more rows for more items.", example: "Cotton T-Shirt" },
  { key: "itemQuantity", label: "Item Qty", help: "Blank = 1.", example: "5" },
  { key: "itemPrice", label: "Item Price", help: "Price per piece. Blank = 0.", example: "300" },
  { key: "hsnCode", label: "HSN Code", help: "Optional.", example: "61091000" },
  { key: "shippingCurrency", label: "Currency", help: "INR or USD. Blank = INR.", example: "INR" },

  { key: "cNoteVendorName", label: "C Note Vendor", help: "Optional (admin).", example: "" },
  { key: "cNoteNumber", label: "C Note Number", help: "Optional (admin).", example: "" },
  { key: "forwardingNumber", label: "Forwarding Number", help: "Optional (admin).", example: "" },
  { key: "forwardingLink", label: "Forwarding Link", help: "Optional (admin).", example: "" },
]

// Example rows: booking 1 has two boxes (the second with two items),
// booking 2 is a simple one-row booking.
export const EXAMPLE_ROWS = (() => {
  const base = Object.fromEntries(BULK_COLUMNS.map((c) => [c.key, c.example]))
  return [
    base,
    {
      ...base,
      boxNo: "2", length: "25", breadth: "20", height: "10", actualWeight: "1.2",
      itemName: "Cotton Kurti", itemQuantity: "3", itemPrice: "450", hsnCode: "62044220",
    },
    {
      ...Object.fromEntries(BULK_COLUMNS.map((c) => [c.key, ""])),
      bookingNo: "1", boxNo: "2", itemName: "Silk Scarf", itemQuantity: "2", itemPrice: "250", hsnCode: "62141000",
    },
    {
      ...base,
      bookingNo: "2", boxNo: "", parcelType: "Domestic", via: "Roadways",
      receiverName: "Priya Nair", receiverAddress: "12 MG Road", receiverCity: "Bengaluru",
      receiverState: "Karnataka", receiverCountry: "India", receiverZip: "560001", receiverContact: "919000000000",
      receiverEmail: "", length: "20", breadth: "15", height: "10", actualWeight: "0.5",
      itemName: "Documents", itemQuantity: "1", itemPrice: "0", hsnCode: "", shipmentType: "Document",
    },
  ]
})()

// ---------- header + value normalisation ----------

const squash = (text) => String(text ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

// Accept the friendly label, the field key, and a few old template names
const HEADER_ALIASES = (() => {
  const map = {}
  BULK_COLUMNS.forEach((c) => {
    map[squash(c.label)] = c.key
    map[squash(c.key)] = c.key
  })
  Object.assign(map, {
    boxlength: "length", boxbreadth: "breadth", boxheight: "height", boxwidth: "breadth", width: "breadth",
    weight: "actualWeight", actualweight: "actualWeight", weightkg: "actualWeight",
    qty: "itemQuantity", quantity: "itemQuantity", price: "itemPrice", value: "itemPrice",
    currency: "shippingCurrency", hsn: "hsnCode", senderzipcode: "senderZip", receiverzipcode: "receiverZip",
    senderkycno: "senderKycNumber", sendercompanyname: "senderCompanyName", receivercompanyname: "receiverCompanyName",
    referencecode: "refCode", bookingnumber: "bookingNo", boxnumber: "boxNo",
  })
  return map
})()

export const headerToKey = (header) => HEADER_ALIASES[squash(header).replace(/(required|\*)$/g, "")] || null

const cellToString = (value) => {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) {
    // Shift to midday so the calendar day survives any timezone offset
    const d = new Date(value.getTime() + 12 * 60 * 60 * 1000)
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${d.getFullYear()}-${mm}-${dd}`
  }
  // Excel stores long numbers (phones, Aadhaar) as numbers; keep every digit
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toFixed(0) : String(value)
  }
  return String(value).trim()
}

// Turn sheet rows (objects keyed by header text) into rows keyed by field name
export const normalizeSheetRows = (sheetRows = []) =>
  sheetRows
    .map((raw, index) => {
      const row = { _rowNumber: Number(raw?._rowNumber) || index + 2 }
      Object.entries(raw || {}).forEach(([header, value]) => {
        const key = headerToKey(header)
        if (key) row[key] = cellToString(value)
      })
      return row
    })
    .filter((row) => BULK_COLUMNS.some((c) => row[c.key]))

const pickOption = (value, options, fallback) => {
  if (!value) return fallback
  const v = squash(value)
  return options.find((o) => squash(o) === v) || options.find((o) => squash(o).startsWith(v)) || null
}

const COUNTRY_ALIASES = {
  usa: "United States Of America", us: "United States Of America", unitedstates: "United States Of America",
  america: "United States Of America", uk: "United Kingdom", gb: "United Kingdom", greatbritain: "United Kingdom",
  england: "United Kingdom", uae: "United Arab Emirates", dubai: "United Arab Emirates", in: "India", bharat: "India",
}

const normalizeCountry = (value) => {
  if (!value) return ""
  const v = squash(value)
  return Countries.find((c) => squash(c) === v) || COUNTRY_ALIASES[v] || String(value).trim()
}

const normalizeKycType = (value) => {
  if (!value) return KYC_TYPES[0]
  const v = squash(value)
  if (v.startsWith("aadha") || v.startsWith("adha")) return "Aadhaar No -"
  if (v.startsWith("pan")) return "Pan No -"
  if (v.startsWith("passport")) return "Passport No -"
  if (v.startsWith("driving") || v.startsWith("dl")) return "Driving License No -"
  if (v.startsWith("voter")) return "Voter ID Card No -"
  if (v.startsWith("gst")) return "GST No -"
  return null
}

const normalizeCurrency = (value) => {
  const v = squash(value)
  if (!v || v === "inr" || value === "₹" || v === "rs" || v === "rupee" || v === "rupees") return "₹"
  if (v === "usd" || value === "$" || v === "dollar" || v === "dollars") return "$"
  return null
}

// DD-MM-YYYY / DD/MM/YYYY (Indian order) or YYYY-MM-DD. Returns a Date or null.
export const parseBookingDate = (value) => {
  const text = String(value || "").trim()
  if (!text) return new Date()
  let m = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (m) return validDate(+m[1], +m[2], +m[3])
  m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/)
  if (m) return validDate(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1])
  const d = new Date(text)
  return Number.isNaN(d.getTime()) ? null : d
}

const validDate = (y, mo, d) => {
  // 06:30 UTC = 12:00 IST, so the calendar day is the same in India and most timezones
  const date = new Date(Date.UTC(y, mo - 1, d, 6, 30))
  return date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null
}

const num = (value) => {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : NaN
}

// Same rounding as the booking form: < 20 kg rounds up to 0.5 kg, else to 1 kg
const roundChargeable = (kg) => (kg < 20 ? Math.ceil(kg * 2) / 2 : Math.ceil(kg))

const withCallingCode = (contact, country) => {
  const text = String(contact || "").trim()
  if (!text || text.startsWith("+")) return text
  const code = countryCodeMap[country]?.callingCode
  if (!code) return text
  const digits = text.replace(/[^\d]/g, "")
  const codeDigits = code.replace(/[^\d]/g, "")
  if (digits.startsWith(codeDigits) && digits.length > 10) return `${code} ${digits.slice(codeDigits.length)}`
  return `${code} ${digits}`
}

// ---------- grouping + validation ----------

const SENDER_RECEIVER_REQUIRED = BULK_COLUMNS.filter(
  (c) => c.required && (c.key.startsWith("sender") || c.key.startsWith("receiver"))
)

// Groups rows into bookings and validates them.
// Returns [{ key, rowNumbers, first, errors, booking }] where booking is the
// AWB payload (without tracking/invoice numbers) when there are no errors.
export function buildBookingsFromRows(rows = []) {
  const groups = new Map()
  rows.forEach((row, index) => {
    const key = row.bookingNo ? `b:${row.bookingNo}` : `r:${index}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  })

  return Array.from(groups.entries()).map(([key, groupRows]) => {
    const first = groupRows[0]
    const errors = []
    const rowNumbers = groupRows.map((r) => r._rowNumber)

    const missing = SENDER_RECEIVER_REQUIRED.filter((c) => !first[c.key]).map((c) => c.label)
    if (missing.length) errors.push(`Missing ${missing.join(", ")}`)

    const parcelType = pickOption(first.parcelType, PARCEL_TYPES, "International")
    if (!parcelType) errors.push(`Parcel Type must be ${PARCEL_TYPES.join(" or ")}`)
    const via = pickOption(first.via, VIA_OPTIONS, "Air Shipment")
    if (!via) errors.push(`Via must be one of: ${VIA_OPTIONS.join(", ")}`)
    const shipmentType = pickOption(first.shipmentType, SHIPMENT_TYPES, "Non Document")
    if (!shipmentType) errors.push(`Shipment Type must be ${SHIPMENT_TYPES.join(" or ")}`)
    const kycType = normalizeKycType(first.senderKycType)
    if (!kycType) errors.push("Sender KYC Type is not recognised")
    const shippingCurrency = normalizeCurrency(first.shippingCurrency)
    if (!shippingCurrency) errors.push("Currency must be INR or USD")
    const date = parseBookingDate(first.date)
    if (!date) errors.push("Date is not valid (use DD-MM-YYYY)")

    const senderCountry = normalizeCountry(first.senderCountry)
    const receiverCountry = normalizeCountry(first.receiverCountry)

    // Boxes, in the order they first appear
    const boxMap = new Map()
    groupRows.forEach((row) => {
      const boxKey = row.boxNo || "1"
      if (!boxMap.has(boxKey)) boxMap.set(boxKey, [])
      boxMap.get(boxKey).push(row)
    })

    const boxes = Array.from(boxMap.entries()).map(([boxKey, boxRows]) => {
      const dimsRow = boxRows.find((r) => r.actualWeight || r.length) || boxRows[0]
      const label = boxMap.size > 1 ? `Box ${boxKey}: ` : ""
      const actualWeight = num(dimsRow.actualWeight)
      if (!(actualWeight > 0)) errors.push(`${label}Actual Weight must be more than 0`)
      const [l, b, h] = [dimsRow.length, dimsRow.breadth, dimsRow.height].map((v) => (v ? num(v) : 0))
      if ([l, b, h].some((v) => Number.isNaN(v) || v < 0)) errors.push(`${label}Length / Breadth / Height must be numbers`)

      const dimensionalWeight = l && b && h ? (l * b * h) / 5000 : 0
      const items = boxRows
        .filter((r) => r.itemName || r.itemQuantity || r.itemPrice || r.hsnCode)
        .map((r) => {
          const quantity = r.itemQuantity ? num(r.itemQuantity) : 1
          const price = r.itemPrice ? num(r.itemPrice) : 0
          if (!r.itemName) errors.push(`Row ${r._rowNumber}: Item Name is missing`)
          if (!(quantity > 0)) errors.push(`Row ${r._rowNumber}: Item Qty must be more than 0`)
          if (Number.isNaN(price) || price < 0) errors.push(`Row ${r._rowNumber}: Item Price must be 0 or more`)
          return { name: r.itemName, quantity: String(quantity), price: String(price), hsnCode: r.hsnCode || "" }
        })
      if (items.length === 0) errors.push(`${label}add at least one item`)

      return {
        length: l ? String(l) : "",
        breadth: b ? String(b) : "",
        height: h ? String(h) : "",
        actualWeight: actualWeight > 0 ? String(actualWeight) : "",
        dimensionalWeight: dimensionalWeight.toFixed(3),
        chargeableWeight: actualWeight > 0 ? roundChargeable(Math.max(actualWeight, dimensionalWeight)) : 0,
        items,
      }
    })

    const booking = errors.length
      ? null
      : {
          parcelType,
          date,
          via,
          shipmentType,
          refCode: first.refCode || "",
          forwardingNumber: first.forwardingNumber || "",
          forwardingLink: first.forwardingLink || "",
          cNoteNumber: first.cNoteNumber || "",
          cNoteVendorName: first.cNoteVendorName || "",
          awbNumber: "",
          shippingCurrency,
          sender: {
            name: first.senderName,
            companyName: first.senderCompanyName || "",
            email: first.senderEmail || "",
            address: first.senderAddress,
            address2: first.senderAddress2 || "",
            city: first.senderCity,
            state: first.senderState || "",
            country: senderCountry,
            zip: first.senderZip,
            contact: withCallingCode(first.senderContact, senderCountry),
            kyc: { type: kycType, kyc: first.senderKycNumber || "", document: "" },
            gst: first.senderGst || "",
          },
          receiver: {
            name: first.receiverName,
            companyName: first.receiverCompanyName || "",
            email: first.receiverEmail || "",
            address: first.receiverAddress,
            address2: first.receiverAddress2 || "",
            city: first.receiverCity,
            state: first.receiverState || "",
            country: receiverCountry,
            zip: first.receiverZip,
            contact: String(first.receiverContact || "").replace(/[^\d]/g, ""),
          },
          boxes,
        }

    return {
      key,
      rowNumbers,
      first,
      boxCount: boxes.length,
      totalWeight: boxes.reduce((sum, bx) => sum + (Number(bx.chargeableWeight) || 0), 0),
      errors,
      booking,
    }
  })
}

// ---------- CSV helpers (server-side CSV template + legacy CSV upload) ----------

const escapeCsvValue = (value) => {
  const text = String(value ?? "")
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const buildTemplateCsv = () => {
  const header = BULK_COLUMNS.map((c) => escapeCsvValue(c.label)).join(",")
  const body = EXAMPLE_ROWS.map((row) => BULK_COLUMNS.map((c) => escapeCsvValue(row[c.key])).join(","))
  return [header, ...body].join("\r\n")
}

export const parseCsvToSheetRows = (csvText) => {
  const text = String(csvText || "").replace(/^﻿/, "")
  const rows = []
  let row = []
  let value = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]
    if (char === '"') {
      if (inQuotes && next === '"') { value += '"'; i += 1 } else inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      row.push(value); value = ""
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1
      row.push(value); rows.push(row); row = []; value = ""
    } else {
      value += char
    }
  }
  row.push(value)
  rows.push(row)

  const [headers = [], ...dataRows] = rows
  return dataRows
    .map((cells, index) => {
      const obj = { _rowNumber: index + 2 }
      headers.forEach((h, i) => { obj[String(h).trim()] = String(cells[i] ?? "").trim() })
      return obj
    })
    .filter((obj) => Object.entries(obj).some(([k, v]) => k !== "_rowNumber" && v))
}
