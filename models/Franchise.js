import mongoose, { Schema, model, models } from "mongoose";

const RateRowSchema = new Schema({
  kg: Number,
  zones: { type: Map, of: Number }, // e.g. { "1": 1092, "2": 1085 }
});

const ZoneSchema = new Schema({
  zone: String,
  countries: [String],
  extraCharges: { type: Map, of: Number },
});

const RateSheetSchema = new Schema({
  type: String,        // e.g. dhl/fedex
  service: String,     // e.g. SUNEX-D
  originalName: String,
  covidCharges: String,
  fuelCharges: String,
  uploadedAt: { type: Date, default: Date.now },
  rates: [RateRowSchema],
  zones: [ZoneSchema],
});

const FranchiseSchema = new Schema({
  name: String,
  firmName: String,
  code: { type: String, unique: true },
  email: String,
  contact: String,
  address: String,
  isBranch: String,
  branchOf: String,
  panNo: String,
  aadhaarNo: String,
  gstNo: String,
  bankAccountName: String,
  bankAccountNumber: String,
  bankIfscCode: String,
  password: String,

  // old one, keep as it is
  rates: [
    {
      country: String,
      percent: Number,
    },
  ],

  // new structured sheets
  rateSheets: [RateSheetSchema],
});

const Franchise = models.Franchise || model("Franchise", FranchiseSchema);

export default Franchise;
