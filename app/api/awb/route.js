import { connectToDB } from "@/app/_utils/mongodb"
import Awb from "@/models/Awb"
import Customer from "@/models/Customer"
import { NextResponse } from "next/server"

export async function GET(req) {
  console.log("Inside get /api/awb")
  await connectToDB()

  try {
    const userType = req.headers.get("userType")
    const userId = req.headers.get("userId")

    const { searchParams } = new URL(req.url)
    const page = searchParams.has("page") ? Number.parseInt(searchParams.get("page")) : null
    const pageSize = searchParams.has("pageSize") ? Number.parseInt(searchParams.get("pageSize")) : null
    const search = searchParams.get("search") || ""
    const country = searchParams.get("country") || ""
    const clientCode = searchParams.get("clientCode") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""

    const query = {}

    if (userType === "client" || userType === "franchise") {
      query.refCode = userId
    }

    if (search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" }
      query.$or = [
        { trackingNumber: searchRegex },
        { "sender.name": searchRegex },
        { "receiver.name": searchRegex },
        { invoiceNumber: searchRegex },
      ]
    }

    if (country.trim()) {
      query["receiver.country"] = { $regex: country.trim(), $options: "i" }
    }

    if (clientCode.trim()) {
      query.refCode = clientCode.trim()
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        query.date.$gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.date.$lte = end
      }
    }

    const isPaginated = page !== null && pageSize !== null

    let baseQuery = Awb.find(query)
      .sort({ date: -1 })
      .select(
        "date invoiceNumber trackingNumber refCode receiver.country receiver.name sender.name forwardingNumber forwardingLink parcelStatus cNoteNumber",
      )

    if (isPaginated) {
      const skip = (page - 1) * pageSize
      baseQuery = baseQuery.skip(skip).limit(pageSize)
    }

    const [awbs, totalCount] = await Promise.all([baseQuery.lean(), Awb.countDocuments(query)])

    if (isPaginated) {
      const totalPages = Math.ceil(totalCount / pageSize)
      return NextResponse.json({
        data: awbs,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      })
    } else {
      return NextResponse.json({
        data: awbs,
        totalCount,
      })
    }
  } catch (error) {
    console.error("Error fetching Awb:", error.message)
    return NextResponse.json({ error: "Failed to fetch Awb" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    console.log("Inside /api/awb");
    await connectToDB();
    const data = await req.json();

    console.log(data);

    const awb = new Awb(data);
    await awb.save();

    // Update or create customer1 (sender)
    await Customer.findOneAndUpdate(
      {
        name: data.sender.name,
        owner: data.staffId
      },
      {
        $set: {
          companyName: data.sender.companyName,
          email: data.sender.email,
          address: data.sender.address,
          address2: data.sender.address2,
          city: data.sender.city,
          state: data.sender.state,
          country: data.sender.country,
          zip: data.sender.zip,
          contact: data.sender.contact,
          kyc: data.sender.kyc,
          gst: data.sender.gst,
          role: "customer",
          owner: data.staffId,
        },
      },
      { upsert: true, new: true }
    );

    // Update or create customer2 (receiver)
    await Customer.findOneAndUpdate(
      {
        name: data.receiver.name,
        owner: data.staffId
      },
      {
        $set: {
          companyName: data.receiver.companyName,
          email: data.receiver.email,
          address: data.receiver.address,
          address2: data.receiver.address2,
          city: data.receiver.city,
          state: data.receiver.state,
          country: data.receiver.country,
          zip: data.receiver.zip,
          contact: data.receiver.contact,
          kyc: data.receiver.kyc,
          gst: data.receiver.gst,
          role: "customer",
          owner: data.staffId,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      { message: "Parcel added successfully!", awb },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/awb:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}