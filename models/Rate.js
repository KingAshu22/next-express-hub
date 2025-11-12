import mongoose from "mongoose"

const RateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
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
    rates: [
      {
        kg: {
          type: Number,
          required: true,
        },
        // Dynamic zone fields (1, 2, 3, etc. or a, b, c, etc.)
        // Using Mixed type to allow flexible zone naming
      },
    ],
    zones: [
      {
        zone: {
          type: String,
          required: true,
        },
        countries: [
          {
            type: String,
            required: true,
          },
        ],
        extraCharges: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    covidCharges: Number,
    fuelCharges: Number,
    awbCharges: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: false, // Allow dynamic fields for zone rates
    timestamps: true,
  },
)

// Create indexes for better performance
RateSchema.index({ type: 1 })
RateSchema.index({ createdAt: -1 })

// Pre-save middleware to update the updatedAt field
RateSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

// Pre-update middleware to update the updatedAt field
RateSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
  this.set({ updatedAt: new Date() })
  next()
})

const Rate = mongoose.models.Rate || mongoose.model("Rate", RateSchema)

export default Rate
