"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = __importDefault(require("zod"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("./Schemas/User");
const dotenv_1 = __importDefault(require("dotenv"));
//constants
const app = (0, express_1.default)();
// Middlewares
app.use(express_1.default.json());
app.use((0, cors_1.default)());
dotenv_1.default.config();
const port = process.env.PORT || 3000;
//MONGO Connect
const MONGO_URL = process.env.MONGO_URI || "";
mongoose_1.default.connect(MONGO_URL);
//constants
const value = zod_1.default.object({
    'username': zod_1.default.string({ "message": "Not in string format" }).min(3, {
        "message": "Email is too short"
    }),
    'password': zod_1.default.string({ "message": "Not in string format" })
        .min(8, { "message": "Password is short" })
        .max(120, { "message": "Password is too long" })
});
app.post('/api/v1/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = value.safeParse(req.body);
    if (!result.success) {
        const responsejson = {
            'message': ' Error in inputs',
            'error': 'Error:' + result.error.message
        };
        res.status(411).json(responsejson);
        return;
    }
    const username = req.body.username;
    const password = req.body.password;
    const hashpassword = bcrypt_1.default.hashSync(password, 5);
    try {
        //DB query to check wether user already exist
        let existingUser = yield User_1.Userdb.findOne({
            'username': username
        });
        if (existingUser) {
            const responsejson = {
                'message': "User Already Exist",
                'error': 'NULL'
            };
            res.status(403).json(responsejson);
            return;
        }
        //DB query  
        const dbresult = yield User_1.Userdb.insertOne({
            'username': username,
            'password': hashpassword
        });
        const responsejson = {
            'message': "Signed up",
            'error': 'NULL'
        };
        res.status(200).json(responsejson);
    }
    catch (error) {
        const responsejson = {
            'message': "Server Crashed",
            'error': 'Error'
        };
        res.status(500).json(responsejson);
    }
}));
app.post('/api/v1/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body.username + " " + req.body.password);
    const username = req.body.username;
    const password = req.body.password;
    try {
        const dbresult = yield User_1.Userdb.findOne({
            'username': username
        });
        if (!dbresult) {
            res.status(403).json({
                "message": "Wrong Username",
                "error": "Error"
            });
            return;
        }
        let encryptedpassword = dbresult.password;
        let result = yield bcrypt_1.default.compare(password, encryptedpassword);
        if (!result) {
            res.status(403).json({
                "message": "Wrong Password",
                "error": "Error"
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({
            'id': dbresult._id
        }, process.env.JWT_SECRET);
        res.status(200).json({
            'message': 'Signin Sucessfully',
            'token': token,
            'error': 'null'
        });
    }
    catch (error) {
        res.status(500).json({
            'message': 'Server Side issue',
            'error': 'Error:' + error
        });
    }
}));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
