import { connectToDB } from "@/app/_utils/mongodb";
import Client from "@/models/Client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/server";
import { ROLES, isInternalRole } from "@/lib/auth/config";
import { sanitizeClients, sanitizeClient, toDirectoryEntry } from "@/lib/security/sanitize";

export const GET = withAuth(async (req, ctx, session) => {
  await connectToDB();

  if (session.role === ROLES.ADMIN || session.role === ROLES.BRANCH) {
    const clients = await Client.find({}).sort({ _id: -1 }).lean();
    return NextResponse.json(sanitizeClients(clients));
  }

  if (isInternalRole(session.role)) {
    // Customer service / pickup only need names for the bookings table
    const clients = await Client.find({}).select("code name companyName owner").sort({ _id: -1 }).lean();
    return NextResponse.json(clients.map(toDirectoryEntry));
  }

  if (session.role === ROLES.FRANCHISE) {
    const clients = await Client.find({ owner: session.code }).sort({ _id: -1 }).lean();
    return NextResponse.json(sanitizeClients(clients));
  }

  // A client only ever sees itself
  const me = await Client.find({ code: session.code }).lean();
  return NextResponse.json(sanitizeClients(me));
});

export const POST = withAuth(
  async (req, ctx, session) => {
    await connectToDB();
    const data = await req.json();
    delete data._id;
    delete data.tokenVersion;

    // A franchise can only create clients under itself
    if (session.role === ROLES.FRANCHISE) data.owner = session.code;

    const newClient = new Client(data);
    await newClient.save();

    return NextResponse.json(
      { message: "Client added successfully!", newClient: sanitizeClient(newClient) },
      { status: 200 }
    );
  },
  { roles: [ROLES.ADMIN, ROLES.BRANCH, ROLES.FRANCHISE] }
);
