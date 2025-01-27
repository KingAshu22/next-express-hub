import mongoose, { Schema, model, models } from "mongoose";
import { UserSchema } from "./User";

const AwbSchema = new Schema({
  parcelType: String,
  staffId: String,
  invoiceNumber: String,
  date: Date,
  trackingNumber: String,
  sender: UserSchema,
  receiver: UserSchema,
  billTo: UserSchema,
  zone: String,
  gst: String,
  boxes: Array,
  parcelStatus: [
    {
      status: String,
      timestamp: Date,
      comment: String,
    }
  ],
  parcelValue: Number,
});

const Awb = models.Awb || model("Awb", AwbSchema);

export default Awb;
