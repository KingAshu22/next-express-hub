import { connectToDB } from "@/app/_utils/mongodb";
import Parcel from "@/models/Parcel";
import { NextResponse } from "next/server";

export async function GET() {
    await connectToDB()
    try {
        const parcels = await Parcel.find({}).sort({ _id: -1 });
        return NextResponse.json(parcels);
    } catch (error) {
        console.error("Error fetching parcels:", error.message);
        return NextResponse.json(
            { error: "Failed to fetch parcels" },
            { status: 500 }
        );
    }
}
