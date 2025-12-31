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
      query.balance = { $lte: 0 }; // Less than or equal to 0
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

    // Pagination
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
    // (Optional: Optimization) Only fetch summary if not searching or if requested
    const summaryAgg = await Billing.aggregate([
      { $match: query },
      { 
        $group: {
          _id: null,
          totalAmount: { $sum: "$total" },
          totalPaid: { $sum: "$paid" },
          totalPending: { $sum: "$balance" },
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = summaryAgg.length > 0 ? {
      totalBills: summaryAgg[0].count,
      totalAmount: summaryAgg[0].totalAmount,
      totalPaid: summaryAgg[0].totalPaid,
      totalPending: summaryAgg[0].totalPending
    } : { totalBills: 0, totalAmount: 0, totalPaid: 0, totalPending: 0 };

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

    // Generate Bill Number
    // Find last bill of this financial year to increment
    const lastBill = await Billing.findOne({ financialYear })
      .sort({ createdAt: -1 })
      .select('billNumber')
      .exec();

    let nextNumber = "0001";
    if (lastBill && lastBill.billNumber) {
      const parts = lastBill.billNumber.split("/");
      if (parts.length === 2) {
        const lastNumber = parseInt(parts[1], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = String(lastNumber + 1).padStart(4, "0");
        }
      }
    }

    const billNumber = `${financialYear}/${nextNumber}`;

    const newBill = new Billing({
      ...data,
      financialYear,
      billNumber,
      // Ensure initial paid/balance logic is correct
      paid: data.paid || 0,
      balance: (data.total || 0) - (data.paid || 0),
      paymentHistory: [], // Start empty unless logic added to pay on create
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