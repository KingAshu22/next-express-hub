import { Schema, model, models } from "mongoose";

export const RateSchema = new Schema({
    type: String,
    service: String,
    originalName: String,
    rates: Array,
    zones: [{
        zone: String,
        countries: Array,
        extraCharges: Object
    }]
});

const Rate = models.Rate || model("Rate", RateSchema);

export default Rate;
