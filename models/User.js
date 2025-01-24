import mongoose, { Schema, model, models } from "mongoose";

export const UserSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
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
