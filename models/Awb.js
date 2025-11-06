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
  awbLabel: String,
  boxLabel: String,
  awbNumber: String,
  forwardingNumber: String,
  forwardingLink: String,
  shippingCurrency: String,
  via: String,
  refCode: String,
  clientRefNo: String,
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
    zone: String,
    rate: String,
    baseCharge: String,
    totalWithGST: String,
    GST: String,
    weight: String,
  },
});

const Awb = models.Awb || model("Awb", AwbSchema);

export default Awb;
