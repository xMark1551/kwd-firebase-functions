"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminClaim = setAdminClaim;
exports.setSuperAdminClaim = setSuperAdminClaim;
const firebase_1 = require("../../config/firebase");
async function setAdminClaim(uid, isAdmin) {
    // Keep any existing claims (optional)
    const user = await firebase_1.auth.getUser(uid);
    const current = user.customClaims ?? {};
    const nextClaims = {
        ...current,
        admin: isAdmin,
    };
    // If turning admin off, remove the claim entirely (cleaner)
    if (!isAdmin) {
        delete nextClaims.admin;
    }
    await firebase_1.auth.setCustomUserClaims(uid, nextClaims);
}
async function setSuperAdminClaim(uid, isSuper) {
    const user = await firebase_1.auth.getUser(uid);
    const current = user.customClaims ?? {};
    const nextClaims = {
        ...current,
        superadmin: isSuper,
    };
    if (!isSuper) {
        delete nextClaims.superadmin;
    }
    await firebase_1.auth.setCustomUserClaims(uid, nextClaims);
}
/**
 * IMPORTANT: After changing claims, user must refresh token to receive new claims.
 * Easiest: sign out + sign in.
 */
