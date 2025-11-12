"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tags = void 0;
const mongoose_1 = require("mongoose");
const Tag = new mongoose_1.Schema({
    'title': {
        type: String,
        require: true
    },
});
exports.Tags = (0, mongoose_1.model)('Tags', Tag);
