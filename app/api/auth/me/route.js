// GET /api/auth/me - who is signed in (display info only)
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/server"

export const GET = withAuth(async (req, ctx, session) =>
  NextResponse.json({
    success: true,
    user: { id: session.id, name: session.name, role: session.role, code: session.role === "admin" ? "" : session.code },
  })
)
