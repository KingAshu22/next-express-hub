import { connectToDB } from "@/app/_utils/mongodb"
import Franchise from "@/models/Franchise"
import Client from "@/models/Client"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/server"
import { ROLES, ADMIN_ONLY, isInternalRole } from "@/lib/auth/config"
import { sanitizeFranchises, sanitizeFranchise } from "@/lib/security/sanitize"

// Passwords / bank details / identity documents are never part of a list.
const LIST_EXCLUDE = "-password -tokenVersion -bankAccountName -bankAccountNumber -bankIfscCode -panNo -aadhaarNo -rateSheets"

export const GET = withAuth(async (req, ctx, session) => {
  await connectToDB()

  if (isInternalRole(session.role)) {
    const franchises = await Franchise.find({}).select(LIST_EXCLUDE).sort({ _id: -1 }).lean()
    return NextResponse.json(sanitizeFranchises(franchises, session))
  }

  if (session.role === ROLES.FRANCHISE) {
    const me = await Franchise.find({ code: session.code }).select(LIST_EXCLUDE).lean()
    return NextResponse.json(sanitizeFranchises(me, session))
  }

  // Client: only the franchise it belongs to (letterhead info)
  const client = await Client.findOne({ code: session.code }).select("owner").lean()
  const owner = client?.owner ? await Franchise.find({ code: client.owner }).lean() : []
  return NextResponse.json(sanitizeFranchises(owner, session))
})

export const POST = withAuth(
  async (req, ctx, session) => {
    await connectToDB()
    const data = await req.json()
    delete data._id
    delete data.tokenVersion

    const newFranchise = new Franchise(data)
    await newFranchise.save()

    return NextResponse.json(
      { message: "Franchise added successfully!", newFranchise: sanitizeFranchise(newFranchise, session) },
      { status: 200 }
    )
  },
  { roles: ADMIN_ONLY }
)
