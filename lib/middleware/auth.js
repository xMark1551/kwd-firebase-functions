"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const auth_1 = require("firebase-admin/auth");
const errors_1 = require("../errors");
// export type HttpHandler = (req: Request, res: Response, user: AuthedUser) => Promise<void>;
const requireAdmin = async (req, res, next) => {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token)
            return next(new errors_1.UnauthorizedError("Missing Authorization Bearer token", {
                details: "Missing Authorization Bearer token",
            }));
        const decoded = await (0, auth_1.getAuth)().verifyIdToken(token);
        if (decoded.admin !== true)
            return next(new errors_1.ForbiddenError("Admin access required"));
        const user = {
            uid: decoded.uid,
            admin: true,
            claims: decoded,
        };
        req.user = user;
        next();
    }
    catch (e) {
        return next(new errors_1.UnauthorizedError("Invalid or expired token", {
            details: e?.message,
        }));
    }
};
exports.requireAdmin = requireAdmin;
