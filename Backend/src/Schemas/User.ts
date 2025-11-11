import mongoose,{model, Schema} from "mongoose";
import { boolean } from "zod";


const UserSchema = new Schema({
    username: {type: String, unique : true},
    password: String
})

export const Userdb = model("User", UserSchema);
