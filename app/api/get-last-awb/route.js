import { connectToDB } from "@/app/_utils/mongodb";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/server";
import { ROLES } from "@/lib/auth/config";
import { getNextBookingNumbers } from "@/lib/booking-numbers";

export const GET = withAuth(
  async () => {
    await connectToDB();
    return NextResponse.json(await getNextBookingNumbers());
  },
  { roles: [ROLES.ADMIN, ROLES.BRANCH, ROLES.FRANCHISE, ROLES.CLIENT] }
);
