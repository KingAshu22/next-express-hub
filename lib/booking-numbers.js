// lib/booking-numbers.js
import { randomInt } from "crypto";
import Awb from "@/models/Awb";

// Cryptographically random 10-digit number: tracking numbers are the only
// "key" to the public tracking page, so they must not be guessable.
const generateTrackingNumber = () => randomInt(1000000000, 10000000000);

export async function getUniqueTrackingNumber() {
  for (;;) {
    const trackingNumber = generateTrackingNumber();
    const exists = await Awb.exists({ trackingNumber: String(trackingNumber) });
    if (!exists) return trackingNumber;
  }
}

export async function getNextBookingNumbers() {
  const lastAwb = await Awb.findOne({}).sort({ _id: -1 }).select("invoiceNumber").lean();
  return {
    invoiceNumber: lastAwb ? lastAwb.invoiceNumber : "0",
    trackingNumber: await getUniqueTrackingNumber(),
  };
}
