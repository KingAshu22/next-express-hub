import mongoose, { Schema, models, model } from "mongoose"

const BillingSchema = new Schema({
  billNumber: { type: String, required: true, unique: true }, 
  financialYear: { type: String, required: true },
  invoiceType: { type: String, enum: ["gst", "non-gst"], default: "gst" },
  billingInfo: {
    name: String,
    address: String,
    gst: String,
  },
  awbs: [
    {
      awbId: { type: Schema.Types.ObjectId, ref: "Awb" },
      trackingNumber: String,
      weight: Number,
      ratePerKg: Number,
      amount: Number,
      country: String,
    },
  ],
  subtotal: Number,
  cgst: Number,
  sgst: Number,
  igst: Number,
  cgstAmount: Number,
  sgstAmount: Number,
  igstAmount: Number,
  total: Number,
  
  // --- Updated Payment Fields ---
  paid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  paymentHistory: [
    {
      amount: Number,
      date: Date,
      mode: { type: String, enum: ["Cash", "Cheque", "UPI", "Bank Transfer"] },
      reference: String, // Cheque No or Transaction ID
      notes: String,
      recordedAt: { type: Date, default: Date.now }
    }
  ],
  // -----------------------------

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastEditedBy: String,
})

export default models.Billing || model("Billing", BillingSchema)