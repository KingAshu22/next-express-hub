// app/api/vendor-integrations/send-awb/route.js
import { connectToDB } from "@/app/_utils/mongodb"
import VendorIntegration from "@/models/VendorIntegration"
import Awb from "@/models/Awb"
import iso from "iso-3166-1-alpha-2"
import { State } from "country-state-city"

// KYC document type mapping
const KYC_TYPE_MAP = {
  "Aadhaar No -": "Aadhaar Number",
  "Pan No -": "PAN Number",
  "Passport No -": "Passport Number",
  "Driving License No -": "Driving License Number",
  "Voter ID Card No -": "Voter Id",
  "GST No -": "GSTIN (Normal)",
}

const ITD_KYC_TYPE_MAP = {
  "Aadhaar No -": "Aadhaar Number",
  "Pan No -": "PAN Number",
  "Passport No -": "Passport Number",
  "Driving License No -": "DRIVING LICENCE",
  "Voter ID Card No -": "Voter Id",
  "GST No -": "GSTIN (Normal)",
}

// Country name normalization map for ISO-3166-1 lookup
const COUNTRY_NAME_MAP = {
  "united states of america": "US",
  "united states": "US",
  "usa": "US",
  "u.s.a": "US",
  "u.s.": "US",
  "united kingdom": "GB",
  "great britain": "GB",
  "uk": "GB",
  "uae": "AE",
  "united arab emirates": "AE",
  "russia": "RU",
  "russia federation": "RU",
  "south korea": "KR",
  "korea, republic of": "KR",
  "taiwan": "TW",
  "vietnam": "VN",
  "viet nam": "VN",
  "iran": "IR",
  "syria": "SY",
  "bolivia": "BO",
  "tanzania": "TZ",
  "venezuela": "VE",
  "moldova": "MD",
  "north korea": "KP",
  "laos": "LA",
}

// Helper: Get ISO country code with fallback normalization
const getCountryCode = (countryName) => {
  if (!countryName) return null

  const trimmed = countryName.trim()

  // If it's already a 2-letter ISO code, return as-is
  if (trimmed.length === 2) return trimmed.toUpperCase()

  // Try direct ISO lookup first
  const directCode = iso.getCode(trimmed)
  if (directCode) return directCode

  // Try lowercase lookup in our custom map
  const normalized = trimmed.toLowerCase()
  if (COUNTRY_NAME_MAP[normalized]) return COUNTRY_NAME_MAP[normalized]

  return null
}

// Helper: Get ISO State Code using country-state-city
const getStateCode = (countryName, stateName) => {
  if (!stateName) return ""

  let countryCode = iso.getCode(countryName) || countryName

  if (countryName && countryName.length === 2) {
    countryCode = countryName
  }

  if (!countryCode) return stateName.substring(0, 2).toUpperCase()

  const states = State.getStatesOfCountry(countryCode)

  const foundState = states.find(
    (s) =>
      s.name.toLowerCase() === stateName.toLowerCase() ||
      s.isoCode.toLowerCase() === stateName.toLowerCase()
  )

  return foundState ? foundState.isoCode : stateName.substring(0, 2).toUpperCase()
}

// Helper to get ITD token
async function getITDToken(credentials, vendorId) {
  const vendor = await VendorIntegration.findById(vendorId)
  const itdCreds = vendor.itdCredentials

  if (
    itdCreds.cachedToken &&
    itdCreds.tokenExpiresAt &&
    Date.now() < new Date(itdCreds.tokenExpiresAt).getTime() - 300000
  ) {
    return {
      token: itdCreds.cachedToken,
      customerId: itdCreds.cachedCustomerId,
    }
  }

  const tokenUrl = `${credentials.apiUrl}/get_token`
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_id: credentials.companyId,
      email: credentials.email,
      password: credentials.password,
    }),
  })

  if (!response.ok) {
    throw new Error(`ITD Auth API error: ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.success || !result.data?.token) {
    throw new Error(result.errors?.join(", ") || "Failed to get ITD token")
  }

  await VendorIntegration.findByIdAndUpdate(vendorId, {
    "itdCredentials.cachedToken": result.data.token,
    "itdCredentials.cachedCustomerId": result.data.customer_id,
    "itdCredentials.tokenExpiresAt": new Date(Date.now() + 24 * 60 * 60 * 1000),
  })

  return {
    token: result.data.token,
    customerId: result.data.customer_id,
  }
}

async function getM5CToken(vendor) {
  const creds = vendor.m5cCredentials

  if (
    creds.cachedToken &&
    creds.tokenExpiresAt &&
    Date.now() < new Date(creds.tokenExpiresAt).getTime() - 300000
  ) {
    return creds.cachedToken
  }

  const response = await fetch(joinUrl(creds.apiUrl, "/token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      UserName: creds.username,
      Password: creds.password,
      grant_type: "password",
    }).toString(),
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok || !result.access_token) {
    throw new Error(
      result.error_description ||
      result.error ||
      `M5C token API error: ${response.statusText}`
    )
  }

  const expiresInSeconds = Number(result.expires_in || 86400)
  await VendorIntegration.findByIdAndUpdate(vendor._id, {
    "m5cCredentials.cachedToken": result.access_token,
    "m5cCredentials.tokenExpiresAt": new Date(
      Date.now() + expiresInSeconds * 1000
    ),
  })

  return result.access_token
}

const cleanPhone = (phone) => {
  if (!phone) return "0000000000"
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length > 15) return cleaned.slice(-15)
  return cleaned
}

const joinUrl = (baseUrl, path = "") => {
  if (!baseUrl) return path || ""
  if (!path) return baseUrl
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
}

const buildSKartHeaders = (creds) => {
  const headers = { "Content-Type": "application/json" }
  if (creds.apiKey) headers["x-api-key"] = creds.apiKey
  if (creds.authToken) headers.Authorization = `Bearer ${creds.authToken}`
  return headers
}

/**
 * Safe JSON parser that handles HTML error pages from servers gracefully.
 * Returns { ok: true, data } or { ok: false, error, rawText, status }
 */
const safeParseJson = async (response) => {
  const rawText = await response.text()

  console.log(`[SKart] HTTP Status: ${response.status} ${response.statusText}`)
  console.log(`[SKart] Response Content-Type: ${response.headers.get("content-type")}`)
  console.log(`[SKart] Raw Response Text (first 500 chars): ${rawText.substring(0, 500)}`)

  // Check if it looks like HTML (server returned error page)
  const trimmed = rawText.trim()
  if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    return {
      ok: false,
      error: `Server returned HTML instead of JSON (HTTP ${response.status}). The API endpoint may be incorrect or the server encountered an error.`,
      rawText,
      status: response.status,
    }
  }

  // Check if empty
  if (!trimmed) {
    return {
      ok: false,
      error: `Server returned empty response (HTTP ${response.status}).`,
      rawText: "",
      status: response.status,
    }
  }

  try {
    const data = JSON.parse(trimmed)
    return { ok: true, data, status: response.status }
  } catch (parseError) {
    return {
      ok: false,
      error: `Failed to parse JSON response: ${parseError.message}`,
      rawText,
      status: response.status,
    }
  }
}

async function fetchSKartCountryDetails(creds, countryName) {
  const normalizedCountry = String(countryName || "").trim()
  if (!normalizedCountry) {
    throw new Error("Destination country is required for SKart country lookup")
  }

  const endpoint = `https://devapiv2.skart-express.com/api/v1/booking/country/${encodeURIComponent(
    normalizedCountry.toUpperCase()
  )}?user_name=sgate&password=123456`

  console.log(`[SKart] Fetching country details from: ${endpoint}`)

  const response = await fetch(endpoint, {
    method: "GET",
    headers: buildSKartHeaders(creds),
  })

  const parsed = await safeParseJson(response)

  if (!parsed.ok) {
    throw new Error(
      `SKart country lookup failed: ${parsed.error} | URL: ${endpoint}`
    )
  }

  const result = parsed.data
  console.log("[SKart] Country Lookup Response:", JSON.stringify(result, null, 2))

  if (!result.success && !result.data && !result.result) {
    throw new Error(
      result?.message ||
      result?.error ||
      `SKart country lookup returned an error for "${normalizedCountry}"`
    )
  }

  const items = result?.data || result?.result || []
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`SKart country details not found for "${normalizedCountry}"`)
  }

  const exactMatch =
    items.find(
      (item) =>
        String(item.country_name || "").toLowerCase() ===
        normalizedCountry.toLowerCase()
    ) || items[0]

  console.log(`[SKart] Resolved country details:`, JSON.stringify(exactMatch, null, 2))

  return exactMatch
}

const SKART_DOC_TYPE_MAP = {
  "GST No -": 1,
  "Pan No -": 2,
  "Passport No -": 3,
  "Aadhaar No -": 4,
}

const SKART_CURRENCY_MAP = {
  EUR: 22,
  USD: 48,
  GBP: 50,
  "€": 22,
  $: 48,
  "£": 50,
}

const getSKartDocType = (kycType, fallbackToGst = false) => {
  if (SKART_DOC_TYPE_MAP[kycType]) return SKART_DOC_TYPE_MAP[kycType]
  return fallbackToGst ? 1 : 4
}

const getSKartBookingType = (awb) => {
  const destCountryCode = getCountryCode(awb.receiver?.country || "")
  return destCountryCode === "IN" ? 2 : 1
}

const getSKartShipmentType = (awb, serviceData) => {
  const productCode = String(
    serviceData?.productCode ||
    serviceData?.packageCode ||
    serviceData?.serviceCode ||
    ""
  ).toUpperCase()

  if (["DOC", "DOX"].includes(productCode) || awb.parcelType === "Document") {
    return 2
  }

  if ((awb.boxes || []).some((box) => (box.items || []).length > 0)) {
    return 1
  }

  return 2
}

const formatDateYMD = (dateInput = new Date()) => {
  const d = new Date(dateInput)
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split("T")[0]
  return d.toISOString().split("T")[0]
}

const sanitizePostalCode = (value, fallback = "") => {
  const normalized = String(value || "").replace(" ", "")
  return normalized || fallback
}

const sanitizeAlpha = (value, fallback = "") => {
  const normalized = String(value || "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return normalized || fallback
}

const truncate = (value, max) => String(value || "").trim().slice(0, max)

const getSKartCourierId = (serviceData) => {
  const raw = serviceData?.raw || {}
  return String(
    raw.courier_id ??
    raw.courierId ??
    serviceData?.courierId ??
    serviceData?.serviceCode ??
    ""
  ).trim()
}

const getSKartDestinationCountryId = (serviceData, countryDetails = null) => {
  const raw = serviceData?.raw || {}
  return String(
    raw.destination_country_id ??
    raw.destinationCountryId ??
    serviceData?.destinationCountryId ??
    countryDetails?.country_id ??
    ""
  ).trim()
}

/**
 * Pad HSN code to exactly `targetLength` digits with trailing zeros.
 */
const padHsnCode = (hsnCode, targetLength = 10) => {
  const cleaned = String(hsnCode || "").replace(/\D/g, "")
  if (!cleaned) return "0".repeat(targetLength)
  if (cleaned.length >= targetLength) return cleaned.slice(0, targetLength)
  return cleaned.padEnd(targetLength, "0")
}

/**
 * Collect shipment totals across all boxes and items.
 */
const collectShipmentTotals = (awb) => {
  const totalWeight =
    awb.boxes?.reduce(
      (sum, box) => sum + Number.parseFloat(box.actualWeight || 0),
      0
    ) || 0

  const totalValue =
    awb.boxes?.reduce((sum, box) => {
      return (
        sum +
        (box.items?.reduce((itemTotal, item) => {
          return (
            itemTotal + Number(item.price || 0) * Number(item.quantity || 0)
          )
        }, 0) || 0)
      )
    }, 0) || 0

  return { totalWeight, totalValue }
}

const collectDimensions = (boxes = []) =>
  boxes.map((box) => ({
    length: Number(box.length || 0),
    width: Number(box.breadth || box.width || 0),
    height: Number(box.height || 0),
    weight: Number(box.actualWeight || 0),
    units: "cm",
    weight_unit: "kg",
  }))

const extractLabelsFromResponse = (payload) => {
  if (!payload || typeof payload !== "object") return []

  const labels = []
  const keyMap = [
    {
      keys: ["label", "label_pdf", "shipping_label", "label_base64"],
      type: "shipping_label",
      name: "Shipping Label",
    },
    {
      keys: ["awb", "awb_label", "awb_pdf"],
      type: "awb_label",
      name: "AWB Label",
    },
    {
      keys: ["invoice", "invoice_pdf", "commercial_invoice"],
      type: "invoice",
      name: "Invoice",
    },
    {
      keys: ["packing_list", "packing_list_pdf"],
      type: "packing_list",
      name: "Packing List",
    },
  ]

  keyMap.forEach(({ keys, type, name }) => {
    const matchedKey = keys.find(
      (key) => typeof payload[key] === "string" && payload[key].trim()
    )
    if (!matchedKey) return
    labels.push({
      type,
      name,
      filename: `${matchedKey}.pdf`,
      data: payload[matchedKey],
    })
  })

  return labels
}

const extractSkartMetadata = (payload = {}) => {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === null || value === undefined) return acc
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      acc[key] = value
    }
    return acc
  }, {})
}

/**
 * Build the commodity sub-array that goes INSIDE each shipment_dimensions entry.
 * Per API error: shipment_dimensions[0].commodity is required
 *
 * - description: first item name from first box
 * - invoice_value: total shipping value across all boxes/items
 * - hsn_code: raw hsn code of first item of first box (no padding needed here)
 * - quantity: total number of boxes
 * - weight: total weight of all boxes
 */
const buildSKartDimensionCommodity = (awb, totalWeight, totalValue) => {
  const firstBox = awb.boxes?.[0] || {}
  const firstItem = firstBox.items?.[0] || {}
  const totalBoxes = awb.boxes?.length || 1

  return [
    {
      description: truncate(firstItem.name || "Shipment Item", 120),
      invoice_value: Number(totalValue.toFixed(2)),
      hsn_code: String(firstItem.hsnCode || "00000000"),
      quantity: totalBoxes,
      weight: Math.max(Number(totalWeight.toFixed(3)), 0.1),
    },
  ]
}

/**
 * Build SKart shipment_dimensions as a single-entry array.
 * commodity is now NESTED INSIDE each dimension object as required by the API.
 *
 * - item_description: first item name of first box
 * - value: total shipping value
 * - quantity: total number of boxes
 * - weight: total weight of all boxes
 * - length/breadth/height: box 1 dimensions
 * - hsn_code: first item of first box
 * - commodity: array with commodity details (required by API)
 */
const buildSKartShipmentDimensions = (awb, totalWeight, totalValue) => {
  const firstBox = awb.boxes?.[0] || {}
  const firstItem = firstBox.items?.[0] || {}
  const totalBoxes = awb.boxes?.length || 1

  // Build the nested commodity for inside dimensions
  const dimensionCommodity = buildSKartDimensionCommodity(awb, totalWeight, totalValue)

  return [
    {
      item_description: truncate(firstItem.name || "Shipment Item", 120),
      value: Number(totalValue.toFixed(2)),
      quantity: totalBoxes,
      weight: Math.max(Number(totalWeight.toFixed(3)), 0.1),
      length: Math.max(Number(firstBox.length || 0.1), 0.1),
      breadth: Math.max(
        Number(firstBox.breadth || firstBox.width || 0.1),
        0.1
      ),
      height: Math.max(Number(firstBox.height || 0.1), 0.1),
      hsn_code: String(firstItem.hsnCode || "00000000"),
      // commodity is REQUIRED inside each shipment_dimensions entry
      commodity: dimensionCommodity,
    },
  ]
}

/**
 * Build top-level SKart commodity array (also kept at root level for DHL vendors).
 * - description: first item name from first box
 * - invoice_value: total shipping value
 * - hsn_code: raw hsn code of first item
 * - quantity: total number of boxes
 * - weight: total weight of all boxes
 */
const buildSKartCommodity = (awb, totalWeight, totalValue) => {
  const firstBox = awb.boxes?.[0] || {}
  const firstItem = firstBox.items?.[0] || {}
  const totalBoxes = awb.boxes?.length || 1

  return [
    {
      description: truncate(firstItem.name || "Shipment Item", 120),
      invoice_value: Number(totalValue.toFixed(2)),
      hsn_code: String(firstItem.hsnCode || "00000000"),
      quantity: totalBoxes,
      weight: Math.max(Number(totalWeight.toFixed(3)), 0.1),
    },
  ]
}

// Helper to format Date as dd-MMM-yyyy for SkyNet
const formatSkyNetDate = (date) => {
  if (!date) return ""
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""
  const day = String(d.getDate()).padStart(2, "0")
  const month = d.toLocaleString("en-US", { month: "short" })
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

// Send to SkyNet API
async function sendToSkyNet(awb, vendor, serviceData) {
  const creds = vendor.skynetCredentials
  const exportDetails = awb.exportDetails || {}

  let totalActualWeightGrams = 0
  if (awb.parcelType === "Ecommerce") {
    totalActualWeightGrams =
      awb.boxes?.reduce(
        (sum, box) => sum + Number.parseFloat(box.actualWeight || 0),
        0
      ) || 0
  } else {
    const weightInKg =
      awb.boxes?.reduce(
        (sum, box) => sum + Number.parseFloat(box.actualWeight || 0),
        0
      ) || 0
    totalActualWeightGrams = weightInKg * 1000
  }

  const destCountryName = awb.receiver?.country?.trim()
  const destCountryCode = getCountryCode(destCountryName)

  if (!destCountryCode) {
    throw new Error(
      `Country "${destCountryName}" not recognized by ISO-3166-1 alpha 2 standards.`
    )
  }

  let serviceCode = "SNPD"
  if (destCountryCode === "US") serviceCode = "EMS"

  const splitAddress = (addr1, addr2) => {
    const full = (addr1 + " " + (addr2 || "")).trim()
    return {
      line1: full.substring(0, 30),
      line2: full.substring(30, 60),
      line3: full.substring(60, 90),
    }
  }
  const consignorAddr = splitAddress(awb.sender.address, awb.sender.address2)

  const shipmentContentDetails = []
  let calculatedTotalValue = 0

  awb.boxes.forEach((box) => {
    box.items.forEach((item) => {
      const qty = Number(item.quantity) || 1
      const price = Number(item.price) || 0
      calculatedTotalValue += qty * price
      shipmentContentDetails.push({
        ShipmentDescription: item.name.substring(0, 255),
        ContentCode: "C01",
        HSCode: item.hsnCode || exportDetails.consignorIEC || "",
        OriginCountry: "IN",
        UnitPrice: price.toFixed(2),
        Quantity: qty.toString(),
        ContentDescription: item.name.substring(0, 255),
      })
    })
  })

  const today = new Date()
  const bookingDateStr = formatSkyNetDate(today)
  const invoiceDateStr = exportDetails.gstInvoiceDate
    ? formatSkyNetDate(exportDetails.gstInvoiceDate)
    : bookingDateStr

  let csbSelection = "CSB_5"
  if (exportDetails.csbSelection === "CSB IV") csbSelection = "CSB_4"

  const consignorStateCode = getStateCode(
    awb.sender.country || "India",
    awb.sender.state
  )
  const consigneeStateCode = getStateCode(destCountryName, awb.receiver.state)

  const payload = {
    Token: creds.token,
    UserID: creds.userId,
    Password: creds.password,
    Client: creds.client,
    ShipmentOrderID: awb.trackingNumber,
    BookingDate: bookingDateStr,
    ShippingServiceCode: serviceCode,
    DestinationCountry: destCountryCode,
    ConsignorCompany: awb.sender.companyName,
    ConsignorName: awb.sender.name.substring(0, 50),
    ConsignorAddressLine1: consignorAddr.line1,
    ConsignorAddressLine2: consignorAddr.line2,
    ConsignorAddressLine3: consignorAddr.line3,
    ConsignorPostalCode: awb.sender.zip,
    ConsignorCity: awb.sender.city,
    ConsignorState: consignorStateCode,
    ConsignorCountry: "IN",
    ConsignorPhoneNo: cleanPhone(awb.sender.contact),
    ConsignorEmailID: awb.sender.email,
    ConsignorGSTIN: exportDetails.consignorGSTIN || awb.sender.gst || "",
    ConsignorIEC: exportDetails.consignorIEC || "",
    BankADCode: exportDetails.bankADCode || "",
    BankAccount: exportDetails.bankAccount || "",
    BankIFSC: exportDetails.bankIFSC || "",
    ConsigneeCompany: (
      awb.receiver.companyName || awb.receiver.name
    ).substring(0, 100),
    ConsigneeName: awb.receiver.name.substring(0, 50),
    ConsigneeAddressLine1: awb.receiver.address.substring(0, 100),
    ConsigneeAddressLine2: (awb.receiver.address2 || "").substring(0, 100),
    ConsigneePostalCode: awb.receiver.zip,
    ConsigneeCity: awb.receiver.city,
    ConsigneeState: consigneeStateCode || undefined,
    ConsigneeCountry: destCountryCode,
    ConsigneePhoneNo: cleanPhone(awb.receiver.contact),
    ConsigneeEmailID: awb.receiver.email,
    CurrencyCode:
      awb.shippingCurrency === "₹" ? "INR" : awb.shippingCurrency || "INR",
    CSBSelection: csbSelection,
    TermofInvoice: exportDetails.termOfInvoice || "FOB",
    WhetherExportUsingEcommerce: awb.parcelType === "Ecommerce" ? "YES" : "NO",
    WhetherUnderMEISScheme: exportDetails.underMEISScheme ? "YES" : "NO",
    GSTInvoiceNo: exportDetails.gstInvoiceNo || awb.invoiceNumber,
    GSTInvoiceDate: invoiceDateStr,
    WhetherAgainstBondorLUT: exportDetails.againstBondOrLUT ? "1" : "2",
    PlIndicate: exportDetails.igstPaymentStatus ? "1" : "2",
    ShipmentWeight: totalActualWeightGrams.toFixed(0),
    Length: awb.boxes[0]?.length || "10",
    Width: awb.boxes[0]?.breadth || "10",
    Height: awb.boxes[0]?.height || "10",
    Incoterm: "DDU",
    ShipmentContentDetails: shipmentContentDetails,
  }

  console.log("SkyNet Booking Payload:", JSON.stringify(payload, null, 2))

  const endpoint = `${creds.apiUrl}/api/Client/CreateShipment`
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const result = await response.json()
  console.log("SkyNet Booking Response:", result)

  if (result.Status !== "Success" && result.Status !== "SUCCESS") {
    throw new Error(
      result.Message || result.Error || "Failed to create shipment with SkyNet"
    )
  }

  const shipmentOrderId = result.ShipmentOrderID
  const labelBase64 = result.Label
  const labels = []

  if (labelBase64) {
    labels.push({
      type: "shipping_label",
      name: "Shipping Label",
      filename: `SkyNet_${shipmentOrderId}.pdf`,
      data: labelBase64,
    })
  }

  return { awbNumber: shipmentOrderId, labels }
}

// Send to Xpression API
async function sendToXpression(awb, vendor, serviceData) {
  const creds = vendor.xpressionCredentials

  const totalShippingValue = Number.parseFloat(
    awb?.boxes.reduce((acc, box) => {
      return (
        acc +
        box.items.reduce((itemAcc, item) => {
          const itemValue = Number.parseFloat(item.price) || 0
          const itemQuantity = Number.parseInt(item.quantity, 10) || 0
          return itemAcc + itemValue * itemQuantity
        }, 0)
      )
    }, 0)
  )

  const destCountry = awb.receiver?.country?.trim()
  const countryCode = getCountryCode(destCountry)

  if (!countryCode) {
    throw new Error(`Country "${destCountry}" not recognized by ISO-3166-1.`)
  }

  const rawKycType = (awb.sender?.kyc?.type || "").toString().trim()
  const mappedDocumentType = KYC_TYPE_MAP[rawKycType] || null
  const documentNumber =
    (awb.sender?.kyc?.kyc && String(awb.sender.kyc.kyc).trim()) ||
    (awb.sender?.gst && String(awb.sender.gst).trim()) ||
    "00000000000000"
  const documentType =
    mappedDocumentType ||
    (awb.sender?.gst ? "GSTIN (Normal)" : "Aadhaar Number")

  const shipperStateCode = getStateCode(
    awb.sender?.country || "India",
    awb.sender?.state
  )
  const consigneeStateCode = getStateCode(destCountry, awb.receiver?.state)

  const payload = {
    UserID: creds.userId,
    Password: creds.password,
    CustomerCode: creds.customerCode,
    CustomerRefNo: awb.trackingNumber,
    OriginName: creds.originName || "BOM",
    DestinationName: countryCode,
    ShipperName: awb.sender?.name,
    ShipperContact: awb.sender?.name,
    ShipperAdd1: awb.sender?.address,
    ShipperAdd2: awb.sender?.address2 || "-",
    ShipperCity: awb.sender?.city || "-",
    ShipperState: shipperStateCode || "-",
    ShipperPin: awb.sender?.zip,
    ShipperTelno: awb.sender?.contact?.replace(/\D/g, ""),
    ShipperMobile: awb.sender?.contact?.replace(/\D/g, ""),
    ShipperEmail: awb.sender?.email || "info@kargoone.com",
    DocumentType: documentType,
    DocumentNumber: documentNumber,
    ConsigneeName: awb.receiver?.name,
    ConsigneeContact: awb.receiver?.name,
    ConsigneeAdd1: awb.receiver?.address,
    ConsigneeAdd2: awb.receiver?.address2 || "-",
    ConsigneeCity: awb.receiver?.city || "-",
    ConsigneeState: consigneeStateCode || awb.receiver?.state || "-",
    ConsigneePin: awb.receiver?.zip,
    ConsigneeTelno: awb.receiver?.contact?.replace(/\D/g, ""),
    ConsigneeMobile: awb.receiver?.contact?.replace(/\D/g, ""),
    ConsigneeEmail: awb.receiver?.email,
    VendorName: serviceData.vendorCode || "CJ",
    ServiceName: serviceData.serviceName,
    ProductCode: serviceData.productCode || "SPX",
    Dox_Spx: serviceData.productCode || "SPX",
    Pieces: awb.boxes?.length?.toString() || "1",
    Weight:
      awb.boxes
        ?.reduce(
          (sum, box) => sum + Number.parseFloat(box.actualWeight || 0),
          0
        )
        .toFixed(2) || "1.00",
    Content: awb.boxes
      ?.map((box) => box.items?.map((item) => item.name).join(","))
      .join("; "),
    Currency: "INR",
    ShipmentValue: totalShippingValue?.toString(),
    RequiredPerforma: "Y",
    RequiredLable: "Y",
    Dimensions:
      awb.boxes?.map((box) => ({
        ActualWeight: box.actualWeight,
        Vol_WeightL: box.length,
        Vol_WeightW: box.breadth,
        Vol_WeightH: box.height,
      })) || [],
    Performa:
      awb.boxes?.flatMap((box, idx) =>
        box.items?.map((item) => ({
          BoxNo: `Box-${idx + 1}`,
          Description: item.name,
          HSNCode: item.hsnCode,
          Quantity: item.quantity?.toString(),
          Rate: item.price?.toString(),
          Amount: (
            Number.parseFloat(item.price || 0) *
            Number.parseFloat(item.quantity || 1)
          ).toString(),
        }))
      ) || [],
  }

  const response = await fetch(creds.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Xpression API error: ${response.statusText}`)
  }

  const apiResponse = await response.json()
  console.log("Xpression API Response:", apiResponse)

  const responseData = apiResponse.Response || apiResponse

  if (responseData.Status === "Fail") {
    console.error(
      "Xpression API Full Error:",
      JSON.stringify(responseData, null, 2)
    )
    const errorMessage =
      responseData.Error?.[0]?.ErrorMessage ||
      responseData.Error?.[0]?.Message ||
      responseData.APIError ||
      `Xpression Error: ${responseData.Error[0]?.Description || "UNKNOWN"}`
    throw new Error(errorMessage)
  }

  if (
    responseData.ResponseCode !== "RT01" ||
    responseData.Status !== "Success"
  ) {
    throw new Error(
      responseData.Error?.[0]?.ErrorMessage ||
      responseData.APIError ||
      "Failed to generate AWB"
    )
  }

  const labels = []

  if (responseData.Pdfdownload) {
    labels.push({
      type: "awb_label",
      name: "AWB Label",
      filename: "awb_label.pdf",
      data: responseData.Pdfdownload,
    })
  }
  if (responseData.BoxLabel) {
    labels.push({
      type: "box_label",
      name: "Box Label",
      filename: "box_label.pdf",
      data: responseData.BoxLabel,
    })
  }
  if (responseData.Label) {
    labels.push({
      type: "shipping_label",
      name: "Shipping Label",
      filename: "shipping_label.pdf",
      data: responseData.PdfLabel,
    })
  }
  if (responseData.Performa) {
    labels.push({
      type: "performa",
      name: "Performa Invoice",
      filename: "performa_invoice.pdf",
      data: responseData.Performa,
    })
  }
  if (responseData.AuxLbl) {
    labels.push({
      type: "aux_label",
      name: "Auxiliary Label",
      filename: "auxiliary_label.pdf",
      data: responseData.AuxLbl,
    })
  }

  return {
    awbNumber: responseData.AWBNo,
    refNo: responseData.RefNo,
    labels,
  }
}

async function sendToTech440(awb, vendor, serviceData, customSender) {
  const creds = vendor.tech440Credentials
  const sender = customSender || awb.sender

  const authHeader = `Basic ${Buffer.from(
    `${creds.username}:${creds.password}`
  ).toString("base64")}`

  const totalWeight =
    awb.boxes?.reduce(
      (sum, box) => sum + Number(box.actualWeight || 0),
      0
    ) || 1

  const dimensions =
    awb.boxes?.map((box) => ({
      units: "cm",
      length: String(box.length),
      width: String(box.breadth),
      height: String(box.height),
      weightb: String(box.actualWeight),
    })) || []

  const customInvoice = []
  awb.boxes?.forEach((box, boxIdx) => {
    box.items?.forEach((item) => {
      customInvoice.push({
        box_no: String(boxIdx + 1),
        nondg: "0",
        product_name: item.name,
        quantity: String(item.quantity),
        price: String(item.price),
        hsn_code: item.hsnCode || "",
        units: "INR",
        p_weight: "0.000",
      })
    })
  })

  const today = new Date()
  const dd = String(today.getDate()).padStart(2, "0")
  const mm = String(today.getMonth() + 1).padStart(2, "0")
  const yyyy = today.getFullYear()
  const shipDate = `${dd}-${mm}-${yyyy}`

  const senderStateCode = getStateCode(sender.country, sender.state)
  const receiverStateCode = getStateCode(
    awb.receiver.country,
    awb.receiver.state
  )

  const payload = {
    api_key: creds.apiKey,
    label_request: {
      awb_no: awb.trackingNumber,
      ship_date: shipDate,
      package_code: serviceData.packageCode || "NDX",
      to_country: getCountryCode(awb.receiver.country) || "US",
      zipcode_id: "",
      service_code: serviceData.serviceCode,
      branch_name: "DELHI",
      invoice_date: shipDate,
      invoice_currency: "INR",
      invoice_no: awb.invoiceNumber || awb.trackingNumber,
      advanced_options: {
        custom_field1: awb.trackingNumber,
        custom_field2: "",
      },
      ship_to: {
        company: awb.receiver.company || awb.receiver.name,
        name: awb.receiver.name,
        phone: awb.receiver.contact,
        street1: awb.receiver.address?.substring(0, 40) || ".",
        street2: "",
        street3: "",
        city: awb.receiver.city || "City",
        state: receiverStateCode,
        postal_code: awb.receiver.zip,
        country: awb.receiver.country,
      },
      ship_from: {
        company: sender.company || sender.name,
        name: sender.name,
        phone: sender.contact,
        street1: sender.address?.substring(0, 40) || ".",
        street2: "",
        street3: "",
        city: sender.city || "City",
        state: senderStateCode,
        postal_code: sender.zip,
        country: sender.country,
        document_type: sender.kyc?.type || "aadhar no",
        document_no: sender.kyc?.number || "000000000000",
        document: "BASE64_PLACEHOLDER",
      },
      weight: {
        value: String(totalWeight),
        units: "KG",
      },
      dimensions,
      custom_invoice: customInvoice,
    },
  }

  console.log("Tech440 Payload:", JSON.stringify(payload, null, 2))

  const endpoint = `${creds.apiUrl}/labels/create`
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json()
  console.log("Tech440 Response:", result)

  if (!response.ok || result.status !== "success") {
    throw new Error(result.message || "Failed to create label with Tech440")
  }

  const data = result.data || {}
  const labels = []

  if (data.label) {
    labels.push({
      type: "shipping_label",
      name: "Shipping Label",
      filename: "label.pdf",
      data: data.label,
    })
  }
  if (data.awb) {
    labels.push({
      type: "awb_label",
      name: "AWB Copy",
      filename: "awb.pdf",
      data: data.awb,
    })
  }
  if (data.invoice) {
    labels.push({
      type: "invoice",
      name: "Invoice",
      filename: "invoice.pdf",
      data: data.invoice,
    })
  }

  return {
    awbNumber: data.awb_no || awb.trackingNumber,
    labels,
  }
}

async function sendToSKart(awb, vendor, serviceData, customSender, skartKycDocumentLink) {
  const creds = vendor.skartCredentials
  const sender = customSender || awb.sender

  console.log("[SKart] ===== Starting SKart Booking =====")
  console.log("[SKart] Vendor credentials summary:", {
    hasApiKey: !!creds.apiKey,
    hasAuthToken: !!creds.authToken,
    username: creds.username || creds.customerCode || "(none)",
    apiUrl: creds.apiUrl || "(none)",
    bookingApiPath: creds.bookingApiPath || "(none)",
  })

  // Collect totals
  const { totalWeight, totalValue } = collectShipmentTotals(awb)
  console.log(`[SKart] Totals — weight: ${totalWeight} kg, value: ${totalValue}`)

  // Fetch country details
  const countryDetails = await fetchSKartCountryDetails(creds, awb.receiver?.country)

  const bookingType = getSKartBookingType(awb)
  const shipmentType = getSKartShipmentType(awb, serviceData)
  console.log(`[SKart] bookingType: ${bookingType}, shipmentType: ${shipmentType}`)

  const bookingInvoiceDate = formatDateYMD(
    awb.exportDetails?.gstInvoiceDate || awb.date || new Date()
  )
  const consignerDocType = getSKartDocType(sender?.kyc?.type, !!sender?.gst)
  const consigneeDocType = getSKartDocType(awb.receiver?.kyc?.type, false)

  // Build shipment_dimensions with commodity nested inside (API requirement)
  const shipmentDimensions = buildSKartShipmentDimensions(awb, totalWeight, totalValue)

  // Build top-level commodity array (also required for DHL vendors)
  const commodity = buildSKartCommodity(awb, totalWeight, totalValue)

  console.log(
    "[SKart] shipmentDimensions (with nested commodity):",
    JSON.stringify(shipmentDimensions, null, 2)
  )
  console.log("[SKart] top-level commodity:", JSON.stringify(commodity, null, 2))

  const courierId = getSKartCourierId(serviceData)
  const destinationCountryId = getSKartDestinationCountryId(serviceData, countryDetails)
  const documentLink = skartKycDocumentLink || sender?.kyc?.document || ""
  const rawRate = serviceData?.raw || {}

  console.log(
    `[SKart] courierId: "${courierId}", destinationCountryId: "${destinationCountryId}"`
  )
  console.log(`[SKart] documentLink: "${documentLink}"`)

  if (!courierId) {
    throw new Error(
      "SKart courier_id is missing. Please fetch rates and select a service again."
    )
  }

  if (!destinationCountryId) {
    throw new Error(
      "SKart destination_country_id is missing. Please fetch rates and select a service again."
    )
  }

  const payload = {
    user_name: creds.username || creds.customerCode || "",
    password: creds.password || "",
    origin_pincode: sanitizePostalCode(sender?.zip),
    destination_pincode: sanitizePostalCode(awb.receiver?.zip, "00000"),
    booking_type: bookingType,
    destination_country_id: destinationCountryId,
    shipment_type: shipmentType,
    unit: {
      weight_unit: "kg",
      length_unit: "cm",
      currency: 24,
    },
    courier_id: 156,
    consigner_first_name: truncate(
      sender?.name || sender?.companyName || "Consigner",
      80
    ),
    consigner_company_name: truncate(
      sender?.companyName || sender?.company || sender?.name || "Consigner",
      120
    ),
    consigner_mobile_number: "+" + cleanPhone(sender?.contact || ""),
    consigner_email_id: sender?.email || "yourship.sunexpress@gmail.com",
    consigner_address_1: truncate(sender?.address || "-", 120),
    consigner_address_2: truncate(
      sender?.address2 || sender?.address || "-",
      120
    ),
    consigner_city: truncate(sender?.city || "Mumbai", 60),
    consigner_pincode: sanitizePostalCode(sender?.zip),
    consigner_state: truncate(sender?.state || "Maharashtra", 60),
    consigner_doc_type: consignerDocType,
    consignee_first_name: truncate(
      awb.receiver?.name || awb.receiver?.companyName || "Consignee",
      80
    ),
    consignee_company_name: truncate(
      awb.receiver?.companyName ||
      awb.receiver?.company ||
      awb.receiver?.name ||
      "Consignee",
      120
    ),
    consignee_mobile_number: "+" + cleanPhone(awb.receiver?.contact || ""),
    consignee_email_id: awb.receiver?.email || "yourship.sunexpress@gmail.com",
    consignee_address_1: truncate(awb.receiver?.address || "-", 120),
    consignee_address_2: truncate(
      awb.receiver?.address2 || awb.receiver?.address || "-",
      120
    ),
    booking_invoice_number: awb.invoiceNumber || awb.trackingNumber,
    booking_invoice_date: bookingInvoiceDate,
    consignee_gst_number: "27ABPCS6262F1ZX",
    consigner_gst_number: "27ABPCS6262F1ZX",
    consigner_gst_applicable: sender?.gst ? 1 : 2,
    consigner_tax_payment: 3,
    pickup_required: 2,
    city: sanitizeAlpha(awb.receiver?.city, "City"),
    shipper_type: 1,
    otp: "",
    kyc_info: {
      orgnization_id: 1,
      document_id_1: 7,
      document_path_1: documentLink,
      document_id_2: 7,
      document_path_2: documentLink,
    },
    commodity_code:
      padHsnCode(awb.boxes?.[0]?.items?.[0]?.hsnCode, 10) || "0000000000",
    shipment_purpose: 1,
    unit_currency: 24,
    // Top-level commodity array (for DHL and other vendors that require it)
    commodity,
  }

  // Shipment type 1 = Non-Document (use dimensions), 2 = Document (use weight + description)
  if (shipmentType === 2) {
    payload.weight = Number(totalWeight.toFixed(3))
    payload.description = truncate(
      awb.boxes
        ?.flatMap((box) => (box.items || []).map((item) => item.name))
        .filter(Boolean)
        .join(", ") || "Documents",
      240
    )
  } else {
    // shipment_dimensions has commodity nested inside each entry (API requirement)
    payload.shipment_dimensions = shipmentDimensions
  }

  // Export type fields (booking_type 1 = export/international)
  if (bookingType === 1) {
    payload.booking_invoice_number = awb.invoiceNumber || awb.trackingNumber
    payload.tax_amount = Number(awb?.parcelValue?.toFixed(2) || 0)
    payload.export_type = 3
    payload.tax_paid = 2
    payload.consignee_reference_no = awb.trackingNumber
  }

  // Optional courier-specific fields from raw rate
  if (
    rawRate.consignee_doc_type !== undefined ||
    rawRate.delivery_instructions !== undefined
  ) {
    if (rawRate.consignee_doc_type !== undefined) {
      payload.consignee_doc_type = rawRate.consignee_doc_type
    } else if (String(courierId) === "155") {
      payload.consignee_doc_type = consigneeDocType
    }
    if (rawRate.delivery_instructions !== undefined) {
      payload.delivery_instructions = rawRate.delivery_instructions
    } else if (String(courierId) === "155") {
      payload.delivery_instructions = "Handle with care"
    }
  }

  if (
    rawRate.consignee_gst_number !== undefined ||
    String(courierId) === "155"
  ) {
    payload.consignee_gst_number =
      awb.receiver?.gst || awb.receiver?.kyc?.kyc || ""
  }

  if (rawRate.consignee_state_code !== undefined || !awb.receiver?.zip) {
    payload.consignee_state_code = sanitizeAlpha(awb.receiver?.state, "NA")
  }

  if (
    documentLink &&
    rawRate.orgnization_id &&
    rawRate.document_id_1 &&
    rawRate.document_id_2
  ) {
    payload.kyc_info = {
      orgnization_id: rawRate.orgnization_id,
      document_id_1: rawRate.document_id_1,
      document_path_1: documentLink,
      document_id_2: rawRate.document_id_2,
      document_path_2: documentLink,
    }
  }

  if (rawRate.commodity_code !== undefined) {
    payload.commodity_code = rawRate.commodity_code
  }
  if (rawRate.shipment_purpose !== undefined) {
    payload.shipment_purpose = rawRate.shipment_purpose
  }
  if (rawRate.incoterm !== undefined) {
    payload.incoterm = rawRate.incoterm
  }
  if (rawRate.vat_number !== undefined) {
    payload.vat_number = rawRate.vat_number
  }
  if (rawRate.ioss_number !== undefined) {
    payload.ioss_number = rawRate.ioss_number
  }
  if (rawRate.consignor_id !== undefined) {
    payload.consignor_id = rawRate.consignor_id
  }
  if (rawRate.manufacturer_id !== undefined) {
    payload.manufacturer_id = rawRate.manufacturer_id
  }

  // Resolve endpoint
  const endpoint =
    "https://devapiv2.skart-express.com/api/v1/booking/booking-api"

  console.log("[SKart] Booking endpoint:", endpoint)
  console.log("[SKart] Booking Payload:", JSON.stringify(payload, null, 2))

  let response
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: buildSKartHeaders(creds),
      body: JSON.stringify(payload),
    })
  } catch (networkError) {
    console.error(
      "[SKart] Network error while calling booking API:",
      networkError
    )
    throw new Error(
      `SKart booking API network error: ${networkError.message}. Endpoint: ${endpoint}`
    )
  }

  // Use safe parser to handle HTML error pages
  const parsed = await safeParseJson(response)

  if (!parsed.ok) {
    console.error("[SKart] Booking API returned non-JSON or error:")
    console.error(`  Status: ${parsed.status}`)
    console.error(`  Error: ${parsed.error}`)
    console.error(
      `  Raw response (first 1000 chars): ${(parsed.rawText || "").substring(0, 1000)}`
    )
    throw new Error(
      `SKart booking failed (HTTP ${parsed.status}): ${parsed.error}`
    )
  }

  const result = parsed.data
  console.log("[SKart] Booking Response:", JSON.stringify(result, null, 2))

  // Check for API-level error in the JSON body
  if (!response.ok || result?.success === false || result?.status === false) {
    const apiErrorMsg =
      result?.message ||
      result?.error ||
      result?.errors?.join(", ") ||
      "Failed to create shipment with SKart"
    console.error("[SKart] Booking API returned error in body:", apiErrorMsg)
    throw new Error(`SKart booking error: ${apiErrorMsg}`)
  }

  const data = result?.data || result?.result || result
  const labels = extractLabelsFromResponse(data)
  const awbNumber =
    data?.awb_no ||
    data?.awbNumber ||
    data?.tracking_no ||
    data?.trackingNumber ||
    data?.consignment_no ||
    data?.consignmentNumber ||
    awb.trackingNumber

  console.log(`[SKart] ✅ Booking successful. AWB: ${awbNumber}`)
  console.log(`[SKart] Labels extracted: ${labels.length}`)

  return {
    awbNumber,
    labels,
    metadata: extractSkartMetadata(data),
    rawResponse: data,
  }
}

const getM5CKycType = (kycType, kycNo = "", gstNo = "") => {
  if (gstNo) return "GSTIN (Normal)"
  const mapped = KYC_TYPE_MAP[kycType] || kycType || "PAN Number"
  const normalizedNo = String(kycNo || "").trim().toUpperCase()

  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalizedNo)) return "PAN Number"
  if (mapped === "PAN Number") return "PAN Number"
  if (mapped === "Passport Number") return "Passport Number"
  if (mapped === "Voter Id") return "Voter Id"
  if (mapped === "GSTIN (Normal)") return "GSTIN (Normal)"
  return "PAN Number"
}

const getM5CCountryName = (country) => {
  const code = getCountryCode(country)
  if (code === "US") return "USA"
  if (code === "GB") return "UK"
  return String(country || "").trim().toUpperCase()
}

const getM5CServiceCode = (serviceData = {}) =>
  String(
    serviceData.serviceCode ||
    serviceData.apiServiceCode ||
    serviceData.productCode ||
    serviceData.code ||
    ""
  ).trim()

const getM5CKycNo = (sender = {}) => {
  const gst = String(sender?.gst || "").trim().toUpperCase()
  if (gst) return gst

  const rawKyc = String(
    sender?.kyc?.kyc ||
    sender?.kyc?.number ||
    sender?.kycNo ||
    ""
  ).trim().toUpperCase()

  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(rawKyc)) return rawKyc

  // M5C docs do not list Aadhaar as an accepted KYC type. Avoid sending a
  // mismatched PAN type with a 12-digit Aadhaar number.
  return "AAAAA0000A"
}

const sanitizeM5CPostalCode = (value, countryName = "") => {
  const countryCode = getCountryCode(countryName)
  const normalized = String(value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

  if (countryCode === "CA" && normalized.length === 6) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3)}`
  }

  return normalized || "00000"
}

const redactM5CPayload = (payload = {}) => ({
  ...payload,
  Password: payload.Password ? "***" : payload.Password,
  ValidateAccount: Array.isArray(payload.ValidateAccount)
    ? payload.ValidateAccount.map((account) => ({
      ...account,
      Password: account.Password ? "***" : account.Password,
      AccessKey: account.AccessKey ? "***" : account.AccessKey,
    }))
    : payload.ValidateAccount,
})

const buildM5CDescriptions = (awb) => {
  const descriptions = []

    ; (awb.boxes || []).forEach((box, boxIndex) => {
      const items = box.items?.length
        ? box.items
        : [{ name: awb.parcelType === "Document" ? "Documents" : "Shipment Item", quantity: 1, price: 0 }]

      items.forEach((item) => {
        const qty = Number(item.quantity || 1)
        const rate = Number(item.price || 0)
        descriptions.push({
          Box: boxIndex + 1,
          Content: truncate(item.name || "Shipment Item", 150),
          HSNCode: truncate(item.hsnCode || "00000000", 8),
          Qty: qty,
          Rate: rate,
          Amt: Number((qty * rate).toFixed(2)),
        })
      })
    })

  return descriptions.length
    ? descriptions
    : [
      {
        Box: 1,
        Content: "Shipment Item",
        HSNCode: "00000000",
        Qty: 1,
        Rate: 0,
        Amt: 0,
      },
    ]
}

async function sendToM5C(awb, vendor, serviceData, customSender) {
  const creds = vendor.m5cCredentials
  const sender = customSender || awb.sender
  const { totalWeight, totalValue } = collectShipmentTotals(awb)
  const descriptions = buildM5CDescriptions(awb)
  const firstDescription = descriptions[0]?.Content || "Shipment Item"
  const serviceCode = getM5CServiceCode(serviceData)
  const senderKycNo = getM5CKycNo(sender)

  if (!serviceCode) {
    throw new Error("M5C service code is missing. Please select an M5C service.")
  }

  const volWeights = (awb.boxes?.length ? awb.boxes : [{}]).map((box) => ({
    Length: String(Number(box.length || 0)),
    Width: String(Number(box.breadth || box.width || 0)),
    Height: String(Number(box.height || 0)),
    Pcs: String(Number(box.pcs || 1)),
    PcsWt: String(Number(box.actualWeight || totalWeight || 0.1)),  // ✅ PcsWt not PcsWeight
  }))

  const shipment = {
    ReferenceNumber: awb.trackingNumber,
    ThirdPartyLabel: !!serviceData.thirdPartyLabel,
    ConsignorName: truncate(sender?.name || sender?.companyName || "Consignor", 35),
    ConsignorAddressLine1: truncate(sender?.address || "-", 35),
    ConsignorAddressLine2: truncate(sender?.address2 || "", 35),
    ConsignorCity: truncate(sender?.city || "City", 35),
    ConsignorPostCode: truncate(sanitizeM5CPostalCode(sender?.zip, sender?.country), 7),
    ConsignorState: truncate(sender?.state || "State", 35),
    ConsignorPhoneNo: truncate(cleanPhone(sender?.contact), 25),
    // ✅ Use GSTType/GSTIN instead of KYCType/KYCNo
    GSTType: getM5CKycType(sender?.kyc?.type, senderKycNo, sender?.gst),
    GSTIN: truncate(senderKycNo, 20),
    ConsigneeName: truncate(awb.receiver?.name || awb.receiver?.companyName || "Consignee", 35),
    ConsigneeContactPerson: truncate(awb.receiver?.name || "Consignee", 35),
    ConsigneeAddressLine1: truncate(awb.receiver?.address || "-", 35),
    ConsigneeAddressLine2: truncate(awb.receiver?.address2 || "", 35),
    ConsigneeCity: truncate(awb.receiver?.city || "City", 30),
    ConsigneeZipCode: truncate(
      sanitizeM5CPostalCode(awb.receiver?.zip, awb.receiver?.country),
      10
    ),
    ConsigneeState: truncate(getStateCode(awb.receiver?.country, awb.receiver?.state), 2),
    ConsigneePhoneNo: truncate(cleanPhone(awb.receiver?.contact), 12),
    ConsigneeCountry: getM5CCountryName(awb.receiver?.country),
    // ✅ Removed: DestinationCountry, ConsignorCountry (not in sample)
    ServiceCode: truncate(serviceCode, 4),
    GoodsDesc:
      serviceData.goodsDesc ||
      (awb.parcelType === "Document" ? "Dox" : "NDox"),
    NumofItems: String(awb.boxes?.length || 1),       // ✅ String as per sample
    ActWeight: String(Number(Math.max(totalWeight || 0.1, 0.1).toFixed(3))),  // ✅ String
    VolWeights: volWeights,
    CustomsValue: String(Number(Math.max(totalValue || 0, 0).toFixed(2))),    // ✅ String
    CustomsCurrencyCode:
      awb.exportDetails?.currency ||
      awb.currency ||
      serviceData.currency ||
      "USD",
    Handling: serviceData.handling || "N",
    CSB: serviceData.csb || "N",
    Descriptions: descriptions,
    ShipmentContent: truncate(firstDescription, 60),
  }

  // ✅ Correct top-level structure: ValidateAccount + Shipment array
  const payload = {
    ValidateAccount: [
      {
        AccountCode: creds.accountCode,
        Username: creds.username,
        Password: creds.password,
        AccessKey: creds.accessKey || "",
      },
    ],
    Shipment: [shipment],
  }

  const endpoint = joinUrl(creds.apiUrl, "/api/Shipping/AddShipment")
  console.log("[M5C] Booking endpoint:", endpoint)
  console.log(
    "[M5C] Booking Payload:",
    JSON.stringify(redactM5CPayload(payload), null, 2)
  )

  // ✅ No Authorization header - credentials are inside the payload
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json().catch(() => ({}))
  console.log("[M5C] Booking Response:", JSON.stringify(result, null, 2))

  if (result.ExceptionMessage || result.Message === "An error has occurred.") {
    throw new Error(
      `M5C booking failed: ${result.ExceptionMessage ||
      result.Message ||
      "M5C returned an internal server error"
      }`
    )
  }

  const shipmentResponse =
    result.ShipmentResponses?.[0] ||
    result.shipmentResponses?.[0] ||
    result.Response?.ShipmentResponses?.[0] ||
    result

  const details =
    shipmentResponse.shipmentDetails?.[0] ||
    shipmentResponse.ShipmentDetails?.[0] ||
    shipmentResponse.shipmentDetail?.[0] ||
    {}

  const successCode = String(
    shipmentResponse.Code || shipmentResponse.code || shipmentResponse.ErrorCode || ""
  )
  const status = String(shipmentResponse.Status || shipmentResponse.status || "")

  if (!response.ok || (successCode && successCode !== "100") || /fail|error/i.test(status)) {
    throw new Error(
      shipmentResponse.Description ||
      shipmentResponse.description ||
      result.ErrorDescription ||
      result.message ||
      `M5C booking failed with HTTP ${response.status}`
    )
  }

  const pdfBase64 =
    details.PDFBase64 ||
    details.PdfBase64 ||
    details.pdfBase64 ||
    shipmentResponse.PDFBase64 ||
    ""

  const labels = pdfBase64
    ? [
      {
        type: "shipping_label",
        name: "M5C Shipping Label",
        filename: "m5c_shipping_label.pdf",
        data: pdfBase64,
      },
    ]
    : []

  return {
    awbNumber:
      details.AwbNo ||
      details.AWBNo ||
      details.awbNo ||
      details.Tracking ||
      details.tracking ||
      awb.trackingNumber,
    labels,
    metadata: {
      service: details.Service || details.service,
      forwarder: details.Forwarder || details.forwarder,
      tracking: details.Tracking || details.tracking,
      trackingNo2: details["Tracking No 2"] || details.TrackingNo2,
      amount: details.Amount || details.amount,
    },
    rawResponse: result,
  }
}

export async function POST(request) {
  try {
    await connectToDB()

    const {
      awbId,
      vendorId,
      serviceData,
      productCode,
      customSenderDetails,
      skartKycDocumentLink,
    } = await request.json()

    if (!awbId || !vendorId || !serviceData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AWB ID, Vendor ID, and Service data are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const awb = await Awb.findById(awbId)
    if (!awb) {
      return new Response(
        JSON.stringify({ success: false, error: "AWB not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    if (awb.cNoteNumber && awb.cNoteVendorName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AWB already integrated with another vendor",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const vendor = await VendorIntegration.findById(vendorId)
    if (!vendor) {
      return new Response(
        JSON.stringify({ success: false, error: "Vendor not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!vendor.isActive) {
      return new Response(
        JSON.stringify({ success: false, error: "Vendor is not active" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    let result

    if (vendor.softwareType === "xpression") {
      result = await sendToXpression(awb, vendor, {
        ...serviceData,
        productCode: productCode || serviceData.productCode || "SPX",
      })
    } else if (vendor.softwareType === "itd") {
      result = await sendToITD(awb, vendor, {
        ...serviceData,
        productCode: productCode || "NONDOX",
      })
    } else if (vendor.softwareType === "tech440") {
      const selectedService = vendor.tech440Credentials.services.find(
        (s) => s.serviceName === serviceData.serviceName
      )
      result = await sendToTech440(
        awb,
        vendor,
        {
          serviceCode: selectedService?.serviceCode || "TP05",
          packageCode: selectedService?.packageCode || productCode || "NDX",
        },
        customSenderDetails
      )
    } else if (vendor.softwareType === "skynet") {
      result = await sendToSkyNet(awb, vendor, serviceData)
    } else if (vendor.softwareType === "skart") {
      result = await sendToSKart(
        awb,
        vendor,
        serviceData,
        customSenderDetails,
        skartKycDocumentLink
      )
    } else if (vendor.softwareType === "m5c") {
      result = await sendToM5C(
        awb,
        vendor,
        serviceData,
        customSenderDetails
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unknown software type: ${vendor.softwareType}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    awb.cNoteNumber = result.awbNumber
    awb.cNoteVendorName = vendor.vendorName
    awb.integratedVendorId = vendor._id
    awb.integratedService = serviceData.serviceName

    await awb.save()

    await VendorIntegration.findByIdAndUpdate(vendorId, {
      $inc: { usageCount: 1 },
      lastUsedAt: new Date(),
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `AWB successfully sent to ${vendor.vendorName}`,
        awbNumber: result.awbNumber,
        vendorName: vendor.vendorName,
        serviceName: serviceData.serviceName,
        softwareType: vendor.softwareType,
        labels: result.labels,
        metadata: result.metadata || {},
        rawResponse: result.rawResponse || null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("❌ Error in unified send-awb:", error.message)
    console.error(error.stack)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send AWB",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}