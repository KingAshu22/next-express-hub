// lib/security/sanitize.js
// Decides WHICH FIELDS leave the server. Every API response that contains
// shipments, franchises or clients goes through one of these functions so the
// browser network tab only ever shows what that screen actually needs.
import { isInternalRole, ROLES } from "@/lib/auth/config"

const toPlain = (doc) => {
  if (!doc) return doc
  if (typeof doc.toObject === "function") return doc.toObject({ depopulate: true, versionKey: false })
  return JSON.parse(JSON.stringify(doc))
}

const deletePath = (obj, path) => {
  const parts = path.split(".")
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur || typeof cur !== "object") return
    cur = cur[parts[i]]
  }
  if (cur && typeof cur === "object") delete cur[parts[parts.length - 1]]
}

// ---------------------------------------------------------------------------
// Shipments (Awb)
// ---------------------------------------------------------------------------

// Vendor / cost data that franchises and clients must never receive.
export const AWB_INTERNAL_ONLY_FIELDS = [
  "cNoteNumber",
  "cNoteVendorName",
  "awbNumber", // vendor's own AWB number
  "integratedVendorId",
  "integratedService",
  "vendorBoxes",
  "rateInfo.courier",
  "financials.purchase",
  "financials.internalCosts",
  "financials.netProfit",
  "financials.notes",
  "financials.sales.companyName", // holds the rate-sheet vendor name
  "__v",
]

// Same list as a Mongo projection, so the data is not even loaded.
export const AWB_EXTERNAL_PROJECTION = AWB_INTERNAL_ONLY_FIELDS.filter((f) => f !== "__v")
  .map((f) => `-${f}`)
  .join(" ")

export function sanitizeAwb(doc, session) {
  if (!doc) return doc
  const awb = toPlain(doc)
  if (isInternalRole(session?.role)) return awb
  for (const field of AWB_INTERNAL_ONLY_FIELDS) deletePath(awb, field)
  return awb
}

export const sanitizeAwbs = (docs, session) => (docs || []).map((d) => sanitizeAwb(d, session))

/**
 * Fields a franchise / client may NOT set or change on a booking, whatever
 * they send in the request body.
 */
export const AWB_EXTERNAL_WRITE_BLOCKLIST = [
  ...AWB_INTERNAL_ONLY_FIELDS,
  "_id",
  "refCode",
  "staffId",
  "trackingNumber",
  "invoiceNumber",
  "forwardingNumber",
  "forwardingLink",
  "parcelStatus",
  "isBilled",
  "billNumber",
  "billedAt",
  "financials.payments",
]

export function stripBlockedAwbFields(body) {
  const clean = JSON.parse(JSON.stringify(body || {}))
  for (const field of AWB_EXTERNAL_WRITE_BLOCKLIST) deletePath(clean, field)
  // Block Mongo operators smuggled in the body ($set, $unset, ...)
  for (const key of Object.keys(clean)) if (key.startsWith("$")) delete clean[key]
  return clean
}

// Name + postal address only: no phone, email, KYC or GST.
const publicParty = (p = {}) => ({
  name: p.name || "",
  companyName: p.companyName || "",
  address: p.address || "",
  address2: p.address2 || "",
  city: p.city || "",
  state: p.state || "",
  zip: p.zip || "",
  country: p.country || "",
})

/**
 * Public view for the website's "Track your parcel" page.
 * Sender / receiver name and postal address are shown; phones, emails, KYC,
 * boxes, money and vendor / C-Note details are never included.
 */
export function publicTrackingView(awb, timeline) {
  return {
    trackingNumber: awb.trackingNumber,
    bookingDate: awb.date || null,
    sender: publicParty(awb.sender),
    receiver: publicParty(awb.receiver),
    forwardingNumber: awb.forwardingNumber || null,
    forwardingLink: awb.forwardingLink || null,
    timeline,
  }
}

// ---------------------------------------------------------------------------
// Franchises
// ---------------------------------------------------------------------------

const FRANCHISE_SECRET_FIELDS = ["password", "tokenVersion", "__v"]
const FRANCHISE_ADMIN_ONLY_FIELDS = [
  "panNo",
  "aadhaarNo",
  "bankAccountName",
  "bankAccountNumber",
  "bankIfscCode",
  "rateSheets",
]
// What a client may know about the franchise it belongs to (letterhead + markup)
const FRANCHISE_PUBLIC_FIELDS = ["_id", "code", "name", "firmName", "email", "contact", "address", "gstNo", "rates"]

export function sanitizeFranchise(doc, session) {
  if (!doc) return doc
  const f = toPlain(doc)
  for (const field of FRANCHISE_SECRET_FIELDS) delete f[field]
  if (session?.role === ROLES.ADMIN) return f
  if (session?.role === ROLES.CLIENT) {
    return Object.fromEntries(FRANCHISE_PUBLIC_FIELDS.filter((k) => k in f).map((k) => [k, f[k]]))
  }
  // Other staff and the franchise itself: no bank / identity documents.
  // (A franchise viewing itself keeps its own rate sheets.)
  for (const field of FRANCHISE_ADMIN_ONLY_FIELDS) {
    if (field === "rateSheets" && session?.role === ROLES.FRANCHISE && f.code === session.code) continue
    delete f[field]
  }
  return f
}

export const sanitizeFranchises = (docs, session) => (docs || []).map((d) => sanitizeFranchise(d, session))

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export function sanitizeClient(doc) {
  if (!doc) return doc
  const c = toPlain(doc)
  delete c.password
  delete c.tokenVersion
  delete c.__v
  return c
}

export const sanitizeClients = (docs) => (docs || []).map((d) => sanitizeClient(d))

// Lists that only need a code + name (dropdowns, table look-ups)
export const toDirectoryEntry = (doc) => {
  const d = toPlain(doc)
  return { _id: d._id, code: d.code, name: d.name, companyName: d.companyName, firmName: d.firmName, owner: d.owner }
}

// ---------------------------------------------------------------------------
// Rates
// ---------------------------------------------------------------------------

// Rate-calculation output fields that reveal vendors / purchase sheets.
const RATE_INTERNAL_FIELDS = ["vendorName", "ratePurchaseId", "purchaseRateId", "refCode", "rateStatus", "assignedTo"]

export function sanitizeRateResult(result, session) {
  if (!result || isInternalRole(session?.role)) return result
  const r = { ...result }
  for (const f of RATE_INTERNAL_FIELDS) delete r[f]
  return r
}
