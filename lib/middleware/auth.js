"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.auth = void 0;
const auth_1 = require("firebase-admin/auth");
const logger_service_1 = require("../services/logger.service");
const errors_1 = require("../errors");
// export type HttpHandler = (req: Request, res: Response, user: AuthedUser) => Promise<void>;
const auth = async (req, res, next) => {
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
            username: decoded.username ?? "",
        };
        logger_service_1.logService.info(`[${req.method}] ${req.path}`, {
            ip: req.ip,
            user: {
                uid: req.user?.uid ?? "anonymous",
                admin: req.user?.admin ?? false,
                username: req.user?.username ?? "",
            },
        });
        next();
    }
    catch {
        next(); // ignore invalid token
    }
};
exports.auth = auth;
const requireAdmin = async (req, res, next) => {
    const user = req.user;
    if (!user)
        return next(new errors_1.UnauthorizedError("Authentication required", {
            details: "User not authenticated",
        }));
    if (user.admin !== true)
        return next(new errors_1.ForbiddenError("Admin access requiredss"));
    next();
};
exports.requireAdmin = requireAdmin;
