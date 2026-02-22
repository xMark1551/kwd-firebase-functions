"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const auth_1 = require("firebase-admin/auth");
// export type HttpHandler = (req: Request, res: Response, user: AuthedUser) => Promise<void>;
const requireAdmin = async (req, res, next) => {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token)
            return next({
                status: 401,
                error: "Authorization Error",
                message: "Missing Authorization Bearer token",
            });
        const decoded = await (0, auth_1.getAuth)().verifyIdToken(token);
        if (decoded.admin !== true)
            return next({ status: 403, error: "Permission Error", message: "Admin access required" });
        const user = {
            uid: decoded.uid,
            admin: true,
            claims: decoded,
        };
        req.user = user;
        next();
    }
    catch (e) {
        return next({
            status: 401,
            error: "Authorization Error",
            message: "Invalid or expired token",
            details: e?.message,
        });
    }
};
exports.requireAdmin = requireAdmin;
