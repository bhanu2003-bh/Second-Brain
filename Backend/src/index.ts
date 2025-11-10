import express, { response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import z, { email } from 'zod';
import bcrypt from 'bcrypt';
import Userdb from './Schemas/User.js';


// importing interface
import {Respo} from './Interface/Response.js'

const app = express();
app.use(express.json());
const port = 3000;




mongoose.connect('mongodb+srv://sbhanupratap2003_db_user:0jfRHJNGt0bCD8cO@cluster0.epdwcfq.mongodb.net/Second-Brain');

//constants
const value  = z.object({
    'username' : z.string({"message" : "Not in string format"}).min(3,{
        "message" : "Email is too short" 
    }),
    'password' : z.string({"message" : "Not in string format"})
    .min(8,{"message" : "Password is short"})
    .max(120,{"message" : "Password is too long"})
})





app.post('/api/v1/signup', async(req, res)=> {

    const result = value.safeParse(req.body);

    if(!result.success){
        const responsejson : Respo = {
        'message' : ' Error in inputs',
        'error' : 'Error'
      }
      res.status(411).json(responsejson);
      return;
    }

const username = req.body.username;
const password = req.body.password;
const hashpassword = bcrypt.hashSync(password,5);

try {
     //DB query to check wether user already exist
     let existingUser = await Userdb.findOne({
        'username' : username
     });
     if(existingUser){
    const responsejson : Respo = {
        'message' : "User Already Exist",
        'error' : 'NULL'
    }
    res.status(200).json(responsejson);
    return;
     }

    //DB query  
      const dbresult = await Userdb.insertOne({
        'email' : email,
        'password' : hashpassword
      })

    const responsejson : Respo = {
        'message' : "Signed up",
        'error' : 'NULL'
    }
    res.status(200).json(responsejson);
} catch (error) {
    const responsejson : Respo = {
        'message' : "Server Crashed",
        'error' : 'Error'
    }
    res.status(500).json(responsejson);
}

   
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))