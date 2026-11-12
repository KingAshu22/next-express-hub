// lib/auth/tokens.js
// Signing / verification of the access + refresh JWTs (HS256, via jose).
import { SignJWT, jwtVerify, errors } from "jose"
import {
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
  JWT_ISSUER,
  JWT_AUDIENCE,
  getAccessSecret,
  getRefreshSecret,
} from "./config"

const buildClaims = (user) => ({
  role: user.role,
  code: user.code || "",
  name: user.name || "",
  ver: user.ver || 0,
})

export async function signAccessToken(user) {
  return new SignJWT({ ...buildClaims(user), typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(getAccessSecret())
}

export async function signRefreshToken(user) {
  return new SignJWT({ ...buildClaims(user), typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(`${REFRESH_TTL_SECONDS}s`)
    .sign(getRefreshSecret())
}

const toSession = (payload) => ({
  id: payload.sub,
  role: payload.role,
  code: payload.code || "",
  name: payload.name || "",
  ver: payload.ver || 0,
})

/**
 * Returns { session } on success, or { error: "TOKEN_EXPIRED" | "INVALID_TOKEN" | "NO_TOKEN" }.
 */
async function verify(token, secret, typ) {
  if (!token) return { error: "NO_TOKEN" }
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ["HS256"],
    })
    if (payload.typ !== typ || !payload.sub || !payload.role) return { error: "INVALID_TOKEN" }
    return { session: toSession(payload) }
  } catch (err) {
    if (err instanceof errors.JWTExpired) return { error: "TOKEN_EXPIRED" }
    return { error: "INVALID_TOKEN" }
  }
}

export const verifyAccessToken = (token) => verify(token, getAccessSecret(), "access")
export const verifyRefreshToken = (token) => verify(token, getRefreshSecret(), "refresh")
