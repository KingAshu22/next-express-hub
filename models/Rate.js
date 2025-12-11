// models/Rate.js
import mongoose from "mongoose"

const RateSchema = new mongoose.Schema(
  {
    // Vendor information
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Rate category: purchase (private/internal) or sales (can be shared)
    rateCategory: {
      type: String,
      enum: ["purchase", "sales"],
      required: true,
      default: "purchase",
    },
    
    // For sales rates only - reference to the linked purchase rate
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
    
    // Status for visibility
    // For purchase rates: always "hidden" (private - only visible to admin)
    // For sales rates: "live" (public), "unlisted" (assigned only), or "hidden"
    status: {
      type: String,
      enum: ["live", "unlisted", "hidden"],
      default: "hidden",
      required: true,
    },
    
    // For unlisted sales rates - list of assigned clients/franchises who can see this rate
    assignedTo: {
      type: [String],
      default: [],
    },
    
    // Rate mode: 'multi-country' or 'single-country-zip'
    rateMode: {
      type: String,
      enum: ["multi-country", "single-country-zip"],
      default: "multi-country",
    },
    
    // Target country for single-country-zip mode
    targetCountry: {
      type: String,
      trim: true,
      default: "",
    },
    
    // --- DYNAMIC CHARGES ---
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
    
    // Base rates (per kg row, per zone column)
    rates: [
      {
        kg: {
          type: Number,
          required: true,
        },
      },
    ],
    
    // Country-based zones (for multi-country mode)
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
    
    // ZIP/postal-code based zones
    postalZones: [
      {
        country: {
          type: String,
          required: true,
        },
        zone: {
          type: String,
          required: true,
        },
        zipCode: {
          type: String,
          default: null,
        },
        zipFrom: {
          type: String,
          default: null,
        },
        zipTo: {
          type: String,
          default: null,
        },
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
  }
)

// Indexes
RateSchema.index({ vendorName: 1 })
RateSchema.index({ rateCategory: 1 })
RateSchema.index({ purchaseRateId: 1 })
RateSchema.index({ type: 1 })
RateSchema.index({ status: 1 })
RateSchema.index({ createdAt: -1 })
RateSchema.index({ rateMode: 1 })
RateSchema.index({ targetCountry: 1 })
RateSchema.index({ "postalZones.country": 1 })
RateSchema.index({ "postalZones.zone": 1 })
RateSchema.index({ "postalZones.zipCode": 1 })
// Compound indexes for common queries
RateSchema.index({ vendorName: 1, rateCategory: 1 })
RateSchema.index({ rateCategory: 1, status: 1 })

// Custom validation for sales rates - must have a linked purchase rate
RateSchema.path('purchaseRateId').validate(function(value) {
  if (this.rateCategory === 'sales' && !value) {
    return false;
  }
  return true;
}, 'Sales rates must be linked to a purchase rate');

// pre-save hook
RateSchema.pre("save", function (next) {
  // Purchase rates should always be hidden (private/internal use only)
  if (this.rateCategory === "purchase") {
    this.status = "hidden";
    this.assignedTo = [];
    this.purchaseRateId = null; // Purchase rates don't have a parent
  }
  
  // Clear assignedTo if status is not unlisted
  if (this.status !== "unlisted") {
    this.assignedTo = [];
  }
  
  this.updatedAt = new Date();
  next();
})

// pre-update hooks
RateSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
  const update = this.getUpdate();
  
  // If updating to purchase category, force hidden status
  if (update.$set && update.$set.rateCategory === "purchase") {
    this.set({ 
      status: "hidden", 
      assignedTo: [],
      purchaseRateId: null 
    });
  }
  
  if (update.$set && update.$set.status && update.$set.status !== "unlisted") {
    this.set({ assignedTo: [] });
  }
  
  this.set({ updatedAt: new Date() });
  next();
})

// Virtual to populate the linked purchase rate details
RateSchema.virtual('purchaseRate', {
  ref: 'Rate',
  localField: 'purchaseRateId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included when converting to JSON
RateSchema.set('toJSON', { virtuals: true });
RateSchema.set('toObject', { virtuals: true });

const Rate = mongoose.models.Rate || mongoose.model("Rate", RateSchema)

export default Rate