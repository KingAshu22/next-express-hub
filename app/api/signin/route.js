import { connectToDB } from "@/app/_utils/mongodb";
import Admin from "@/models/Admin";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json(); // Parse the incoming JSON body

    await connectToDB();

    // Find the admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return NextResponse.json({ error: "Incorrect Email" }, { status: 400 });
    }

    // Check if the password matches
    if (admin.password !== password) {
      return NextResponse.json(
        { error: "Incorrect Password" },
        { status: 400 }
      );
    }

    // Return the admin details if authentication is successful
    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
