import mongoose,{model,Schema} from "mongoose";
import { ref } from "process";

const Links = new Schema({
    'link' : {
      type : String,
      require : true
    },
    'user' :{
      type : String,
      require : true,
      ref : 'User'
    }

})

export const Link = model('Link',Links);