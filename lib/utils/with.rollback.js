"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withFilesRollback = void 0;
const deleteFile_1 = require("../storage/deleteFile");
const withFilesRollback = async (urls, fn) => {
    return fn().catch(async (error) => {
        if (!urls)
            return fn();
        // if urls is a string, convert it to an array
        if (typeof urls === "string")
            urls = [urls];
        if (urls.length)
            await (0, deleteFile_1.deleteFile)(urls);
        throw error;
    });
};
exports.withFilesRollback = withFilesRollback;
