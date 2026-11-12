import mongoose, { Schema, model, models } from "mongoose";
import { passwordHashingPlugin } from "@/lib/auth/password";

export const AdminSchema = new Schema({
  name: String,
  email: String,
  password: { type: String, select: false }, // bcrypt hash
  tokenVersion: { type: Number, default: 0 }, // bump to revoke all sessions
});

AdminSchema.plugin(passwordHashingPlugin);
AdminSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.tokenVersion;
    return ret;
  },
});

const Admin = models.Admin || model("Admin", AdminSchema);

export default Admin;
