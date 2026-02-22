"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_routes_1 = __importDefault(require("./post.routes"));
const transparency_routes_1 = __importDefault(require("./transparency.routes"));
const inquiry_routes_1 = __importDefault(require("./inquiry.routes"));
const log_routes_1 = __importDefault(require("./log.routes"));
const settings_routes_1 = __importDefault(require("./settings.routes"));
const router = (0, express_1.Router)();
/**
 * Health check (useful for debugging deploys)
 * GET /health
 */
router.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, message: "yeah" });
});
/**
 * API routes
 */
router.use("/posts", post_routes_1.default);
router.use("/transparency", transparency_routes_1.default);
router.use("/inquiry", inquiry_routes_1.default);
router.use("/log", log_routes_1.default);
router.use("/settings", settings_routes_1.default);
exports.default = router;
