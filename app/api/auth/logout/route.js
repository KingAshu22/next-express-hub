// POST /api/auth/logout
// Clears the cookies and revokes every refresh token of this user.
import { NextResponse } from "next/server"
import { verifyRefreshToken } from "@/lib/auth/tokens"
import { loadActiveAccount } from "@/lib/auth/accounts"
import { clearAuthCookies, readRefreshCookie } from "@/lib/auth/server"

export async function POST(req) {
  try {
    const { session } = await verifyRefreshToken(readRefreshCookie(req))
    const account = session ? await loadActiveAccount(session) : null
    if (account) {
      await account.doc.constructor.collection.updateOne({ _id: account.doc._id }, { $inc: { tokenVersion: 1 } })
    }
  } catch (err) {
    console.error("Logout revoke failed:", err)
  }
  return clearAuthCookies(NextResponse.json({ success: true }))
}
