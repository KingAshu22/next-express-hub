import { connectToDB } from "@/app/_utils/mongodb";
import Estimate from "@/models/Estimate";
import { NextResponse } from "next/server";

export async function GET(request) {
  await connectToDB();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const name = searchParams.get("name");

    let filter = {};

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const estimates = await Estimate.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Estimate.countDocuments(filter);

    return NextResponse.json({
      data: estimates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching estimates:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch estimates" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  await connectToDB();

  try {
    const body = await request.json();
    const newEstimate = new Estimate(body);
    await newEstimate.save();
    return NextResponse.json(newEstimate, { status: 201 });
  } catch (error) {
    console.error("Error creating estimate:", error.message);
    return NextResponse.json(
      { error: "Failed to create estimate" },
      { status: 500 }
    );
  }
}