"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginatedPostCallable = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("../../utils/auth");
const create_post_service_1 = require("../../services/post/create.post.service");
exports.getPaginatedPostCallable = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    console.log("yes baby", request.data);
    return await (0, create_post_service_1.getPaginatedPost)(2);
});
