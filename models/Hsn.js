import mongoose, { Schema, model, models } from "mongoose";

export const HsnSchema = new Schema({
    item: String,
    code: String,
});

const Hsn = models.Hsn || model("Hsn", HsnSchema);

export default Hsn;
