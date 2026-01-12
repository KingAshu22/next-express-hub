import mongoose from "mongoose"

const RateSchema = new mongoose.Schema(
  {
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },

    rateCategory: {
      type: String,
      enum: ["purchase", "sales"],
      required: true,
      default: "purchase",
    },

    purchaseRateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rate",
      default: null,
    },

    type: {
      type: String,
      trim: true,
      lowercase: true,
    },

    service: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    refCode: String,

    status: {
      type: String,
      enum: ["live", "unlisted", "hidden"],
      default: "hidden",
      required: true,
    },

    assignedTo: {
      type: [String],
      default: [],
    },

    rateMode: {
      type: String,
      enum: ["multi-country", "single-country-zip"],
      default: "multi-country",
    },

    targetCountry: {
      type: String,
      trim: true,
      default: "",
    },

    charges: [
      {
        chargeName: {
          type: String,
          required: true,
          trim: true,
        },
        chargeType: {
          type: String,
          required: true,
          enum: ["percentage", "perKg", "oneTime"],
        },
        chargeValue: {
          type: Number,
          required: true,
        },
      },
    ],

    rates: [
      {
        kg: {
          type: Number,
          required: true,
        },
      },
    ],

    zones: [
      {
        zone: {
          type: String,
          required: true,
        },
        countries: [String],
        extraCharges: [
          {
            chargeName: String,
            chargeType: String,
            chargeValue: Number,
          },
        ],
      },
    ],

    postalZones: [
      {
        zoneName: {
          type: String,
          required: true,
        },
        postalCodes: [String],
        originalInput: String,
        searchMode: {
          type: String,
          enum: ["exact", "contains", "startsWith"],
          default: "exact",
        },
      },
    ],
  },
  { timestamps: true },
)

// Index for faster queries
RateSchema.index({ vendorName: 1, service: 1 })
RateSchema.index({ status: 1, rateCategory: 1 })

export default mongoose.models.Rate || mongoose.model("Rate", RateSchema)
