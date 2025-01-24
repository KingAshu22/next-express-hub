import { connectToDB } from "@/app/_utils/mongodb";
import Customer from "@/models/Customer";
import { NextResponse } from "next/server";

export async function GET(req) {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    console.log("Query Got:", query);


    if (!query) {
        return NextResponse.json({ error: "Search term is required" }, { status: 400 });
    }

    try {
        const results = await Customer.find({
            name: { $regex: query, $options: "i" }, // Case-insensitive search
        });

        console.log(results);

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error fetching customer data:", error.message);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
