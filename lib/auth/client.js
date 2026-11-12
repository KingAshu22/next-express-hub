"use client"
// lib/auth/client.js
// Browser side of the session:
//  - tokens live in HttpOnly cookies (JavaScript can't read them - by design)
//  - when an API answers 401 TOKEN_EXPIRED, we silently call /api/auth/refresh
//    once and replay the request; if that fails the user is sent to /signin.
// localStorage only keeps display info (name / role / code). The server never
// trusts it, so editing it in DevTools gives no extra access.
import axios from "axios"

const PROFILE_KEYS = ["id", "name", "userType", "code", "authExpiry"]
const SESSION_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const AUTH_ENDPOINTS = ["/api/auth/refresh", "/api/auth/logout", "/api/admin-signin", "/api/franchise-signin", "/api/client-signin"]
const PUBLIC_PREFIXES = ["/signin", "/track", "/blogs", "/about", "/contact", "/privacy-policy", "/terms-of-service", "/refunds-cancellation-policy"]

export function saveProfile(user) {
  if (typeof window === "undefined" || !user) return
  localStorage.setItem("id", user.id || "") // own account id (used as staffId / customer owner)
  localStorage.setItem("name", user.name || "")
  localStorage.setItem("userType", user.role || "")
  localStorage.setItem("code", user.code || "")
  localStorage.setItem("authExpiry", String(Date.now() + SESSION_DAYS_MS))
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
      .catch(() => false)
      .finally(() => setTimeout(() => (refreshPromise = null), 0))
  }
  return refreshPromise
}

const sameOriginApiPath = (url) => {
  try {
    const u = new URL(url, window.location.origin)
    return u.origin === window.location.origin && u.pathname.startsWith("/api/") ? u.pathname : null
  } catch {
    return null
  }
}

function installFetchInterceptor() {
  nativeFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || String(input)
    const path = sameOriginApiPath(url)
    const retryInput = input instanceof Request ? input.clone() : input
    const res = await nativeFetch(input, init)
    if (res.status !== 401 || !path || AUTH_ENDPOINTS.includes(path)) return res

    const body = await res.clone().json().catch(() => null)
    if (body?.code === "TOKEN_EXPIRED") {
      if (await refreshSession()) return nativeFetch(retryInput, init)
      onSessionEnded()
    } else if (body?.code === "UNAUTHENTICATED") {
      onSessionEnded()
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

    if (response.data?.code === "TOKEN_EXPIRED" && !config.__retried) {
      if (await refreshSession()) return axios({ ...config, __retried: true })
      onSessionEnded()
    } else if (response.data?.code === "UNAUTHENTICATED" || response.data?.code === "TOKEN_EXPIRED") {
      onSessionEnded()
    }
    throw error
  })
}

if (typeof window !== "undefined" && !window.__koAuthInstalled) {
  window.__koAuthInstalled = true
  installFetchInterceptor()
  installAxiosInterceptor()
}
