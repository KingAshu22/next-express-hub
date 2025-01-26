import mongoose, { Schema, model, models } from "mongoose";

const ClientSchema = new Schema({
    name: String,
    code: String,
    email: String,
    password: String,
});

const Client = models.Client || model("Client", ClientSchema);

export default Client;
