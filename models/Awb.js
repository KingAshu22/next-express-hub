import mongoose, { Schema, model, models } from "mongoose";
import { UserSchema } from "./User";

const AwbSchema = new Schema({
  parcelType: String,
  staffId: String,
  invoiceNumber: String,
  date: Date,
  trackingNumber: Number,
  sender: UserSchema,
  receiver: UserSchema,
  billTo: UserSchema,
  zone: String,
  gst: String,
  boxes: Array,
  parcelStatus: Array,
  parcelValue: Number,
});

const Awb = models.AwbSchema || model("Awb", AwbSchema);

export default Awb;
