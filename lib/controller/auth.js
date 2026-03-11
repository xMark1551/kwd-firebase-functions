"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = void 0;
const handler_1 = require("../middleware/handler");
const auth_service_1 = require("../services/auth.service");
exports.loginController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await auth_service_1.authService.login(req.body);
    return res.status(200).json({ customToken: response });
});
