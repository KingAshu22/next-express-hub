// app/api/vendor-integrations/tracking/route.js
import { getVendorTracking, VendorTrackingError } from "@/lib/vendor-tracking"

const json = (data, status) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })

async function handle(params) {
  try {
    const result = await getVendorTracking(params)
    return json(result, 200)
  } catch (error) {
    console.error("Error fetching tracking:", error)
    const status = error instanceof VendorTrackingError ? error.status : 500
    return json({ success: false, error: error.message || "Failed to fetch tracking data" }, status)
  }
}

export async function POST(request) {
  const { awbNumber, vendorId, vendorName, forceSoftwareType } = await request.json()
  return handle({ awbNumber, vendorId, vendorName, forceSoftwareType })
}

// GET method for simple tracking lookups
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  return handle({
    awbNumber: searchParams.get("awbNumber"),
    vendorId: searchParams.get("vendorId"),
    vendorName: searchParams.get("vendorName"),
    forceSoftwareType: searchParams.get("forceSoftwareType"),
  })
}
