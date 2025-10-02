import { connectToDB } from "@/app/_utils/mongodb"
import Franchise from "@/models/Franchise"
import { NextResponse } from "next/server"

export async function GET(req, { params }) {
  const { code } = await params;
  console.log("Inside get /api/franchises/:code");

  await connectToDB();

  try {
    // Match case-insensitively to be safe
    const franchise = await Franchise.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } });
    
    if (!franchise) {
      return NextResponse.json({ message: "Franchise not found" }, { status: 404 });
    }

    return NextResponse.json(franchise); // Return direct object, not array
  } catch (error) {
    console.error("Error fetching Franchise data:", error);
    return NextResponse.json({ message: "Failed to fetch Franchise data.", error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    console.log("Updating Franchise")
    await connectToDB()
    const { code } = await params // Correctly extract params
    const body = await req.json() // Parse the incoming JSON data

    const updatedFranchise = await Franchise.findOneAndUpdate(
      { code }, // Use a proper query object
      body,
      { new: true },
    )

    if (!updatedFranchise) {
      return new Response(JSON.stringify({ message: "Franchise not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ message: "Franchise updated successfully!", updatedFranchise }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error updating Franchise data:", error)
    return new Response(
      JSON.stringify({
        message: "Failed to update Franchise data.",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    console.log("Deleting Franchise")
    await connectToDB()
    const { code } = await params // Correctly extract params
    const deletedFranchise = await Franchise.findOneAndDelete({ code }) // Use a proper query object

    if (!deletedFranchise) {
      return NextResponse.json({ error: "Franchise not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Franchise deleted successfully!" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting Franchise data:", error)
    return NextResponse.json({ message: "Failed to delete Franchise data." }, { status: 500 })
  }
}
