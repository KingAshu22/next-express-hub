import { connectToDB } from "@/app/_utils/mongodb";
import Awb from "@/models/Awb";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { trackingNumber } = await params;
  console.log("Inside get /api/awb/:trackingNumber");
  await connectToDB();
  try {
    const awb = await Awb.find({ trackingNumber: trackingNumber });

    if (!awb) {
      return NextResponse.json({ message: "AWB not found" }, { status: 404 });
    }

    return NextResponse.json(awb);
  } catch (error) {
    console.error("Error fetching AWB data:", error);
    return NextResponse.json(
      { message: "Failed to fetch AWB data.", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    console.log("Updating AWB");
    await connectToDB();
    const { trackingNumber } = params; // Correctly extract params
    const body = await req.json(); // Parse the incoming JSON data

    const updatedAwb = await Awb.findOneAndUpdate(
      { trackingNumber }, // Use a proper query object
      body,
      { new: true }
    );

    if (!updatedAwb) {
      return new Response(JSON.stringify({ message: "AWB not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "AWB updated successfully!", updatedAwb }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating AWB data:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to update AWB data.",
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
    console.log("Deleting AWB");
    await connectToDB();
    const { trackingNumber } = params; // Correctly extract params
    const deletedAwb = await Awb.findOneAndDelete({ trackingNumber }); // Use a proper query object

    if (!deletedAwb) {
      return NextResponse.json({ error: "AWB not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "AWB deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting AWB data:", error);
    return NextResponse.json(
      { message: "Failed to delete AWB data." },
      { status: 500 }
    );
  }
}
