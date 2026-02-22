"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withFilesRollback = void 0;
const deleteFile_1 = require("../storage/deleteFile");
const withFilesRollback = async (files, fn) => {
    return fn().catch(async (error) => {
        if (files.length)
            await (0, deleteFile_1.deleteFile)(files);
        throw error;
    });
};
exports.withFilesRollback = withFilesRollback;
