import { connectToDB } from "@/app/_utils/mongodb";
import Client from "@/models/Client";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    const { code } = await params;
    console.log("Inside get /api/clients/id/:code");
    await connectToDB();
    try {
        const client = await Client.findOne({ _id: code });

        if (!client) {
            return NextResponse.json({ message: "Client s not found" }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error("Error fetching Client data:", error);
        return NextResponse.json(
            { message: "Failed to fetch Client data.", error: error.message },
            { status: 500 }
        );
    }
}
