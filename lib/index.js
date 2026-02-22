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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.cleanupOldLogss = exports.backfillAlgolia = void 0;
// Main entry point: export everything
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
__exportStar(require("./trigger/algolia.write"), exports);
var backfill_http_1 = require("./callable/backfill.http");
Object.defineProperty(exports, "backfillAlgolia", { enumerable: true, get: function () { return backfill_http_1.backfillAlgolia; } });
var logger_service_1 = require("./services/logger.service");
Object.defineProperty(exports, "cleanupOldLogss", { enumerable: true, get: function () { return logger_service_1.cleanupOldLogss; } });
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("./app");
// Expose Express app as HTTPS function
exports.api = (0, https_1.onRequest)(app_1.app);
