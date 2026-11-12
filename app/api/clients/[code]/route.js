import { connectToDB } from "@/app/_utils/mongodb";
import Client from "@/models/Client";
import { NextResponse } from "next/server";
import { withAuth, notFound } from "@/lib/auth/server";
import { ROLES } from "@/lib/auth/config";
import { canAccessClient } from "@/lib/security/scope";
import { sanitizeClient } from "@/lib/security/sanitize";

const MANAGE_ROLES = [ROLES.ADMIN, ROLES.BRANCH, ROLES.FRANCHISE];

export const GET = withAuth(async (req, { params }, session) => {
  const { code } = await params;
  await connectToDB();

  const client = await Client.findOne({ code: String(code) }).lean();
  if (!canAccessClient(session, client)) return notFound("Client not found");

  // Kept as an array: the pages read response.data[0]
  return NextResponse.json([sanitizeClient(client)]);
});

export const PUT = withAuth(
  async (req, { params }, session) => {
    await connectToDB();
    const { code } = await params;
    const body = await req.json();

    const existing = await Client.findOne({ code: String(code) }).lean();
    if (!canAccessClient(session, existing)) return notFound("Client not found");

    for (const key of Object.keys(body || {})) if (key.startsWith("$")) delete body[key];
    delete body._id;
    delete body.tokenVersion;
    // A franchise can't move a client to someone else or rename its code
    if (session.role === ROLES.FRANCHISE) {
      delete body.owner;
      delete body.code;
    }
    // Empty password = keep the current one (handled by the model plugin)

    const updatedClient = await Client.findOneAndUpdate({ _id: existing._id }, body, { new: true });

    return NextResponse.json({ message: "Client updated successfully!", updatedClient: sanitizeClient(updatedClient) });
  },
  { roles: MANAGE_ROLES }
);

export const DELETE = withAuth(
  async (req, { params }, session) => {
    await connectToDB();
    const { code } = await params;

    const existing = await Client.findOne({ code: String(code) }).lean();
    if (!canAccessClient(session, existing)) return notFound("Client not found");

    await Client.deleteOne({ _id: existing._id });
    return NextResponse.json({ message: "Client deleted successfully!" }, { status: 200 });
  },
  { roles: MANAGE_ROLES }
);
