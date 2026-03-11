import { Router } from "express";

import authRoutes from "./auth.routes";
import postRoutes from "./post.routes";
import transparencyRoutes from "./transparency.routes";
import inquiryRoutes from "./inquiry.routes";
import logRoutes from "./activity.log.routes";
import settingsRoutes from "./settings.routes";
import searchRoutes from "./search.routes";

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
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/transparency", transparencyRoutes);
router.use("/inquiry", inquiryRoutes);
router.use("/log", logRoutes);
router.use("/settings", settingsRoutes);
router.use("/search", searchRoutes);

export default router;
