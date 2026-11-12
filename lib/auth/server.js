// lib/auth/server.js
// Server-side session handling for API route handlers.
//
// Identity comes ONLY from the signed, HttpOnly access-token cookie (or an
// "Authorization: Bearer <access token>" header). Request headers such as
// `userType` / `userId` sent by the browser are ignored everywhere.
import { NextResponse } from "next/server"
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
  ROLES,
  isExternalRole,
  isInternalRole,
} from "./config"
import { signAccessToken, signRefreshToken, verifyAccessToken } from "./tokens"
import { rateLimit, getClientIp } from "./rate-limit"

const isProd = process.env.NODE_ENV === "production"

const readCookie = (req, name) => {
  if (req.cookies?.get) return req.cookies.get(name)?.value || null
  const raw = req.headers.get("cookie") || ""
  const match = raw.split(/;\s*/).find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

const readBearer = (req) => {
  const header = req.headers.get("authorization") || ""
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null
}

/** @returns {Promise<{session?: object, error?: string}>} */
export async function getSession(req) {
  const token = readCookie(req, ACCESS_COOKIE) || readBearer(req)
  return verifyAccessToken(token)
}

export const jsonError = (status, error, code) =>
  NextResponse.json({ success: false, error, ...(code ? { code } : {}) }, { status })

export const unauthorized = (code = "UNAUTHENTICATED") =>
  jsonError(401, code === "TOKEN_EXPIRED" ? "Session expired" : "Please sign in to continue", code)

export const forbidden = (message = "You do not have access to this resource") =>
  jsonError(403, message, "FORBIDDEN")

export const notFound = (message = "Not found") => jsonError(404, message, "NOT_FOUND")

export const tooManyRequests = (retryAfter) =>
  NextResponse.json(
    { success: false, error: "Too many requests. Please slow down and try again shortly.", code: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(retryAfter || 60) } }
  )

/**
 * Wraps a route handler so it only runs for a signed-in user with an allowed role.
 *
 *   export const GET = withAuth(async (req, ctx, session) => { ... }, { roles: ADMIN_ONLY })
 *
 * Every authenticated user is also rate limited (default 300 requests / minute),
 * which is far above normal use but stops bulk scraping.
 */
export function withAuth(handler, { roles, rateLimitPerMinute = 300 } = {}) {
  return async (req, ctx) => {
    const { session, error } = await getSession(req)
    if (!session) return unauthorized(error === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "UNAUTHENTICATED")
    if (roles && !roles.includes(session.role)) return forbidden()

    // Staff screens (MIS, bulk updates) legitimately make many calls; partners don't.
    const perMinute = isInternalRole(session.role) ? rateLimitPerMinute * 5 : rateLimitPerMinute
    const limit = rateLimit(`user:${session.id}`, { limit: perMinute, windowMs: 60_000 })
    if (!limit.ok) return tooManyRequests(limit.retryAfter)

    try {
      return await handler(req, ctx, session)
    } catch (err) {
      console.error(`[API] ${req.method} ${new URL(req.url).pathname} failed:`, err)
      // Never leak stack traces / DB errors to the browser
      return jsonError(500, "Internal Server Error")
    }
  }
}

/** Rate limit for public (unauthenticated) endpoints, keyed by IP. */
export function publicRateLimit(req, bucket, { limit, windowMs }) {
  return rateLimit(`${bucket}:${getClientIp(req)}`, { limit, windowMs })
}

export const isAdmin = (session) => session?.role === ROLES.ADMIN
export const isAdminOrBranch = (session) => session?.role === ROLES.ADMIN || session?.role === ROLES.BRANCH
export const isInternal = (session) => isInternalRole(session?.role)
export const isExternal = (session) => isExternalRole(session?.role)

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------

const cookieBase = {
  httpOnly: true, // not readable by JavaScript -> safe from XSS token theft
  secure: isProd, // HTTPS only in production
  sameSite: "lax", // not sent on cross-site POST/fetch -> CSRF protection
  path: "/",
}

export async function setAuthCookies(response, user) {
  const [accessToken, refreshToken] = await Promise.all([signAccessToken(user), signRefreshToken(user)])
  response.cookies.set(ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: ACCESS_TTL_SECONDS })
  response.cookies.set(REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: REFRESH_TTL_SECONDS })
  return response
}

export function clearAuthCookies(response) {
  response.cookies.set(ACCESS_COOKIE, "", { ...cookieBase, maxAge: 0 })
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 })
  return response
}

export const readRefreshCookie = (req) => readCookie(req, REFRESH_COOKIE)
