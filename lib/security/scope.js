// lib/security/scope.js
// Decides WHICH records a signed-in user may touch.
//   - Internal staff (admin / branch / customer service / pickup): everything.
//   - Franchise: bookings booked under its own code + under its own clients' codes.
//   - Client: only bookings booked under its own code.
import Client from "@/models/Client"
import { ROLES, isInternalRole } from "@/lib/auth/config"

/**
 * Returns null when the user may see every booking, otherwise the list of
 * refCodes the user is allowed to see.
 */
export async function getAllowedRefCodes(session) {
  if (isInternalRole(session.role)) return null
  if (!session.code) return []
  if (session.role === ROLES.CLIENT) return [session.code]
  if (session.role === ROLES.FRANCHISE) {
    const clientCodes = await Client.find({ owner: session.code }).distinct("code")
    return [session.code, ...clientCodes]
  }
  return []
}

/** Mongo filter limiting Awb queries to what the user may see. */
export async function awbScopeFilter(session) {
  const allowed = await getAllowedRefCodes(session)
  return allowed === null ? {} : { refCode: { $in: allowed } }
}

export async function canAccessRefCode(session, refCode) {
  const allowed = await getAllowedRefCodes(session)
  return allowed === null || allowed.includes(refCode)
}

/** May this user read / manage the given Client document? */
export function canAccessClient(session, client) {
  if (!client) return false
  if (isInternalRole(session.role)) return true
  if (session.role === ROLES.FRANCHISE) return client.owner === session.code
  if (session.role === ROLES.CLIENT) return client.code === session.code
  return false
}

/** May this user read the given Franchise document? */
export async function canReadFranchise(session, franchise) {
  if (!franchise) return false
  if (isInternalRole(session.role)) return true
  if (session.role === ROLES.FRANCHISE) return franchise.code === session.code
  if (session.role === ROLES.CLIENT) {
    const me = await Client.findOne({ code: session.code }).select("owner").lean()
    return !!me && me.owner === franchise.code
  }
  return false
}

/**
 * Value stored as Customer.owner / Awb.staffId for this user
 * ("admin" for the admin account, otherwise the account's own id).
 */
export const ownerIdFor = (session) => (session.role === ROLES.ADMIN ? "admin" : String(session.id))
