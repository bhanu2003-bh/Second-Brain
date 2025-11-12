import mongoose,{model,Schema} from "mongoose";
import { ref } from "process";

const Content = new Schema({
    'type' : {
      "type": "string",
      "enum": ["document","tweet","youtube","link"]
    },
    'link' : {
       type : String,
    },
    'title' : {
      type : String,
      require : true
    },
    'tags' : {
       type : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Tags'
       }]
    },
    'user' : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        require : true
    }
})

export const Contents = model('Contents',Content);