// POST /api/auth/logout
// Ends THIS browser's session only. (Revoking every session of the account
// would also sign out colleagues who share the same login.) Changing the
// password is what signs an account out everywhere.
import { NextResponse } from "next/server"
import { clearAuthCookies } from "@/lib/auth/server"

export async function POST() {
  return clearAuthCookies(NextResponse.json({ success: true }))
}
