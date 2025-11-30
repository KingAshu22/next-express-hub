import { NextResponse } from "next/server";
import { connectToDB } from "@/app/_utils/mongodb";
import Billing from "@/models/Billing";
import Awb from "@/models/Awb";

// Function to get current financial year string like "2025-26"
function getFinancialYear() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // April = 4
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}

// GET - Fetch all bills
export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || ""; // "paid", "pending", or ""
    const financialYear = searchParams.get("financialYear") || "";
    const clientCode = searchParams.get("clientCode") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // Build query
    const query = {};

    // Search filter
    if (search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { billNumber: searchRegex },
        { "billingInfo.name": searchRegex },
        { "billingInfo.gst": searchRegex },
        { clientFranchiseCode: searchRegex },
      ];
    }

    // Status filter
    if (status === "paid") {
      query.balance = 0;
    } else if (status === "pending") {
      query.balance = { $gt: 0 };
    }

    // Financial year filter
    if (financialYear.trim()) {
      query.financialYear = financialYear.trim();
    }

    // Client/Franchise code filter
    if (clientCode.trim()) {
      query.clientFranchiseCode = clientCode.trim();
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Check if pagination is requested
    const isPaginated = page && pageSize;

    let baseQuery = Billing.find(query).sort({ createdAt: -1 });

    if (isPaginated) {
      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      baseQuery = baseQuery.skip(skip).limit(parseInt(pageSize));
    }

    const [bills, totalCount] = await Promise.all([
      baseQuery.lean(),
      Billing.countDocuments(query),
    ]);

    // Calculate summary
    const allBillsForSummary = await Billing.find(query)
      .select("total paid balance")
      .lean();

    const summary = {
      totalBills: totalCount,
      totalAmount: allBillsForSummary.reduce((sum, b) => sum + (b.total || 0), 0),
      totalPaid: allBillsForSummary.reduce((sum, b) => sum + (b.paid || 0), 0),
      totalPending: allBillsForSummary.reduce((sum, b) => sum + (b.balance || 0), 0),
    };

    if (isPaginated) {
      const totalPages = Math.ceil(totalCount / parseInt(pageSize));
      return NextResponse.json({
        data: bills,
        summary,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalCount,
          totalPages,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      });
    }

    return NextResponse.json({
      data: bills,
      summary,
      totalCount,
    });
  } catch (err) {
    console.error("Error fetching bills:", err);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

// POST - Create new bill
export async function POST(req) {
  try {
    await connectToDB();
    const data = await req.json();

    const financialYear = getFinancialYear();

    // Find last bill of this financial year
    const lastBill = await Billing.findOne({ financialYear })
      .sort({ createdAt: -1 })
      .exec();

    let nextNumber = "0001";
    if (lastBill) {
      const lastNumber = parseInt(lastBill.billNumber.split("/")[1], 10);
      nextNumber = String(lastNumber + 1).padStart(4, "0");
    }

    const billNumber = `${financialYear}/${nextNumber}`;

    const newBill = new Billing({
      ...data,
      financialYear,
      billNumber,
    });

    await newBill.save();

    // Mark AWBs as billed
    if (data.awbs && data.awbs.length > 0) {
      const awbIds = data.awbs.map((awb) => awb.awbId);
      await Awb.updateMany(
        { _id: { $in: awbIds } },
        { 
          $set: { 
            isBilled: true, 
            billNumber: billNumber,
            billedAt: new Date()
          } 
        }
      );
    }

    return NextResponse.json(
      { message: "Bill created successfully", bill: newBill },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating bill:", err);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}