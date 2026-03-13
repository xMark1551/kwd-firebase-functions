"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = void 0;
const handler_1 = require("../middleware/handler");
const reponse_1 = require("../utils/reponse");
const auth_service_1 = require("../services/auth.service");
exports.loginController = (0, handler_1.asyncHandler)(async (req, res) => {
    const response = await auth_service_1.authService.login(req.body);
    (0, reponse_1.ok)(res, { customToken: response }, "User logged in");
});
