"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whoAmI = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("../../utils/auth");
exports.whoAmI = (0, https_1.onCall)(async (request) => {
    const { uid, token } = (0, auth_1.requireAuth)(request);
    return {
        uid,
        email: token.email ?? null,
        admin: token.admin === true,
        superadmin: token.superadmin === true,
        sign_in_provider: token.firebase?.sign_in_provider ?? null,
    };
});
