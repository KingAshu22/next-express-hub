import { connectToDB } from "@/app/_utils/mongodb"
import Franchise from "@/models/Franchise"
import { NextResponse } from "next/server"
import { withAuth, notFound } from "@/lib/auth/server"
import { ADMIN_ONLY } from "@/lib/auth/config"
import { canReadFranchise } from "@/lib/security/scope"
import { sanitizeFranchise } from "@/lib/security/sanitize"
import { escapeRegex } from "@/lib/security/regex"

const findByCode = (code) =>
  Franchise.findOne({ code: { $regex: `^${escapeRegex(code)}$`, $options: "i" } })

export const GET = withAuth(async (req, { params }, session) => {
  const { code } = await params
  await connectToDB()

  const franchise = await findByCode(code).lean()
  if (!(await canReadFranchise(session, franchise))) return notFound("Franchise not found")

  return NextResponse.json(sanitizeFranchise(franchise, session)) // single object, not array
})

export const PUT = withAuth(
  async (req, { params }, session) => {
    await connectToDB()
    const { code } = await params
    const body = await req.json()
    for (const key of Object.keys(body || {})) if (key.startsWith("$")) delete body[key]
    delete body._id
    delete body.tokenVersion
    // Empty password = keep the current one (handled by the model plugin)

    const updatedFranchise = await Franchise.findOneAndUpdate({ code: String(code) }, body, { new: true })
    if (!updatedFranchise) return notFound("Franchise not found")

    return NextResponse.json({
      message: "Franchise updated successfully!",
      updatedFranchise: sanitizeFranchise(updatedFranchise, session),
    })
  },
  { roles: ADMIN_ONLY }
)

export const DELETE = withAuth(
  async (req, { params }) => {
    await connectToDB()
    const { code } = await params
    const deletedFranchise = await Franchise.findOneAndDelete({ code: String(code) })

    if (!deletedFranchise) return notFound("Franchise not found")
    return NextResponse.json({ message: "Franchise deleted successfully!" }, { status: 200 })
  },
  { roles: ADMIN_ONLY }
)
