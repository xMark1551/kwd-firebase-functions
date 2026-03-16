"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucket = exports.storage = exports.db = exports.auth = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const firebase_admin_1 = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)({
        credential: (0, app_1.cert)(serviceAccount),
        storageBucket: process.env.STORAGE_BUCKET,
    });
}
exports.auth = (0, auth_1.getAuth)();
exports.db = (0, firestore_1.getFirestore)();
exports.storage = (0, storage_1.getStorage)();
const getBucket = () => (0, firebase_admin_1.storage)().bucket();
exports.getBucket = getBucket;
