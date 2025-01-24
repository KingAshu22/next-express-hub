import mongoose, { Schema, model, models } from "mongoose";
import { UserSchema } from "./User";

const ParcelSchema = new Schema({
    parcelType: String,
    staffId: String,
    invoiceNumber: String,
    date: {
        date: String,
        time: String,
    },
    fromCountry: String,
    toCountry: String,
    vesselFlight: String,
    portDischarge: String,
    originCountry: String,
    expRef: String,
    preCarriage: String,
    placeReceipt: String,
    portLoading: String,
    finalDestination: String,
    countryFinalDestination: String,
    trackingNumber: { type: Number, required: true },
    sender: UserSchema,
    receiver: UserSchema,
    billTo: UserSchema,
    zone: String,
    gst: String,
    boxes: Array,
    parcelStatus: Array,
    subtotal: Number,
    taxes: {
        cgst: {
            percent: Number,
            amount: Number,
        },
        sgst: {
            percent: Number,
            amount: Number,
        },
        igst: {
            percent: Number,
            amount: Number,
        },
    },
    total: Number,
    parcelValue: Number,
});

const Parcel = models.Parcel || model("Parcel", ParcelSchema);

export default Parcel;
