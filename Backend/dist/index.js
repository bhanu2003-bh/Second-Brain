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
const Content_1 = require("./Schemas/Content");
const Tags_1 = require("./Schemas/Tags");
const Link_1 = require("./Schemas/Link");
;
//constants
const app = (0, express_1.default)();
// Middlewares
app.use(express_1.default.json());
app.use((0, cors_1.default)());
dotenv_1.default.config();
const auth = (req, res, next) => {
    const token = req.headers.token;
    try {
        let value = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.id = value.id;
        next();
    }
    catch (error) {
        res.status(401).json({
            "message": "Wrong Token",
            "error": error
        });
    }
};
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
app.post('/api/v1/content', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.id;
    const type = req.body.type;
    const link = req.body.link;
    const title = req.body.title;
    const tags = req.body.tags;
    console.log("Tags :" + tags);
    const arr = new Set();
    for (let i = 0; i < tags.length; i++) {
        console.log("tag:" + tags[i]);
        try {
            let obj = yield Tags_1.Tags.findOne({
                "title": tags[i]
            });
            if (obj)
                arr.add(obj._id);
            else {
                let obj = yield Tags_1.Tags.create({
                    'title': tags[i]
                });
                arr.add(obj._id);
            }
        }
        catch (error) {
            res.status(500).json({
                'message': 'Database Issue',
                'error': 'Error:' + error
            });
        }
    }
    let newarr = Array.from(arr);
    try {
        let value = yield Content_1.Contents.create({
            'link': link,
            'tags': newarr,
            'title': title,
            'type': type,
            'user': id,
        });
        res.status(200).json({
            'message': 'Successfull',
            'error': 'NULL'
        });
    }
    catch (error) {
        res.json(500).json({
            'message': 'Database Error',
            'error': "Error:" + error
        });
    }
}));
app.get('/api/v1/content', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.id;
    const st = [];
    try {
        const obj = yield Content_1.Contents.find({
            'user': id
        });
        for (let [index, value] of obj.entries()) {
            const tags_values = [];
            for (let tagId of value.tags) {
                try {
                    const a = yield Tags_1.Tags.findById(tagId);
                    if (a)
                        tags_values.push(a.title);
                }
                catch (error) {
                    return res.status(500).json({
                        message: 'DB Crashes',
                        error: error
                    });
                    return;
                }
            }
            st.push({
                id: value.id,
                link: value.link,
                title: value.title,
                type: value.type,
                tags: tags_values
            });
        }
        res.status(200).json({
            'message': "Sucessfull",
            'content': st,
            'error': 'NULL'
        });
    }
    catch (error) {
        res.status(500).json({
            'message': 'Failed',
            'error': 'NULL'
        });
    }
}));
app.delete('/api/v1/content', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.id;
    try {
        const db_response = yield Content_1.Contents.deleteOne({
            'user': id,
            '_id': req.body.contentId
        });
        console.log(db_response.acknowledged + "----" + db_response.deletedCount);
        if (db_response.deletedCount) {
            res.status(200).json({
                'message': 'Deleted Succeed',
                'error': 'NULL',
            });
        }
        else {
            res.status(403).json({
                'message': ' Trying to delete a doc you don’t own',
                'error': 'not able to delete'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            'message': "Server Issue",
            'error': 'Error:' + error
        });
    }
}));
app.post('/api/v1/brain/share', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.id;
    const flag = req.body.share;
    try {
        let db_response = yield Link_1.Link.findOne({
            'user': id
        });
        if (db_response) {
            if (!flag) {
                yield Link_1.Link.deleteOne({
                    'user': id,
                });
                res.status(200).json({
                    'message': 'Remove Share Link',
                    'error': 'NULL'
                });
            }
            else {
                res.status(200).json({
                    'message': 'Operation sucessed',
                    'link': db_response.link,
                    'error': 'NULL'
                });
            }
        }
        else {
            const shareId = id;
            let db_response = yield Link_1.Link.create({
                'link': id,
                'user': id
            });
            res.status(200).json({
                'message': 'Operation sucessed',
                'link': id,
                'error': 'NULL'
            });
        }
    }
    catch (error) {
        res.status(200).json({
            'message': 'DB Crashes',
            'error': 'Error:' + error
        });
    }
}));
app.get('/api/v1/share/:id', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contenturl = req.params.id;
        const db_result = yield Link_1.Link.findOne({
            'link': contenturl
        });
        const user = yield User_1.Userdb.findOne({
            '_id': db_result === null || db_result === void 0 ? void 0 : db_result.user
        });
        const username = user === null || user === void 0 ? void 0 : user.username;
        const id = db_result === null || db_result === void 0 ? void 0 : db_result.user;
        const st = [];
        try {
            const obj = yield Content_1.Contents.find({
                'user': id
            });
            for (let [index, value] of obj.entries()) {
                const tags_values = [];
                for (let tagId of value.tags) {
                    try {
                        const a = yield Tags_1.Tags.findById(tagId);
                        if (a)
                            tags_values.push(a.title);
                    }
                    catch (error) {
                        return res.status(500).json({
                            message: 'DB Crashes',
                            error: error
                        });
                        return;
                    }
                }
                st.push({
                    id: value.id,
                    link: value.link,
                    title: value.title,
                    type: value.type,
                    tags: tags_values
                });
            }
            res.status(200).json({
                'message': "Sucessfull",
                'result': {
                    'username': username,
                    'content': st
                },
                'error': 'NULL'
            });
        }
        catch (error) {
            res.status(500).json({
                'message': 'Failed',
                'error': 'NULL'
            });
        }
    }
    catch (err) {
        res.status(500).json({ success: false, message: err });
    }
}));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
