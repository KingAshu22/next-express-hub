import { connectToDB } from "@/app/_utils/mongodb";
import Customer from "@/models/Customer";
import { NextResponse } from "next/server";
import { withAuth, isAdminOrBranch } from "@/lib/auth/server";
import { ownerIdFor } from "@/lib/security/scope";

// Address book: admin / branch see all, everyone else only the customers they saved.
export const GET = withAuth(async (req, ctx, session) => {
  await connectToDB();
  const query = isAdminOrBranch(session) ? {} : { owner: ownerIdFor(session) };
  const customers = await Customer.find(query).sort({ _id: -1 }).lean();
  return NextResponse.json(customers);
});

export const POST = withAuth(async (req, ctx, session) => {
  await connectToDB();
  const data = await req.json();
  delete data._id;
  // Owner always comes from the session
  data.owner = ownerIdFor(session);

  const customer = new Customer(data);
  await customer.save();

  return NextResponse.json({ message: "Customer added successfully!", customer }, { status: 200 });
});
