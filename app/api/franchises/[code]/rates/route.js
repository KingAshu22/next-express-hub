import { connectToDB } from "@/app/_utils/mongodb";
import Franchise from "@/models/Franchise";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectToDB();
    const { code } = params;

    const franchise = await Franchise.findOne({ code });
    if (!franchise) {
      return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
    }

    return NextResponse.json(franchise.rateSheets);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}
