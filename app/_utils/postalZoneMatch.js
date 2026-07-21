/**
 * Finds the best-matching postal zone for a given ZIP/postal code.
 *
 * Matching rules (in priority order):
 * 1. Contains match: the entered ZIP contains a zone's stored `zipCode`
 *    as a substring anywhere in it (this also covers exact and prefix
 *    matches). When multiple zones' codes match, the longest (most
 *    specific) match wins.
 * 2. Range match: the entered ZIP falls within a zone's `zipFrom`-`zipTo`
 *    numeric range. Used only when no contains match is found.
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
    const code = String(pz.zipCode).trim().toUpperCase();
    if (code && normalizedZip.includes(code) && code.length > bestSpecificity) {
      bestMatch = pz;
      bestSpecificity = code.length;
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
