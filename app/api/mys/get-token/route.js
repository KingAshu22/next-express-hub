import { connectToDB } from "@/app/_utils/mongodb"

// You might want to store tokens in a database or cache
// For simplicity, using in-memory cache with expiration
let tokenCache = {
  token: null,
  customerId: null,
  expiresAt: null,
}

const EXPRESS_IMPEX_AUTH_URL = "http://admin.myslogistics.online/docket_api/get_token"

export async function getExpressImpexToken() {
  // Check if we have a valid cached token (with 5-minute buffer)
  if (tokenCache.token && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt - 300000) {
    return {
      token: tokenCache.token,
      customerId: tokenCache.customerId,
    }
  }

  // Request new token
  const response = await fetch(EXPRESS_IMPEX_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_id: 4,
      email: "sssukerkar@gmail.com",
      password: "tu12345",
    }),
  })

  if (!response.ok) {
    throw new Error(`Express Impex Auth API error: ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.success || !result.data?.token) {
    throw new Error(result.errors?.join(", ") || "Failed to get Express Impex token")
  }

  // Cache the token (assuming 24-hour validity, adjust as needed)
  tokenCache = {
    token: result.data.token,
    customerId: result.data.customer_id,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }

  return {
    token: result.data.token,
    customerId: result.data.customer_id,
  }
}

export async function POST(request) {
  try {
    const tokenData = await getExpressImpexToken()

    return new Response(
      JSON.stringify({
        success: true,
        data: tokenData,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error getting Express Impex token:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to get Express Impex token",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}