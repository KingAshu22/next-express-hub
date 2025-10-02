import mongoose, { Schema, model, models } from "mongoose";

export const EstimateSchema = new Schema({
    code: String,
    date: Date,
    name: String,
    address: String,
    city: String,
    zipCode: String,
    country: String,
    weight: Number,
    receiverCity: String,
    receiverCountry: String,
    rate: Number,
    awbNumber: String,
    forwardingNumber: String,
    forwardingLink: String,
    subtotal: Number,
    discount: Number,
    total: Number,
});

const Estimate = models.Estimate || model("Estimate", EstimateSchema);

export default Estimate;
