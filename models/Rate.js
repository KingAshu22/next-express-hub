import mongoose from "mongoose"

const RateSchema = new mongoose.Schema(
  {
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
    // --- NEW DYNAMIC CHARGES ---
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
          enum: ["percentage", "perKg", "oneTime"], // Defines the allowed types
        },
        chargeValue: {
          type: Number,
          required: true,
        },
      },
    ],
    // ---------------------------
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
    strict: false,
    timestamps: true,
  },
)

// Indexes remain the same
RateSchema.index({ type: 1 })
RateSchema.index({ status: 1 })
RateSchema.index({ createdAt: -1 })

// pre-save and pre-update hooks remain the same
RateSchema.pre("save", function (next) {
  if (this.status !== "unlisted") {
    this.assignedTo = []
  }
  this.updatedAt = new Date()
  next()
})

RateSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
  const update = this.getUpdate()
  if (update.$set && update.$set.status && update.$set.status !== 'unlisted') {
    this.set({ 'assignedTo': [] });
  }
  this.set({ updatedAt: new Date() })
  next()
})

const Rate = mongoose.models.Rate || mongoose.model("Rate", RateSchema)

export default Rate