import { connectToDB } from "@/app/_utils/mongodb";
import Customer from "@/models/Customer";
import { NextResponse } from "next/server";

export async function GET(req) {
    console.log("Inside get /api/customer");
    await connectToDB();
    try {
        // Extract userType and id from the request headers
        const userType = req.headers.get("userType");
        const userId = req.headers.get("userId");
        let customers;
        if (userType === "admin" || userType === "branch") {
            customers = await Customer.find({}).sort({ _id: -1 });
    } else {
      customers = await Customer.find({owner: userId}).sort({ _id: -1 });
    }
        return NextResponse.json(customers);
    } catch (error) {
        console.error("Error fetching Customers:", error.message);
        return NextResponse.json({ error: "Failed to fetch Customers" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        console.log("Inside /api/customers");
        await connectToDB();
        const data = await req.json(); // Parse JSON body from the request

        console.log(data);

        const customer = new Customer(data);
        await customer.save();

        return NextResponse.json(
            { message: "Customer added successfully!", customer },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in POST /api/customer:", error.message);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
