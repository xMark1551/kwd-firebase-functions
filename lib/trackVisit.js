"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackVisit = void 0;
// functions/src/index.ts
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const db = admin.firestore();
const allowedOrigins = [
    "http://localhost:5173", // Vite dev server
    "https://your-production-domain.com", // Replace with your real domain
];
const corsHandler = (0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
});
exports.trackVisit = (0, https_1.onRequest)((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const ip = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress;
            if (!ip) {
                return res.status(400).send({ error: "IP address not found" });
            }
            // Get start and end of today
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            // Query if this IP was already recorded today
            const existing = await db
                .collection("visitors")
                .where("ip", "==", ip)
                .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
                .where("timestamp", "<", admin.firestore.Timestamp.fromDate(endOfDay))
                .get();
            if (!existing.empty) {
                return res.status(200).send({ success: true, message: "Already recorded today" });
            }
            // Record new visit
            await db.collection("visitors").add({
                ip,
                timestamp: admin.firestore.Timestamp.now(),
            });
            res.status(200).send({ success: true, message: "Visit recorded" });
        }
        catch (error) {
            console.error("Error tracking visit:", error);
            res.status(500).send({ error: error.message });
        }
    });
});
