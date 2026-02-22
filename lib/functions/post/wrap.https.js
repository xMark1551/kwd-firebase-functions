"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpAdminPost = httpAdminPost;
const middleware_1 = require("../../middleware/middleware");
function httpAdminPost(handler) {
    return async (req, res) => {
        (0, middleware_1.cors)(req, res);
        if ((0, middleware_1.handlePreflight)(req, res))
            return;
        if (!(0, middleware_1.requireMethod)("POST", req, res))
            return;
        if (!(0, middleware_1.requireJson)(req, res))
            return;
        if (!(0, middleware_1.rejectLarge)(req, res, 200000))
            return;
        try {
            const user = await (0, middleware_1.requireUser)(req, res);
            if (!user)
                return;
            if (!(0, middleware_1.requireAdmin)(user, res))
                return;
            await handler(req, res, user);
        }
        catch (err) {
            console.error("HTTP error:", { message: err?.message, code: err?.code, name: err?.name });
            res.status(500).json({ ok: false, error: "Internal server error" });
        }
    };
}
