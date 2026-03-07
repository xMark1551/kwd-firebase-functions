"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = void 0;
const auth_1 = require("firebase-admin/auth");
const optionalAuth = async (req, res, next) => {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token)
            return next();
        const decoded = await (0, auth_1.getAuth)().verifyIdToken(token);
        req.user = {
            uid: decoded.uid,
            admin: decoded.admin === true,
            claims: decoded,
            username: decoded.username,
        };
        next();
    }
    catch {
        next(); // ignore invalid token
    }
};
exports.optionalAuth = optionalAuth;
