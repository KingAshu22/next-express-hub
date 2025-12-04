import mongoose, { Schema, model, models } from "mongoose";
import { UserSchema } from "./User";

// Sub-schema for individual charges
const ChargeSchema = new Schema({
  name: String,
  amount: Number,
});

// New Schema for Payments
const PaymentSchema = new Schema({
  date: Date,
  mode: String, // Cash, Cheque, UPI, Transfer
  amount: Number,
  reference: String, // For Cheque No / Transaction ID
});

// Updated Financial Schema
const FinancialDetailSchema = new Schema({
  companyName: String, 
  serviceType: String,
  weight: {
    actual: Number,
    volume: Number,
    chargeable: Number,
  },
  rates: {
    ratePerKg: Number,
    baseTotal: Number, 
  },
  charges: {
    otherCharges: [ChargeSchema],
    awbCharge: Number,
    fuelSurcharge: Number, 
    fuelAmount: Number,
    cgstPercent: Number,
    cgstAmount: Number,
    sgstPercent: Number,
    sgstAmount: Number,
    igstPercent: Number,
    igstAmount: Number,
    gstAmount: Number, 
  },
  grandTotal: Number,
});

const AwbSchema = new Schema({
  parcelType: String,
  staffId: String,
  invoiceNumber: String,
  date: Date,
  trackingNumber: String,
  cNoteNumber: String,
  cNoteVendorName: String,
  awbNumber: String,
  forwardingNumber: String,
  forwardingLink: String,
  shippingCurrency: String,
  via: String,
  refCode: String,
  sender: UserSchema,
  receiver: UserSchema,
  billTo: UserSchema,
  zone: String,
  boxes: Array,
  ourBoxes: Array,
  vendorBoxes: Array,
  parcelStatus: [
    {
      status: String,
      location: String,
      timestamp: Date,
      comment: String,
    }
  ],
  parcelValue: Number,
  rateInfo: {
    courier: String,
    service: String,
    zone: String,
    weight: String,
    rate: String,
    baseCharge: String,
    fuelSurcharge: String,
    otherCharges: String,
    GST: String,
    totalWithGST: String,
  },
  financials: {
    sales: FinancialDetailSchema,
    purchase: FinancialDetailSchema,
    internalCosts: [ChargeSchema],
    
    // --- NEW FIELDS ---
    payments: [PaymentSchema], // Array of received payments
    notes: String, // WYSIWYG content
    
    netProfit: Number,
  }
});

const Awb = models.Awb || model("Awb", AwbSchema);

export default Awb;