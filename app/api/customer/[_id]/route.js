import { connectToDB } from "@/app/_utils/mongodb";
import Customer from "@/models/Customer";
import { NextResponse } from "next/server";
import { withAuth, notFound, isAdminOrBranch } from "@/lib/auth/server";
import { ownerIdFor } from "@/lib/security/scope";

async function loadOwnedCustomer(id, session) {
  const customer = await Customer.findById(String(id)).catch(() => null);
  if (!customer) return null;
  if (!isAdminOrBranch(session) && customer.owner !== ownerIdFor(session)) return null;
  return customer;
}

export const GET = withAuth(async (req, { params }, session) => {
  const { _id } = await params;
  await connectToDB();
  const customer = await loadOwnedCustomer(_id, session);
  if (!customer) return notFound("Customer not found");
  return NextResponse.json(customer);
});

export const PUT = withAuth(async (req, { params }, session) => {
  await connectToDB();
  const { _id } = await params;
  const body = await req.json();
  for (const key of Object.keys(body || {})) if (key.startsWith("$")) delete body[key];
  delete body._id;
  if (!isAdminOrBranch(session)) delete body.owner;

  const existing = await loadOwnedCustomer(_id, session);
  if (!existing) return notFound("Customer not found");

  const updatedCustomer = await Customer.findOneAndUpdate({ _id: existing._id }, body, { new: true });
  return NextResponse.json({ message: "Customer updated successfully!", updatedCustomer });
});

export const DELETE = withAuth(async (req, { params }, session) => {
  await connectToDB();
  const { _id } = await params;
  const existing = await loadOwnedCustomer(_id, session);
  if (!existing) return notFound("Customer not found");

  await Customer.deleteOne({ _id: existing._id });
  return NextResponse.json({ message: "Customer deleted successfully!" }, { status: 200 });
});
