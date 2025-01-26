import { connectToDB } from "@/app/_utils/mongodb";
import Client from "@/models/Client";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { code } = await params;
  console.log("Inside get /api/clients/:code");
  await connectToDB();
  try {
    const client = await Client.find({ code: code });

    if (!client) {
      return NextResponse.json({ message: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching Client data:", error);
    return NextResponse.json(
      { message: "Failed to fetch Client data.", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    console.log("Updating Client");
    await connectToDB();
    const { code } = await params; // Correctly extract params
    const body = await req.json(); // Parse the incoming JSON data

    const updatedClient = await Client.findOneAndUpdate(
      { code }, // Use a proper query object
      body,
      { new: true }
    );

    if (!updatedClient) {
      return new Response(JSON.stringify({ message: "Client not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Client updated successfully!", updatedClient }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating Client data:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to update Client data.",
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
    console.log("Deleting Client");
    await connectToDB();
    const { code } = await params; // Correctly extract params
    const deletedClient = await Client.findOneAndDelete({ code }); // Use a proper query object

    if (!deletedClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Client deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting Client data:", error);
    return NextResponse.json(
      { message: "Failed to delete Client data." },
      { status: 500 }
    );
  }
}
