import mongoose, { Schema, model, models } from "mongoose";

export const UserSchema = new Schema({
    name: { type: String, required: true },
    companyName: String,
    email: String,
    address: { type: String, required: true },
    address2: String,
    city: String,
    state: String,
    country: String,
    zip: String,
    contact: String,
    kyc: Object,
    role: String,
    gst: String,
    owner: String,
});

const User = models.User || model("User", UserSchema);

export default User;
