import mongoose, { Schema, model, models } from "mongoose";
import { UserSchema } from "./User";

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
});

const Awb = models.Awb || model("Awb", AwbSchema);

export default Awb;
