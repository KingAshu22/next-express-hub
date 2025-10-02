import { connectToDB } from "@/app/_utils/mongodb";
import Estimate from "@/models/Estimate";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  await connectToDB();

  try {
    const estimate = await Estimate.findOne({ code: params.code });
    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }
    return NextResponse.json(estimate);
  } catch (error) {
    console.error("Error fetching estimate:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch estimate" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  await connectToDB();

  try {
    const body = await request.json();
    const updatedEstimate = await Estimate.findOneAndUpdate(
      { code: params.code },
      body,
      { new: true }
    );

    if (!updatedEstimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    return NextResponse.json(updatedEstimate);
  } catch (error) {
    console.error("Error updating estimate:", error.message);
    return NextResponse.json(
      { error: "Failed to update estimate" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  await connectToDB();

  try {
    const deletedEstimate = await Estimate.findOneAndDelete({ code: params.code });
    if (!deletedEstimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Estimate deleted" });
  } catch (error) {
    console.error("Error deleting estimate:", error.message);
    return NextResponse.json(
      { error: "Failed to delete estimate" },
      { status: 500 }
    );
  }
}