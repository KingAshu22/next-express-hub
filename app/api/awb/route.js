import { connectToDB } from "@/app/_utils/mongodb";
import Awb from "@/models/Awb";
import { NextResponse } from "next/server";

export async function GET() {
    await connectToDB();
    try {
        const awbs = await Awb.find({}).sort({ _id: -1 });
        return NextResponse.json(awbs);
    } catch (error) {
        console.error("Error fetching Awb:", error.message);
        return NextResponse.json(
            { error: "Failed to fetch Awb" },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        await connectToDB();
        const data = await req.json(); // Parse JSON body from the request

        console.log(data);

        const awb = new Awb(data);
        await awb.save();

        return NextResponse.json(
            { message: "Parcel added successfully!", awb },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error in POST /api/awb:", error.message);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
