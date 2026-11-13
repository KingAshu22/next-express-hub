// POST /api/auth/refresh
// Swaps a valid refresh-token cookie for a fresh access token (and rotates the
// refresh token). Rejected when the user logged out / changed password since.
import { NextResponse } from "next/server"
import { verifyRefreshToken } from "@/lib/auth/tokens"
import { loadActiveAccount, publicProfile } from "@/lib/auth/accounts"
import {
  clearAuthCookies,
  setAuthCookies,
  readRefreshCookie,
  publicRateLimit,
  tooManyRequests,
} from "@/lib/auth/server"

export async function POST(req) {
  const limit = publicRateLimit(req, "refresh", { limit: 600, windowMs: 60_000 })
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  const { session } = await verifyRefreshToken(readRefreshCookie(req))
  const account = session ? await loadActiveAccount(session) : null

  if (!account) {
    const res = NextResponse.json(
      { success: false, error: "Session expired. Please sign in again.", code: "SESSION_ENDED" },
      { status: 401 }
    )
    return clearAuthCookies(res)
  }

  const res = NextResponse.json({ success: true, user: publicProfile(account.user) })
  return setAuthCookies(res, account.user)
}
