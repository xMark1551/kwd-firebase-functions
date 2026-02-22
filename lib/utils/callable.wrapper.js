"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callableWrapper = callableWrapper;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("./auth");
const validation_helper_1 = require("./validation.helper");
function callableWrapper(fn, opts) {
    return async (request) => {
        const user = opts?.requireAdmin ? (0, auth_1.requireAdmin)(request) : request.auth?.token;
        // Validate form data
        if (opts?.validateForm) {
            const errors = (0, validation_helper_1.validateForm)({ data: request.data, schema: opts.validateForm.schema });
            if (errors) {
                throw new https_1.HttpsError("invalid-argument", "Missing fields");
            }
        }
        return fn({
            data: request.data,
            dataWithAuthorId: { ...request.data, authorId: user?.uid },
        });
    };
}
