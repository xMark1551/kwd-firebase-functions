"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const firebase_1 = require("../config/firebase");
const logger_service_1 = require("./logger.service");
const activity_log_service_1 = require("./activity.log.service");
class AuthService {
    constructor(logger) {
        this.logger = logger;
    }
    async signIn(credentials) {
        const { email, password } = credentials;
        const firebaseRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, returnSecureToken: true }),
        });
        return firebaseRes;
    }
    async login(query) {
        // 1. Sign in
        const result = await this.signIn(query);
        const data = (await result.json());
        if (!result.ok)
            throw new Error(data.error.message);
        // 2. Create a custom token so frontend can restore auth state
        const customToken = await firebase_1.auth.createCustomToken(data.localId);
        // 3. Check if user is admin
        const userRecord = await firebase_1.auth.getUser(data.localId);
        const isAdmin = !!userRecord.customClaims?.admin;
        // 3. Create activity log
        await activity_log_service_1.activityLogService.info("LOGIN", `User logged in`, {
            admin: isAdmin,
            uid: data.localId,
            email: data.email,
            displayName: data.displayName,
        });
        return customToken;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService(logger_service_1.logService.withContext("auth"));
