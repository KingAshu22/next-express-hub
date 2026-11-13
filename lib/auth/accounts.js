// lib/auth/accounts.js
// Login / session-refresh logic shared by the sign-in and refresh routes.
import { NextResponse } from "next/server"
import { connectToDB } from "@/app/_utils/mongodb"
import Admin from "@/models/Admin"
import Client from "@/models/Client"
import Franchise from "@/models/Franchise"
import { ROLES } from "./config"
import { verifyPassword, hashPassword } from "./password"
import { setAuthCookies, publicRateLimit, tooManyRequests, jsonError } from "./server"
import { rateLimit, isRateLimited, getClientIp } from "./rate-limit"

export const ACCOUNT_TYPES = ["admin", "franchise", "client"]

export const roleForFranchise = (franchise) => {
  switch (franchise?.isBranch) {
    case "Yes":
      return ROLES.BRANCH
    case "customerService":
      return ROLES.CUSTOMER_SERVICE
    case "pickup":
      return ROLES.PICKUP
    default:
      return ROLES.FRANCHISE
  }
}

const modelFor = (accountType) =>
  accountType === "admin" ? Admin : accountType === "client" ? Client : Franchise

const accountTypeForRole = (role) =>
  role === ROLES.ADMIN ? "admin" : role === ROLES.CLIENT ? "client" : "franchise"

const toSessionUser = (accountType, doc) => {
  if (accountType === "admin") {
    return { id: doc._id, role: ROLES.ADMIN, code: "admin", name: doc.name || "Admin", ver: doc.tokenVersion || 0 }
  }
  if (accountType === "client") {
    return {
      id: doc._id,
      role: ROLES.CLIENT,
      code: doc.code,
      name: doc.companyName || doc.name,
      ver: doc.tokenVersion || 0,
    }
  }
  return { id: doc._id, role: roleForFranchise(doc), code: doc.code, name: doc.name, ver: doc.tokenVersion || 0 }
}

// What the browser gets back after login - display info only.
export const publicProfile = (user) => ({
  id: String(user.id),
  name: user.name,
  role: user.role,
  code: user.role === ROLES.ADMIN ? "" : user.code,
})

/**
 * Checks email + password for the given account type.
 * Returns the session user, or null when the credentials are wrong.
 */
export async function authenticate(accountType, email, password) {
  await connectToDB()
  // String() blocks NoSQL injection such as {"email": {"$ne": null}}
  const cleanEmail = String(email || "").trim()
  const cleanPassword = String(password || "")
  if (!cleanEmail || !cleanPassword) return null

  const Model = modelFor(accountType)
  const doc = await Model.findOne({
    email: { $regex: `^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  }).select("+password")

  const { ok, needsUpgrade } = await verifyPassword(cleanPassword, doc?.password)
  if (!doc || !ok) return null

  if (needsUpgrade) {
    // Replace the stored plain-text password with a bcrypt hash (no session reset)
    await Model.collection.updateOne({ _id: doc._id }, { $set: { password: await hashPassword(cleanPassword) } })
  }

  return toSessionUser(accountType, doc)
}

/** Shared handler for /api/admin-signin, /api/franchise-signin, /api/client-signin */
export async function handleSignIn(req, accountType) {
  let body
  try {
    body = await req.json()
  } catch {
    return jsonError(400, "Invalid request")
  }
  const email = String(body?.email || "").trim().toLowerCase()

  // Brute-force protection. Only FAILED attempts count, so many staff signing in
  // from the same office connection (or sharing one login) are never blocked.
  const ipKey = `login-fail-ip:${getClientIp(req)}`
  const accountKey = `login-fail-account:${accountType}:${email}`
  const WINDOW = 15 * 60_000
  if (isRateLimited(ipKey, 30) || isRateLimited(accountKey, 10)) return tooManyRequests(15 * 60)

  const user = await authenticate(accountType, email, body?.password)
  if (!user) {
    rateLimit(ipKey, { limit: 30, windowMs: WINDOW })
    rateLimit(accountKey, { limit: 10, windowMs: WINDOW })
    // Same message for wrong email and wrong password (no account enumeration)
    return jsonError(401, "Incorrect email or password", "INVALID_CREDENTIALS")
  }

  const response = NextResponse.json({ success: true, user: publicProfile(user) })
  return setAuthCookies(response, user)
}

/** Loads the account behind a refresh-token session and checks it was not revoked. */
export async function loadActiveAccount(session) {
  await connectToDB()
  const accountType = accountTypeForRole(session.role)
  const doc = await modelFor(accountType).findById(session.id).select("+tokenVersion")
  if (!doc) return null
  if ((doc.tokenVersion || 0) !== (session.ver || 0)) return null // logged out / password changed
  return { accountType, doc, user: toSessionUser(accountType, doc) }
}
