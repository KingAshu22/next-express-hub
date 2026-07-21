/**
 * Finds the best-matching postal zone for a given ZIP/postal code.
 *
 * Matching rules (in priority order):
 * 1. Prefix match: the entered ZIP starts with a zone's stored `zipCode`
 *    (this also covers exact matches, since an exact match is just a
 *    prefix equal to the full ZIP). When multiple zones' prefixes match,
 *    the longest (most specific) prefix wins.
 * 2. Range match: the entered ZIP falls within a zone's `zipFrom`-`zipTo`
 *    numeric range. Used only when no prefix match is found.
 *
 * @param {string} zipCode - ZIP/postal code entered by the user.
 * @param {Array} postalZones - Array of { zone, zipCode, zipFrom, zipTo, ... }.
 * @returns {object|null} The matching postal zone entry, or null if none matches.
 */
export function findMatchingPostalZone(zipCode, postalZones) {
  if (!zipCode || !Array.isArray(postalZones)) return null;

  const normalizedZip = String(zipCode).trim().toUpperCase();
  if (!normalizedZip) return null;

  let bestMatch = null;
  let bestSpecificity = -1;

  for (const pz of postalZones) {
    if (!pz.zipCode) continue;
    const prefix = String(pz.zipCode).trim().toUpperCase();
    if (prefix && normalizedZip.startsWith(prefix) && prefix.length > bestSpecificity) {
      bestMatch = pz;
      bestSpecificity = prefix.length;
    }
  }

  if (bestMatch) return bestMatch;

  for (const pz of postalZones) {
    if (!pz.zipFrom || !pz.zipTo) continue;

    const zipFrom = String(pz.zipFrom).trim().toUpperCase();
    const zipTo = String(pz.zipTo).trim().toUpperCase();

    const zipNum = parseInt(normalizedZip.replace(/\D/g, ""), 10);
    const fromNum = parseInt(zipFrom.replace(/\D/g, ""), 10);
    const toNum = parseInt(zipTo.replace(/\D/g, ""), 10);

    const matches = !isNaN(zipNum) && !isNaN(fromNum) && !isNaN(toNum)
      ? zipNum >= fromNum && zipNum <= toNum
      : normalizedZip >= zipFrom && normalizedZip <= zipTo;

    if (matches) return pz;
  }

  return null;
}
