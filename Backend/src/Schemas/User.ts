import mongoose from "mongoose";
const Schema = mongoose.Schema;

const user = new Schema({
    'email' : {
        types : String,
        unique : true,
        require : true
    },
    password : {
        type : String,
        unique : true,
        require : true
     }
})

const Userdb = mongoose.model('User',user);

export default Userdb;
