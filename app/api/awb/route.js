import { connectToDB } from "@/app/_utils/mongodb";
import Awb from "@/models/Awb";
import Customer from "@/models/Customer";
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
      query = { refCode: userId };
    } else if (userType === "franchise") {
      query = { refCode: userId };
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
    const data = await req.json();

    console.log(data);

    const awb = new Awb(data);
    await awb.save();

    // Update or create customer1 (sender)
    await Customer.findOneAndUpdate(
      {
        name: data.sender.name,
        owner: data.staffId
      },
      {
        $set: {
          companyName: data.sender.companyName,
          email: data.sender.email,
          address: data.sender.address,
          country: data.sender.country,
          zip: data.sender.zip,
          contact: data.sender.contact,
          kyc: data.sender.kyc,
          gst: data.sender.gst,
          role: "customer",
          owner: data.staffId,
        },
      },
      { upsert: true, new: true }
    );

    // Update or create customer2 (receiver)
    await Customer.findOneAndUpdate(
      {
        name: data.receiver.name,
        owner: data.staffId
      },
      {
        $set: {
          companyName: data.receiver.companyName,
          email: data.receiver.email,
          address: data.receiver.address,
          country: data.receiver.country,
          zip: data.receiver.zip,
          contact: data.receiver.contact,
          kyc: data.receiver.kyc,
          gst: data.receiver.gst,
          role: "customer",
          owner: data.staffId,
        },
      },
      { upsert: true, new: true }
    );

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

