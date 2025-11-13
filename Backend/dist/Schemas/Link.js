"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = void 0;
const mongoose_1 = require("mongoose");
const Links = new mongoose_1.Schema({
    'link': {
        type: String,
        require: true
    },
    'user': {
        type: String,
        require: true,
        ref: 'User'
    }
});
exports.Link = (0, mongoose_1.model)('Link', Links);
