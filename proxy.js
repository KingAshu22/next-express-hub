// proxy.js (Next.js 16 - formerly middleware.js)
// 1. Pages: every panel page needs a valid session, and some need a staff role.
// 2. API: blocks cross-site write requests (CSRF) and disables caching.
// Data-level checks (who may see which shipment) live in each API route.
import { NextResponse } from "next/server"
import { ACCESS_COOKIE, REFRESH_COOKIE, ROLES } from "@/lib/auth/config"
import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth/tokens"

const { ADMIN, BRANCH, CUSTOMER_SERVICE, PICKUP, FRANCHISE } = ROLES

// Pages anyone can open without signing in
const PUBLIC_PAGES = [
  "/",
  "/about",
  "/contact",
  "/blogs",
  "/track",
  "/signin",
  "/privacy-policy",
  "/terms-of-service",
  "/refunds-cancellation-policy",
  "/api", // developer docs page for the tracking API
]

// Page prefix -> roles allowed. Longest matching prefix wins. Pages not listed
// here are open to every signed-in user (their API calls are still scoped).
const PAGE_ROLES = {
  "/admin-blogs": [ADMIN, BRANCH],
  "/billing": [ADMIN],
  "/mis": [ADMIN],
  "/rates": [ADMIN],
  "/franchise": [ADMIN],
  "/settings": [ADMIN],
  "/stock": [ADMIN],
  "/customers": [ADMIN, BRANCH],
  "/estimate": [ADMIN, BRANCH],
  "/edit-estimate": [ADMIN, BRANCH],
  "/pickup": [ADMIN, BRANCH, PICKUP],
  "/edit-pickup": [ADMIN, BRANCH, PICKUP],
  "/awb/cj": [ADMIN, BRANCH],
  "/awb/sales": [ADMIN, BRANCH],
  "/awb/update-track": [ADMIN, BRANCH, CUSTOMER_SERVICE],
  "/clients": [ADMIN, BRANCH, FRANCHISE],
}

// External API that authenticates with email + password in the body (called
// from partners' own websites), so it is allowed cross-origin.
const CROSS_ORIGIN_API = ["/api/tracking"]

const matchesPrefix = (pathname, prefix) =>
  prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`)

const isPublicPage = (pathname) => PUBLIC_PAGES.some((p) => matchesPrefix(pathname, p))

const rolesForPage = (pathname) => {
  let best = null
  for (const prefix of Object.keys(PAGE_ROLES)) {
    if (matchesPrefix(pathname, prefix) && (!best || prefix.length > best.length)) best = prefix
  }
  return best ? PAGE_ROLES[best] : null
}

const homeForRole = (role) => (role === PICKUP ? "/pickup" : role === CUSTOMER_SERVICE ? "/awb" : "/dashboard")

async function readSessionRole(req) {
  const access = await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value)
  if (access.session) return access.session.role
  // Access token expired: a valid refresh token is enough to render the page;
  // the page's first API call renews the access token (or sends the user to sign in).
  const refresh = await verifyRefreshToken(req.cookies.get(REFRESH_COOKIE)?.value)
  return refresh.session?.role || null
}

function apiGuard(req) {
  const { pathname } = req.nextUrl
  const method = req.method.toUpperCase()
  const isWrite = !["GET", "HEAD", "OPTIONS"].includes(method)

  if (isWrite && !CROSS_ORIGIN_API.some((p) => matchesPrefix(pathname, p))) {
    const origin = req.headers.get("origin")
    if (origin) {
      let sameOrigin = false
      try {
        sameOrigin = new URL(origin).host === req.headers.get("host")
      } catch {}
      if (!sameOrigin) {
        return NextResponse.json({ success: false, error: "Cross-site request blocked", code: "CSRF" }, { status: 403 })
      }
    }
  }

  const res = NextResponse.next()
  res.headers.set("Cache-Control", "private, no-store, max-age=0")
  return res
}

export async function proxy(req) {
  const { pathname, search } = req.nextUrl

  if (pathname.startsWith("/api/")) return apiGuard(req)
  if (isPublicPage(pathname)) return NextResponse.next()

  const role = await readSessionRole(req)
  if (!role) {
    const url = req.nextUrl.clone()
    url.pathname = "/signin"
    url.search = `?redirect_url=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  const allowed = rolesForPage(pathname)
  if (allowed && !allowed.includes(role)) {
    const url = req.nextUrl.clone()
    url.pathname = homeForRole(role)
    url.search = ""
    return NextResponse.redirect(url)
  }

  const res = NextResponse.next()
  res.headers.set("Cache-Control", "private, no-store")
  return res
}

export const config = {
  matcher: [
    // Everything except Next internals and static files
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|css|js|map|txt|xml|woff2?|ttf|otf|pdf|mp4|webm|json)$).*)",
  ],
}
