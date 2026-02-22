"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminHttp = requireAdminHttp;
const firebase_1 = require("../config/firebase");
async function requireAdminHttp(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token)
            return res.status(401).json({ error: "Missing Authorization Bearer token" });
        const decoded = await firebase_1.auth.verifyIdToken(token);
        if (decoded.admin !== true)
            return res.status(403).json({ error: "Admin access required" });
        // attach for downstream handlers
        req.user = decoded;
        next();
    }
    catch (e) {
        return res.status(401).json({ error: "Invalid or expired token", details: e?.message });
    }
}
