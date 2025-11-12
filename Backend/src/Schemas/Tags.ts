import mongoose,{model,Schema} from "mongoose";
import { ref } from "process";

const Tag = new Schema({
    'title' : {
      type : String,
      require : true
    },

})

export const Tags = model('Tags',Tag);