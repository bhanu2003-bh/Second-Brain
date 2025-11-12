import express, { Request,Response,NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import z, { email } from 'zod';
import bcrypt from 'bcrypt';
import {Userdb} from './Schemas/User';
import dotenv from "dotenv";
import { Contents } from './Schemas/Content';
import { Tags } from './Schemas/Tags';


// importing interface
 interface Respo {
    'message' : string;
    'error' : string;
}

//change in class
interface CustomRequest extends Request{
 id? : string,
};

//constants
const app = express();


// Middlewares
app.use(express.json());
app.use(cors());
dotenv.config();

const auth = (req:CustomRequest,res:Response,next:NextFunction)=>{
   const token = req.headers.token;

   try {
       let value : any = jwt.verify(token as string,process.env.JWT_SECRET as string);
       value.id  =  req.id;
       next();
   } catch (error) {
    res.status(401).json({
        "message" : "Wrong Token",
        "error" : error
    })
   }

   
}


const port = process.env.PORT || 3000;


//MONGO Connect
const MONGO_URL : string = process.env.MONGO_URI || "";
mongoose.connect(MONGO_URL);


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
        'error' : 'Error:' + result.error.message
      }
      res.status(411).json(responsejson);
      return;
    }

const username :string = req.body.username;
const password :string = req.body.password;
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
    res.status(403).json(responsejson);
    return;
     }

    //DB query  
      const dbresult = await Userdb.insertOne({
        'username' : username,
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



app.post('/api/v1/signin',async(req,res)=>{
    console.log(req.body.username + " " + req.body.password)
    const username:string = req.body.username;
    const password:string = req.body.password;

    try{
       const dbresult = await Userdb.findOne({
        'username' : username
       });
       if(!dbresult){
         res.status(403).json({
            "message" : "Wrong Username",
            "error" : "Error"
         })
        return;
       }
        let encryptedpassword : any =  dbresult.password;
       let result : boolean = await bcrypt.compare(password , encryptedpassword);

       if(!result){
         res.status(403).json({
            "message" : "Wrong Password",
            "error" : "Error"
         })
        return;           
       }
       const token = jwt.sign({
        'id' : dbresult._id
       } ,process.env.JWT_SECRET as string);

       res.status(200).json({
        'message' : 'Signin Sucessfully',
        'token' : token,
        'error' : 'null'
       })
    }
    catch(error){
       res.status(500).json({
        'message' : 'Server Side issue',
        'error' : 'Error:'+error
       })       
    }

})


app.post('/api/v1/content',auth,async(req:CustomRequest,res : Response)=>{
        const id = req.id;

     const type : string = req.body.type;
     const link :string = req.body.link;
      const title : string = req.body.title;
      const tags : string[] = req.body.tags;
  
       const arr = new Set<mongoose.Types.ObjectId>();
     for(let i = 0;i<tags.length;i++){
        try {
            let obj = await Contents.findOne({
                "title" : tags[i]
            });
          if(obj)  arr.add(obj._id);
        } catch (error) {
           try {
              let obj = await Tags.create({
                'title' : tags[i]
             })
             arr.add(obj?._id);
           } catch (error) {
              res.status(500).json({
                'message' : 'Database Issue',
                'error' : 'Error:'+ error
              })
           }
        }
     }
      let newarr : mongoose.Types.ObjectId[] = Array.from(arr);

      try {
           let value = await Contents.create({
            'link' : link,
            'tags' : newarr,
            'title' : title,
            'type' : type,
            'user' : id,
           })

           res.status(200).json({
            'message' : 'Successfull',
            'error' : 'NULL'
           })
      } catch (error) {
          res.json(500).json({
            'message' : 'Database Error',
            'error' : "Error:"+error
          })
      }
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))