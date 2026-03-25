"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsConfig = void 0;
const cors_1 = __importDefault(require("cors"));
exports.corsConfig = (0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://us-central1-kwd-official-website.cloudfunctions.net/api",
        "https://kwdkldn.netlify.app",
        "https://kwdldn.gov.ph",
        "https://www.kwdldn.gov.ph",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
});
