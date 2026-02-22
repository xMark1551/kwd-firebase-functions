"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdmin = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("../../utils/auth");
const admin_service_1 = require("../../services/admin/admin.service");
exports.setAdmin = (0, https_1.onCall)(async (request) => {
    // v2: auth is in request.auth
    (0, auth_1.requireSuperAdmin)(request);
    const data = request.data;
    if (!data?.uid || typeof data.uid !== "string") {
        throw new https_1.HttpsError("invalid-argument", "Missing uid");
    }
    if (typeof data.admin !== "boolean") {
        throw new https_1.HttpsError("invalid-argument", "admin must be boolean");
    }
    await (0, admin_service_1.setAdminClaim)(data.uid, data.admin);
    return { ok: true, uid: data.uid, admin: data.admin };
});
