import { connectToDB } from "@/app/_utils/mongodb";
import GstParcel from "@/models/Awb";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        // Parse the tracking number from the request's query params
        const { searchParams } = new URL(req.url);
        const trackingNumber = searchParams.get("trackingNumber");

        if (!trackingNumber) {
            return NextResponse.json(
                { error: "Tracking number is required" },
                { status: 400 }
            );
        }

        // Connect to the database
        await connectToDB();

        // Find the parcel by tracking number
        const parcel = await GstParcel.findOne({ trackingNumber });

        if (!parcel) {
            return NextResponse.json(
                { error: "Parcel not found" },
                { status: 404 }
            );
        }

        // Respond with the parcel data
        return NextResponse.json(parcel, { status: 200 });
    } catch (error) {
        console.error("Error fetching parcel data:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
