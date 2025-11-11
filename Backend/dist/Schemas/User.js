"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Userdb = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    username: { type: String, unique: true },
    password: String
});
exports.Userdb = (0, mongoose_1.model)("User", UserSchema);
