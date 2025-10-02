import { connectToDB } from "@/app/_utils/mongodb";
import Customer from "@/models/Customer";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { _id } = await params;
  console.log("Inside get /api/customer/:_id");
  await connectToDB();
  try {
    const customer = await Customer.findById(_id);

    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer data:", error);
    return NextResponse.json(
      { message: "Failed to fetch customer data.", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    console.log("Updating Customer");
    await connectToDB();
    const { _id } = await params; // Correctly extract params
    const body = await req.json(); // Parse the incoming JSON data

    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id }, // Use a proper query object
      body,
      { new: true }
    );

    if (!updatedCustomer) {
      return new Response(JSON.stringify({ message: "Customer not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Customer updated successfully!", updatedCustomer }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating Customer data:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to update Customer data.",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    console.log("Deleting Customer");
    await connectToDB();
    const { _id } = await params; // Correctly extract params
    const deleteCustomer = await Customer.findOneAndDelete({ _id }); // Use a proper query object

    if (!deleteCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Customer deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting Customer data:", error);
    return NextResponse.json(
      { message: "Failed to delete Customer data." },
      { status: 500 }
    );
  }
}
