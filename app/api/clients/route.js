import { connectToDB } from "@/app/_utils/mongodb";
import Client from "@/models/Client";
import { NextResponse } from "next/server";

export async function GET(req) {
  console.log("Inside get /api/clients");
  await connectToDB();
  try {
    // Extract userType and id from the request headers
    const userType = req.headers.get("userType");
    const userId = req.headers.get("userId");

    let query = {};
    if (userType === "franchise" || userType === "client") {
      query = { owner: userId };
    }

    const clients = await Client.find(query).sort({ _id: -1 });
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching Clients:", error.message);
    return NextResponse.json({ error: "Failed to fetch Clients" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    console.log("Inside /api/clients");
    await connectToDB();
    const data = await req.json(); // Parse JSON body from the request

    console.log(data);

    const newClient = new Client(data);
    await newClient.save();

    return NextResponse.json(
      { message: "Client added successfully!", newClient },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/clients:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
