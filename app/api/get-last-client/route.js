import { connectToDB } from "@/app/_utils/mongodb";
import Client from "@/models/Client";
import { NextResponse } from "next/server";


export async function GET() {
    await connectToDB()

    try {
        // Fetch the last document for the invoice number
        const lastClient = await Client.findOne({}).sort({ _id: -1 }).select("code")

        let code
        if (!lastClient) {
            // If no AWBs exist, start with invoice number 0
            code = "0000"
        } else {
            // Increment the last invoice number
            code = lastClient.code
        }

        return NextResponse.json({
            code
        })
    } catch (error) {
        console.error("Error fetching Client:", error.message)
        return NextResponse.json({ error: "Failed to fetch Client" }, { status: 500 })
    }
}
