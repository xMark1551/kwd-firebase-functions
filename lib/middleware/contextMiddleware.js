"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextMiddleware = void 0;
const requestContext_1 = require("../context/requestContext");
const uuid_1 = require("uuid");
const contextMiddleware = (req, res, next) => {
    const user = req.user;
    const store = {
        requestId: (0, uuid_1.v4)(),
        user: user ? { uid: user.uid, admin: user.admin, email: user.email } : null,
        method: req.method,
        path: req.path,
        ip: req.ip ?? "",
    };
    requestContext_1.requestContext.run(store, next);
};
exports.contextMiddleware = contextMiddleware;
