// Escapes user input before it is used inside a Mongo $regex, so a search box
// can't be abused for ReDoS or to match everything with ".*".
export const escapeRegex = (value) => String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
