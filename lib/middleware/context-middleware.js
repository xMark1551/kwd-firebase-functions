"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextMiddleware = void 0;
const request_context_1 = require("../context/request-context");
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
    request_context_1.requestContext.run(store, next);
};
exports.contextMiddleware = contextMiddleware;
