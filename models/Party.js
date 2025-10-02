import mongoose from "mongoose"

const PartySchema = new mongoose.Schema(
  {
    partyName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    gstNo: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    products: [
      {
        productName: {
          type: String,
          required: true,
        },
        hsnCode: {
          type: String,
          required: true,
        },
        lastRate: {
          type: Number,
          default: 0,
        },
        lastPurchaseDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Party || mongoose.model("Party", PartySchema)
