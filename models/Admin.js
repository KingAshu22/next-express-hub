import mongoose, { Schema, model, models } from "mongoose";

export const AdminSchema = new Schema({
  name: String,
  email: String,
  password: String,
});

const Admin = models.Admin || model("Admin", AdminSchema);

export default Admin;
