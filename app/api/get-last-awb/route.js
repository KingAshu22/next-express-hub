import { connectToDB } from "@/app/_utils/mongodb";
import Awb from "@/models/Awb";
import { NextResponse } from "next/server";

function generateTrackingNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000); // Generate a random 10-digit number
}

async function getUniqueTrackingNumber() {
    let isUnique = false;
    let trackingNumber;

    while (!isUnique) {
        trackingNumber = generateTrackingNumber();
        const existingParcel = await Awb.findOne({ trackingNumber }).select("_id");

        if (!existingParcel) {
            isUnique = true; // If no document with this tracking number exists, mark it as unique
        }
    }

    return trackingNumber;
}

export async function GET() {
    await connectToDB()

    try {
        // Fetch the last document for the invoice number
        const lastAwb = await Awb.findOne({}).sort({ _id: -1 }).select("invoiceNumber")

        let invoiceNumber
        if (!lastAwb) {
            // If no AWBs exist, start with invoice number 0
            invoiceNumber = "0"
        } else {
            // Increment the last invoice number
            invoiceNumber = lastAwb.invoiceNumber
        }

        // Generate a unique tracking number
        const uniqueTrackingNumber = await getUniqueTrackingNumber()

        return NextResponse.json({
            invoiceNumber: invoiceNumber,
            trackingNumber: uniqueTrackingNumber,
        })
    } catch (error) {
        console.error("Error fetching Awb:", error.message)
        return NextResponse.json({ error: "Failed to fetch Awb" }, { status: 500 })
    }
}
