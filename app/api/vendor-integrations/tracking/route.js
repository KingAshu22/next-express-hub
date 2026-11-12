// app/api/vendor-integrations/tracking/route.js
// Raw vendor tracking lookup by C-Note number - staff only.
// Customers use /api/track/[trackingNumber], which never exposes vendor numbers.
import { getVendorTracking, VendorTrackingError } from "@/lib/vendor-tracking"
import { withAuth } from "@/lib/auth/server"
import { OPS_ROLES } from "@/lib/auth/config"

const json = (data, status) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })

async function handle(params) {
  try {
    const result = await getVendorTracking(params)
    return json(result, 200)
  } catch (error) {
    console.error("Error fetching tracking:", error)
    const status = error instanceof VendorTrackingError ? error.status : 500
    return json({ success: false, error: status === 500 ? "Failed to fetch tracking data" : error.message }, status)
  }
}

export const POST = withAuth(
  async (request) => {
    const { awbNumber, vendorId, vendorName, forceSoftwareType } = await request.json()
    return handle({ awbNumber, vendorId, vendorName, forceSoftwareType })
  },
  { roles: OPS_ROLES }
)

export const GET = withAuth(
  async (request) => {
    const { searchParams } = new URL(request.url)
    return handle({
      awbNumber: searchParams.get("awbNumber"),
      vendorId: searchParams.get("vendorId"),
      vendorName: searchParams.get("vendorName"),
      forceSoftwareType: searchParams.get("forceSoftwareType"),
    })
  },
  { roles: OPS_ROLES }
)
