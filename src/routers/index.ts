import { Router } from "express";

import postRoutes from "./post.routes";
import transparencyRoutes from "./transparency.routes";
import inquiryRoutes from "./inquiry.routes";
import logRoutes from "./log.routes";
import settingsRoutes from "./settings.routes";

const router = Router();

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
router.use("/posts", postRoutes);
router.use("/transparency", transparencyRoutes);
router.use("/inquiry", inquiryRoutes);
router.use("/log", logRoutes);
router.use("/settings", settingsRoutes);

export default router;
