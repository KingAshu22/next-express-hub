import { model, models } from "mongoose";
import { UserSchema } from "./User";

const Customer = models.Customer || model("Customer", UserSchema);

export default Customer;