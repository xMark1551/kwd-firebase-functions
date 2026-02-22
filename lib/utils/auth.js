"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.requireSuperAdmin = requireSuperAdmin;
const https_1 = require("firebase-functions/v2/https");
function requireAuth(request) {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in");
    }
    return {
        uid: request.auth.uid,
        token: request.auth.token, // includes custom claims
    };
}
function requireAdmin(request) {
    const { uid, token } = requireAuth(request);
    if (token.admin !== true) {
        throw new https_1.HttpsError("permission-denied", "Admin access required");
    }
    return { uid, token };
}
function requireSuperAdmin(request) {
    const { uid, token } = requireAuth(request);
    if (token.superadmin !== true) {
        throw new https_1.HttpsError("permission-denied", "Superadmin access required");
    }
    return { uid, token };
}
