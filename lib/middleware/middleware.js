"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireUser = void 0;
exports.cors = cors;
exports.handlePreflight = handlePreflight;
exports.requireMethod = requireMethod;
exports.requireJson = requireJson;
exports.rejectLarge = rejectLarge;
const auth_1 = require("firebase-admin/auth");
const ALLOWED_ORIGINS = new Set(["https://your-admin-domain.com", "http://localhost:5173"]);
function cors(req, res) {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin))
        res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key");
    res.setHeader("Access-Control-Max-Age", "3600");
}
function handlePreflight(req, res) {
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return true;
    }
    return false;
}
function requireMethod(method, req, res) {
    if (req.method !== method) {
        res.status(405).json({ ok: false, error: `Use ${method}` });
        return false;
    }
    return true;
}
function requireJson(req, res) {
    const ct = String(req.headers["content-type"] ?? "");
    if (!ct.includes("application/json")) {
        res.status(415).json({ ok: false, error: "Content-Type must be application/json" });
        return false;
    }
    return true;
}
function rejectLarge(req, res, maxBytes = 200000) {
    const len = Number(req.headers["content-length"] ?? 0);
    if (Number.isFinite(len) && len > maxBytes) {
        res.status(413).json({ ok: false, error: "Payload too large" });
        return false;
    }
    return true;
}
const requireUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ ok: false, error: "Unauthorized" });
            return;
        }
        const token = authHeader.slice("Bearer ".length);
        const decoded = await (0, auth_1.getAuth)().verifyIdToken(token);
        res.locals.user = { uid: decoded.uid, admin: Boolean(decoded.admin), claims: decoded };
        next();
    }
    catch (e) {
        res.status(401).json({ ok: false, error: "Invalid token" });
        console.error(e);
    }
};
exports.requireUser = requireUser;
const requireAdmin = async (req, res, next) => {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token)
            return res.status(401).json({ error: "Missing Authorization Bearer token" });
        const decoded = await (0, auth_1.getAuth)().verifyIdToken(token);
        if (decoded.admin !== true)
            return res.status(403).json({ error: "Admin access required" });
        // attach for downstream handlers
        req.user = decoded;
        next();
    }
    catch (e) {
        return res.status(401).json({ error: "Invalid or expired token", details: e?.message });
    }
};
exports.requireAdmin = requireAdmin;
