import { handleSignIn } from "@/lib/auth/accounts"

export async function POST(req) {
  return handleSignIn(req, "admin")
}
