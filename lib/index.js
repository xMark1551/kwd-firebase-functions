"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldLogs = exports.setAdmin = exports.backfillAlgolia = exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("./app");
// Expose Express app as HTTPS function
exports.api = (0, https_1.onRequest)(app_1.app);
__exportStar(require("./trigger/algolia.write"), exports);
var backfill_http_1 = require("./functions/http.function/backfill.http");
Object.defineProperty(exports, "backfillAlgolia", { enumerable: true, get: function () { return backfill_http_1.backfillAlgolia; } });
var set_admin_http_1 = require("./functions/http.function/set.admin.http");
Object.defineProperty(exports, "setAdmin", { enumerable: true, get: function () { return set_admin_http_1.setAdmin; } });
var logCleanup_function_1 = require("./scheduled/logCleanup.function");
Object.defineProperty(exports, "cleanupOldLogs", { enumerable: true, get: function () { return logCleanup_function_1.cleanupOldLogs; } });
