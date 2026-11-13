// lib/auth/config.js
// Shared auth constants. No Node-only imports here: this file is also used by
// proxy.js and by client components.

export const ACCESS_COOKIE = "ko_at"
export const REFRESH_COOKIE = "ko_rt"

// Short-lived access token, silently renewed from the refresh token.
export const ACCESS_TTL_SECONDS = 15 * 60 // 15 minutes (renewed silently, users never notice)

// Idle timeout: a session stays alive as long as the user keeps using the site.
// Every renewal pushes the expiry forward again, so only users who did nothing
// for this long are asked to sign in again. Change this one value to adjust it.
export const IDLE_TIMEOUT_SECONDS = 60 * 60 // 1 hour
export const REFRESH_TTL_SECONDS = IDLE_TIMEOUT_SECONDS

export const JWT_ISSUER = "kargoone"
export const JWT_AUDIENCE = "kargoone-app"

export const ROLES = Object.freeze({
  ADMIN: "admin",
  BRANCH: "branch",
  CUSTOMER_SERVICE: "Customer Service",
  PICKUP: "pickup",
  FRANCHISE: "franchise",
  CLIENT: "client",
})

// Company staff. They may see vendor / C-Note details.
export const INTERNAL_ROLES = [ROLES.ADMIN, ROLES.BRANCH, ROLES.CUSTOMER_SERVICE, ROLES.PICKUP]
// Outside partners. They only ever see their own shipments, without vendor details.
export const EXTERNAL_ROLES = [ROLES.FRANCHISE, ROLES.CLIENT]
export const ALL_ROLES = [...INTERNAL_ROLES, ...EXTERNAL_ROLES]

// Common role groups used by the API routes
export const ADMIN_ONLY = [ROLES.ADMIN]
export const ADMIN_BRANCH = [ROLES.ADMIN, ROLES.BRANCH]
export const OPS_ROLES = [ROLES.ADMIN, ROLES.BRANCH, ROLES.CUSTOMER_SERVICE] // shipment operations
export const PICKUP_ROLES = [ROLES.ADMIN, ROLES.BRANCH, ROLES.PICKUP]

export const isInternalRole = (role) => INTERNAL_ROLES.includes(role)
export const isExternalRole = (role) => EXTERNAL_ROLES.includes(role)

const encoder = new TextEncoder()

function readSecret(name) {
  const value = process.env[name]
  if (!value || value.length < 32) {
    throw new Error(
      `${name} is missing or shorter than 32 characters. Set a long random value in your environment (.env / hosting dashboard).`
    )
  }
  return encoder.encode(value)
}

export const getAccessSecret = () => readSecret("AUTH_ACCESS_SECRET")
export const getRefreshSecret = () => readSecret("AUTH_REFRESH_SECRET")
