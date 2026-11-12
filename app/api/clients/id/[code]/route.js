import { connectToDB } from "@/app/_utils/mongodb";
import Client from "@/models/Client";
import { NextResponse } from "next/server";
import { withAuth, notFound } from "@/lib/auth/server";
import { canAccessClient } from "@/lib/security/scope";
import { sanitizeClient } from "@/lib/security/sanitize";

// GET /api/clients/id/:id  (looks a client up by its database id)
export const GET = withAuth(async (req, { params }, session) => {
  const { code } = await params;
  await connectToDB();

  const client = await Client.findById(String(code)).lean().catch(() => null);
  if (!canAccessClient(session, client)) return notFound("Client not found");

  return NextResponse.json(sanitizeClient(client));
});
