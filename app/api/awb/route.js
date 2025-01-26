import { connectToDB } from "@/app/_utils/mongodb";
import Awb from "@/models/Awb";
import { NextResponse } from "next/server";

export async function GET(req) {
  console.log("Inside get /api/awb");
  await connectToDB();

  try {
    // Extract userType and id from the request headers
    const userType = req.headers.get("userType");
    const userId = req.headers.get("userId");

    let query = {};
    if (userType === "client") {
      // If the user is a client, filter AWBs by staffId
      query = { staffId: userId };
    }

    // Fetch AWBs based on the query
    const awbs = await Awb.find(query).sort({ _id: -1 });

    return NextResponse.json(awbs);
  } catch (error) {
    console.error("Error fetching Awb:", error.message);
    return NextResponse.json({ error: "Failed to fetch Awb" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    console.log("Inside /api/awb");
    await connectToDB();
    const data = await req.json(); // Parse JSON body from the request

    console.log(data);

    const awb = new Awb(data);
    await awb.save();

    return NextResponse.json(
      { message: "Parcel added successfully!", awb },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/awb:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
