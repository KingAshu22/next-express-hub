import mongoose, { Schema, model, models } from "mongoose";

const KYC_TYPES = [
  "Aadhaar No",
  "Pan No",
  "Passport No",
  "Driving License No",
  "Voter ID Card No",
  "GST No",
];

const KycSchema = new Schema(
  {
    type: { type: String, enum: KYC_TYPES, required: true },
    kyc: { type: String, required: true, trim: true },
    document: { type: String, required: true, trim: true }, // URL to document
  },
  { _id: false }
);

const RateSchema = new Schema(
  {
    country: { type: String, required: true, trim: true },
    profitPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const ClientSchema = new Schema(
  {
    // Ownership
    owner: {
      type: String, // "admin" or franchise/branch code
      required: true,
      index: true,
      trim: true,
    },

    // Fixed role (not editable)
    role: {
      type: String,
      enum: ["client"],
      default: "client",
      immutable: true,
      required: true,
    },

    // Identity
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true, default: "" },

    // Contact/location
    address: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    // Use String if you need to preserve leading zeros
    contact: { type: Number, required: true },

    // KYC
    kyc: { type: KycSchema, required: true },

    // Tax
    gstNo: { type: String, trim: true },

    // Login (plain text password as requested)
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // don’t return by default
      trim: true,
    },

    // Rates
    rates: {
      type: [RateSchema],
      default: [
        {
          country: "Rest of World",
          profitPercent: 0,
        },
      ],
      validate: {
        validator: function (val) {
          if (!Array.isArray(val) || val.length < 1) return false;
          // Ensure country uniqueness
          const seen = new Set();
          for (const r of val) {
            const key = (r?.country || "").toLowerCase();
            if (!key) return false;
            if (seen.has(key)) return false;
            seen.add(key);
          }
          return true;
        },
        message:
          "Rates must include at least one entry and countries must be unique.",
      },
    },
  },
  { timestamps: true }
);

// Hide password in JSON output (extra safety)
ClientSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
  versionKey: false,
});

const Client = models.Client || model("Client", ClientSchema);
export default Client;