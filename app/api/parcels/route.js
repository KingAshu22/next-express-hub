import { connectToDB } from "@/app/_utils/mongodb";
import Parcel from "@/models/Parcel";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/server";
import { ADMIN_ONLY } from "@/lib/auth/config";

export const GET = withAuth(
  async () => {
    await connectToDB();
    const parcels = await Parcel.find({}).sort({ _id: -1 });
    return NextResponse.json(parcels);
  },
  { roles: ADMIN_ONLY }
);
