import mongoose, { Schema, model, models } from "mongoose";

export const PickupSchema = new Schema({
  date: String,
  pickupNo: String,
  pickupFrom: String,
  pickupClient: String,
  pickupLocation: String,
  pickupBoxes: Array
});

const Pickup = models.Pickup || model("Pickup", PickupSchema);

export default Pickup;
