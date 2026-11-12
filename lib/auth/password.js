// lib/auth/password.js
// bcrypt password hashing, with a transparent upgrade path for the old
// plain-text passwords already stored in the database.
import bcrypt from "bcryptjs"
import { timingSafeEqual } from "crypto"

const BCRYPT_ROUNDS = 12
const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/

export const isHashedPassword = (value) => typeof value === "string" && BCRYPT_PATTERN.test(value)

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), BCRYPT_ROUNDS)
}

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  if (bufA.length !== bufB.length) {
    // Compare against itself so the timing does not reveal the length mismatch early
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

// A real hash to compare against when the user does not exist, so a wrong
// email takes as long as a wrong password (prevents account enumeration).
let dummyHashPromise = null
const getDummyHash = () => (dummyHashPromise ||= bcrypt.hash("not-a-real-password", BCRYPT_ROUNDS))

/**
 * Checks a password against what is stored.
 * Returns { ok, needsUpgrade } - needsUpgrade is true when the stored value is
 * still plain text and should be replaced by a bcrypt hash.
 */
export async function verifyPassword(plain, stored) {
  if (typeof plain !== "string" || plain.length === 0) return { ok: false, needsUpgrade: false }
  if (!stored) {
    await bcrypt.compare(plain, await getDummyHash())
    return { ok: false, needsUpgrade: false }
  }
  if (isHashedPassword(stored)) {
    return { ok: await bcrypt.compare(plain, stored), needsUpgrade: false }
  }
  // Legacy plain-text value
  const ok = safeEqual(plain, stored)
  return { ok, needsUpgrade: ok }
}

/**
 * Mongoose plugin: hashes `password` whenever it is saved or updated with a
 * plain value, ignores empty values on update (so "leave blank to keep" works),
 * and bumps `tokenVersion` so every existing session is logged out.
 */
export function passwordHashingPlugin(schema) {
  schema.pre("save", async function () {
    if (!this.isModified("password")) return
    if (!this.password) return
    if (!isHashedPassword(this.password)) {
      this.password = await hashPassword(this.password)
    }
    if (!this.isNew) this.tokenVersion = (this.tokenVersion || 0) + 1
  })

  const handleUpdate = async function () {
    const update = this.getUpdate()
    if (!update) return
    const holders = [update, update.$set].filter(Boolean)
    for (const holder of holders) {
      if (!Object.prototype.hasOwnProperty.call(holder, "password")) continue
      const value = holder.password
      if (value === undefined || value === null || String(value).trim() === "") {
        delete holder.password
        continue
      }
      if (!isHashedPassword(value)) {
        holder.password = await hashPassword(String(value).trim())
      }
      update.$inc = { ...(update.$inc || {}), tokenVersion: 1 }
    }
    this.setUpdate(update)
  }

  schema.pre("findOneAndUpdate", handleUpdate)
  schema.pre("updateOne", handleUpdate)
  schema.pre("updateMany", handleUpdate)
}
