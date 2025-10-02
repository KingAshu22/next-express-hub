import { connectToDB } from "@/app/_utils/mongodb";
import Franchise from "@/models/Franchise";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json(); // Parse the incoming JSON body

    await connectToDB();

    // Find the admin by email
    const franchise = await Franchise.findOne({ email });

    if (!franchise) {
      return NextResponse.json({ error: "Incorrect Email" }, { status: 400 });
    }

    // Check if the password matches
    if (franchise.password !== password) {
      return NextResponse.json(
        { error: "Incorrect Password" },
        { status: 400 }
      );
    }

    // Return the admin details if authentication is successful
    return NextResponse.json({ franchise });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
