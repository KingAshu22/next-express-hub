// models/VendorIntegration.js
import mongoose from "mongoose"

// Service schema for ITD Software
const ITDServiceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  serviceCode: { type: String, required: true },
  apiServiceCode: { type: String, required: true },
})

// Service schema for Xpression Software
const XpressionServiceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  vendorCode: { type: String, default: "" },
  productCode: { type: String, default: "SPX" },
})

// Xpression credentials schema
const XpressionCredentialsSchema = new mongoose.Schema({
  apiUrl: { 
    type: String, 
    required: true,
    default: "http://courierjourney.xpresion.in/api/v1/Awbentry/Awbentry"
  },
  trackingUrl: {
    type: String,
    default: "http://courierjourney.xpresion.in/api/v1/Tracking/Tracking"
  },
  userId: { type: String, required: true },
  password: { type: String, required: true },
  customerCode: { type: String, required: true },
  originName: { type: String, default: "BOM" },
  services: [XpressionServiceSchema],
})

// ITD credentials schema
const ITDCredentialsSchema = new mongoose.Schema({
  apiUrl: { 
    type: String, 
    required: true,
    default: "https://online.expressimpex.com/docket_api"
  },
  companyId: { type: Number, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  services: [ITDServiceSchema],
  // Token cache (managed by system)
  cachedToken: { type: String, default: null },
  cachedCustomerId: { type: Number, default: null },
  tokenExpiresAt: { type: Date, default: null },
})

// Main Vendor Integration schema
const VendorIntegrationSchema = new mongoose.Schema(
  {
    vendorName: { 
      type: String, 
      required: true,
      trim: true,
    },
    vendorCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    softwareType: { 
      type: String, 
      enum: ["xpression", "itd"], 
      required: true 
    },
    isActive: { type: Boolean, default: true },
    description: { type: String, default: "" },
    
    // Credentials based on software type
    xpressionCredentials: {
      type: XpressionCredentialsSchema,
      default: null,
    },
    itdCredentials: {
      type: ITDCredentialsSchema,
      default: null,
    },
    
    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastUsedAt: { type: Date, default: null },
    usageCount: { type: Number, default: 0 },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Virtual to get all services regardless of type
VendorIntegrationSchema.virtual("allServices").get(function () {
  if (this.softwareType === "xpression" && this.xpressionCredentials) {
    return this.xpressionCredentials.services.map(s => ({
      name: s.serviceName,
      code: s.serviceName,
      apiCode: s.serviceName,
    }))
  }
  if (this.softwareType === "itd" && this.itdCredentials) {
    return this.itdCredentials.services.map(s => ({
      name: s.serviceName,
      code: s.serviceCode,
      apiCode: s.apiServiceCode,
    }))
  }
  return []
})

// Index for faster queries
VendorIntegrationSchema.index({ softwareType: 1, isActive: 1 })
VendorIntegrationSchema.index({ vendorCode: 1 })

export default mongoose.models.VendorIntegration || 
  mongoose.model("VendorIntegration", VendorIntegrationSchema)