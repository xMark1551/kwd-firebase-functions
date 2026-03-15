"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminClaim = setAdminClaim;
const firebase_1 = require("../config/firebase");
const handler_1 = require("../middleware/handler");
async function setAdminClaim(uid, isAdmin) {
    // Keep any existing claims (optional)
    const user = await (0, handler_1.serviceHandler)("GET USER", () => firebase_1.auth.getUser(uid));
    const current = user.customClaims ?? {};
    const nextClaims = {
        ...current,
        admin: isAdmin,
    };
    // If turning admin off, remove the claim entirely (cleaner)
    if (!isAdmin) {
        delete nextClaims.admin;
    }
    await (0, handler_1.serviceHandler)("SET ADMIN CLAIM", () => firebase_1.auth.setCustomUserClaims(uid, nextClaims));
}
