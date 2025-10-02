import mongoose from "mongoose"

const ProductSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  hsnCode: {
    type: String,
    required: [true, "HSN code is required"],
    trim: true,
  },
  qty: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0, "Quantity cannot be negative"],
    default: 0,
  },
  rate: {
    type: Number,
    required: [true, "Rate is required"],
    min: [0, "Rate cannot be negative"],
    default: 0,
  },
  discount: {
    type: Number,
    min: [0, "Discount cannot be negative"],
    max: [100, "Discount cannot exceed 100%"],
    default: 0,
  },
  discountAmount: {
    type: Number,
    min: [0, "Discount amount cannot be negative"],
    default: 0,
  },
  taxableAmount: {
    type: Number,
    min: [0, "Taxable amount cannot be negative"],
    default: 0,
  },
  amount: {
    type: Number,
    min: [0, "Amount cannot be negative"],
    default: 0,
  },
})

const TaxSchema = new mongoose.Schema({
  cgst: {
    type: Number,
    min: [0, "CGST cannot be negative"],
    max: [100, "CGST cannot exceed 100%"],
    default: 0,
  },
  sgst: {
    type: Number,
    min: [0, "SGST cannot be negative"],
    max: [100, "SGST cannot exceed 100%"],
    default: 0,
  },
  igst: {
    type: Number,
    min: [0, "IGST cannot be negative"],
    max: [100, "IGST cannot exceed 100%"],
    default: 0,
  },
  cgstAmount: {
    type: Number,
    min: [0, "CGST amount cannot be negative"],
    default: 0,
  },
  sgstAmount: {
    type: Number,
    min: [0, "SGST amount cannot be negative"],
    default: 0,
  },
  igstAmount: {
    type: Number,
    min: [0, "IGST amount cannot be negative"],
    default: 0,
  },
  totalTaxAmount: {
    type: Number,
    min: [0, "Total tax amount cannot be negative"],
    default: 0,
  },
})

const StockSchema = new mongoose.Schema(
  {
    partyName: {
      type: String,
      required: [true, "Party name is required"],
      trim: true,
    },
    gstNo: {
      type: String,
      required: [true, "GST number is required"],
      trim: true,
    },
    invoiceNo: {
      type: String,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    products: {
      type: [ProductSchema],
      validate: {
        validator: (products) => products && products.length > 0,
        message: "At least one product is required",
      },
    },
    tax: {
      type: TaxSchema,
      default: () => ({
        cgst: 0,
        sgst: 0,
        igst: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTaxAmount: 0,
      }),
    },
    subtotal: {
      type: Number,
      min: [0, "Subtotal cannot be negative"],
      default: 0,
    },
    totalDiscountAmount: {
      type: Number,
      min: [0, "Total discount amount cannot be negative"],
      default: 0,
    },
    taxableAmount: {
      type: Number,
      min: [0, "Taxable amount cannot be negative"],
      default: 0,
    },
    totalAmount: {
      type: Number,
      min: [0, "Total amount cannot be negative"],
      default: 0,
    },
    type: {
      type: String,
      enum: {
        values: ["opening", "inward", "outward"],
        message: "Type must be one of: opening, inward, outward",
      },
      required: [true, "Transaction type is required"],
    },
    currentStock: [
      {
        productName: String,
        hsnCode: String,
        qty: {
          type: Number,
          default: 0,
        },
        avgRate: {
          type: Number,
          default: 0,
        },
        totalValue: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Calculate totals before saving
StockSchema.pre("save", function (next) {
  try {
    let subtotal = 0
    let totalDiscountAmount = 0
    let taxableAmount = 0

    // Calculate product-wise amounts
    this.products.forEach((product) => {
      const baseAmount = product.qty * product.rate
      product.discountAmount = (baseAmount * product.discount) / 100
      product.taxableAmount = baseAmount - product.discountAmount
      product.amount = product.taxableAmount

      subtotal += baseAmount
      totalDiscountAmount += product.discountAmount
      taxableAmount += product.taxableAmount
    })

    this.subtotal = subtotal
    this.totalDiscountAmount = totalDiscountAmount
    this.taxableAmount = taxableAmount

    // Calculate tax amounts
    this.tax.cgstAmount = (taxableAmount * this.tax.cgst) / 100
    this.tax.sgstAmount = (taxableAmount * this.tax.sgst) / 100
    this.tax.igstAmount = (taxableAmount * this.tax.igst) / 100
    this.tax.totalTaxAmount = this.tax.cgstAmount + this.tax.sgstAmount + this.tax.igstAmount

    this.totalAmount = taxableAmount + this.tax.totalTaxAmount

    next()
  } catch (error) {
    next(error)
  }
})

// Clear the existing model if it exists to avoid OverwriteModelError
delete mongoose.models.Stock

export default mongoose.model("Stock", StockSchema)
