"use client"
// lib/auth/client.js
// Browser side of the session:
//  - tokens live in HttpOnly cookies (JavaScript can't read them - by design)
//  - while the user is ACTIVE (clicks, typing, scrolling) the session is renewed
//    in the background, so people who are working are never logged out
//  - after IDLE_TIMEOUT of no interaction at all, the session ends and the next
//    action goes to /signin (the server enforces the same limit)
//  - when an API answers 401 because the short access token expired, we renew
//    once and replay the request transparently
// localStorage only keeps display info (name / role / code). The server never
// trusts it, so editing it in DevTools gives no extra access.
import axios from "axios"

// Keep in sync with IDLE_TIMEOUT_SECONDS in lib/auth/config.js
const IDLE_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour without any interaction
const RENEW_EVERY_MS = 5 * 60 * 1000 // while active, renew at most every 5 minutes

const PROFILE_KEYS = ["id", "name", "userType", "code", "authExpiry", "lastActivityAt", "sessionRenewedAt"]
const AUTH_ENDPOINTS = ["/api/auth/refresh", "/api/auth/logout", "/api/admin-signin", "/api/franchise-signin", "/api/client-signin"]
const PUBLIC_PREFIXES = ["/signin", "/track", "/blogs", "/about", "/contact", "/privacy-policy", "/terms-of-service", "/refunds-cancellation-policy", "/api"]

const now = () => Date.now()
const readNum = (key) => Number(localStorage.getItem(key)) || 0
const isSignedIn = () => !!localStorage.getItem("userType")

// Shared by all tabs (localStorage), so activity in one tab keeps every tab signed in
const markActivity = () => localStorage.setItem("lastActivityAt", String(now()))
const isIdle = () => {
  const last = readNum("lastActivityAt")
  return last > 0 && now() - last > IDLE_TIMEOUT_MS
}

export function saveProfile(user) {
  if (typeof window === "undefined" || !user) return
  localStorage.setItem("id", user.id || "") // own account id (used as staffId / customer owner)
  localStorage.setItem("name", user.name || "")
  localStorage.setItem("userType", user.role || "")
  localStorage.setItem("code", user.code || "")
  localStorage.setItem("sessionRenewedAt", String(now()))
  localStorage.setItem("authExpiry", String(now() + IDLE_TIMEOUT_MS))
  markActivity()
}

export function clearProfile() {
  if (typeof window === "undefined") return
  PROFILE_KEYS.forEach((k) => localStorage.removeItem(k))
}

export async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
  } catch {}
  clearProfile()
  window.location.href = "/signin"
}

const isPublicPage = () => {
  const p = window.location.pathname
  return p === "/" || PUBLIC_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`))
}

let redirecting = false
function onSessionEnded() {
  clearProfile()
  if (redirecting || isPublicPage()) return
  redirecting = true
  const here = window.location.pathname + window.location.search
  window.location.href = `/signin?redirect_url=${encodeURIComponent(here)}`
}

let nativeFetch = null
let refreshPromise = null
function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = nativeFetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) return false
        const data = await res.json().catch(() => null)
        if (data?.user) saveProfile(data.user)
        return true
      })
      .catch(() => null) // network error: unknown, don't log the user out for it
      .finally(() => setTimeout(() => (refreshPromise = null), 0))
  }
  return refreshPromise
}

/**
 * Called when an API says the access token is missing/expired.
 * Returns true when the request may be replayed.
 */
async function recoverSession() {
  if (isIdle()) {
    onSessionEnded() // nobody touched the site for over an hour
    return false
  }
  const renewed = await refreshSession()
  if (renewed === false) onSessionEnded()
  return renewed === true
}

const sameOriginApiPath = (url) => {
  try {
    const u = new URL(url, window.location.origin)
    return u.origin === window.location.origin && u.pathname.startsWith("/api/") ? u.pathname : null
  } catch {
    return null
  }
}

const SESSION_CODES = ["TOKEN_EXPIRED", "UNAUTHENTICATED"]

function installFetchInterceptor() {
  nativeFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || String(input)
    const path = sameOriginApiPath(url)
    const retryInput = input instanceof Request ? input.clone() : input
    const res = await nativeFetch(input, init)
    if (res.status !== 401 || !path || AUTH_ENDPOINTS.includes(path)) return res

    const body = await res.clone().json().catch(() => null)
    if (SESSION_CODES.includes(body?.code) && (await recoverSession())) {
      return nativeFetch(retryInput, init)
    }
    return res
  }
}

function installAxiosInterceptor() {
  axios.defaults.withCredentials = true
  axios.interceptors.response.use(undefined, async (error) => {
    const { response, config } = error || {}
    const path = config?.url ? sameOriginApiPath(config.url) : null
    if (response?.status !== 401 || !path || AUTH_ENDPOINTS.includes(path)) throw error

    if (SESSION_CODES.includes(response.data?.code) && !config.__retried) {
      if (await recoverSession()) return axios({ ...config, __retried: true })
    } else if (config.__retried) {
      onSessionEnded()
    }
    throw error
  })
}

// While the user interacts, keep the session alive in the background.
function installActivityTracking() {
  let lastWrite = 0
  const onActivity = () => {
    if (!isSignedIn()) return
    const t = now()
    if (t - lastWrite < 15_000) return // throttle: at most one write per 15 s
    lastWrite = t

    if (isIdle()) {
      // Came back after more than an hour away: the session is over.
      if (!isPublicPage()) onSessionEnded()
      return
    }
    markActivity()
    if (t - readNum("sessionRenewedAt") > RENEW_EVERY_MS) {
      localStorage.setItem("sessionRenewedAt", String(t)) // other tabs skip this round
      refreshSession().then((ok) => {
        if (ok === false && !isPublicPage()) onSessionEnded()
      })
    }
  }

  for (const evt of ["pointerdown", "keydown", "wheel", "touchstart", "mousemove", "scroll"]) {
    window.addEventListener(evt, onActivity, { passive: true, capture: true })
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") onActivity()
  })
}

if (typeof window !== "undefined" && !window.__koAuthInstalled) {
  window.__koAuthInstalled = true
  installFetchInterceptor()
  installAxiosInterceptor()
  installActivityTracking()
}
