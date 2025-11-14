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
import { Link } from './Schemas/Link';




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
       req.id  =  value.id;
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
       console.log("Tags :"+tags);
       const arr = new Set<mongoose.Types.ObjectId>();
     for(let i = 0;i<tags.length;i++){
      console.log("tag:" + tags[i]);
        try {
            let obj = await Tags.findOne({
                "title" : tags[i]
            });
            
          if(obj)  arr.add(obj._id);
          else{
               let obj = await Tags.create({
                'title' : tags[i]
               })
               arr.add(obj._id);              
          }
        } catch (error) {
               res.status(500).json({
                'message' : 'Database Issue',
                'error' : 'Error:'+ error
               })
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



app.get('/api/v1/content',auth,async(req:CustomRequest,res:Response)=>{
  const id = req.id;

interface content_interface{
    "id": string;
			"type":  string;
			"link": string;
			"title": string;
			"tags": string[];
}

  const st : content_interface[] = [];

   try {
    const obj = await Contents.find({
      'user' : id
    })

for (let [index, value] of obj.entries()) {
  const tags_values: string[] = [];

  for (let tagId of value.tags) {
    try {
      const a = await Tags.findById(tagId);
      if (a) tags_values.push(a.title as string);
    } catch (error) {
      return res.status(500).json({
        message: 'DB Crashes',
        error: error
      });
      return;
    }
  }

  st.push({
    id: value.id as string,
    link: value.link as string,
    title: value.title as string,
    type: value.type as string,
    tags: tags_values
  });
}

    res.status(200).json({
      'message' : "Sucessfull",
      'content' : st,
      'error' : 'NULL'
    })
   } catch (error) {
    res.status(500).json({
      'message' : 'Failed',
      'error' : 'NULL'
    })
   }

})


app.delete('/api/v1/content',auth,async(req:CustomRequest,res:Response)=>{
   const id = req.id;
     interface delete_interface{ 
    acknowledged: boolean;
     deletedCount: number 
    }

  try {
      const db_response : delete_interface = await Contents.deleteOne({
              'user' : id,
        '_id' : req.body.contentId as string  
      })

       console.log(db_response.acknowledged +"----"+db_response.deletedCount);
      if(db_response.deletedCount){
         res.status(200).json({
          'message' : 'Deleted Succeed',
          'error' : 'NULL',
         })
      }
      else{
        res.status(403).json({
          'message' : ' Trying to delete a doc you don’t own',
          'error' : 'not able to delete'
        })
      }

  } catch (error) {
           res.status(500).json({
          'message' : "Server Issue",
          'error' : 'Error:'+error
        })
  }

})


app.post('/api/v1/brain/share',auth,async(req:CustomRequest,res:Response)=>{
       const id = req.id;
        const flag = req.body.share;

       try {
         let db_response = await Link.findOne({
          'user' : id
         });
         if(db_response){
            if(!flag){
               await Link.deleteOne({
                'user' : id,
               })
               res.status(200).json({
                'message' : 'Remove Share Link',
                'error' : 'NULL'
               })
            }
            else{
              res.status(200).json({
                 'message' : 'Operation sucessed',
              'link' : db_response.link,
              'error': 'NULL'
              })
            }
         }
         else{
               
               const shareId = id;
        
            let db_response = await Link.create({
              'link' : id,
              'user' : id
            }) 
            res.status(200).json({
              'message' : 'Operation sucessed',
              'link' : id,
              'error': 'NULL'
            })
         }
       } catch (error) {
          res.status(200).json({
             'message' : 'DB Crashes',
             'error' : 'Error:'+error
          })
       }
})


app.get('/api/v1/share/:id',auth,async (req, res) => {

  try {
    const contenturl = req.params.id;
      
    const db_result = await Link.findOne({
      'link': contenturl
    });
    
    const user = await Userdb.findOne({
      '_id' : db_result?.user
    })
    const username = user?.username;
   const id  = db_result?.user;
    interface content_interface{
    "id": string;
			"type":  string;
			"link": string;
			"title": string;
			"tags": string[];
}

  const st : content_interface[] = [];

   try {
    const obj = await Contents.find({
      'user' : id
    })

for (let [index, value] of obj.entries()) {
  const tags_values: string[] = [];

  for (let tagId of value.tags) {
    try {
      const a = await Tags.findById(tagId);
      if (a) tags_values.push(a.title as string);
    } catch (error) {
      return res.status(500).json({
        message: 'DB Crashes',
        error: error
      });
      return;
    }
  }

  st.push({
    id: value.id as string,
    link: value.link as string,
    title: value.title as string,
    type: value.type as string,
    tags: tags_values
  });
}

    res.status(200).json({
      'message' : "Sucessfull",
      'result' : {
        'username' : username,
        'content' : st
      },
      'error' : 'NULL'
    })
   } catch (error) {
    res.status(500).json({
      'message' : 'Failed',
      'error' : 'NULL'
    })
   }


  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))