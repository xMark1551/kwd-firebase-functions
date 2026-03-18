import { Router } from "express";

import { loginController } from "../controller/auth";
import { validateBody } from "../middleware/validate";
import { loginSchema } from "../validation/auth.schema";
import { loginLimiter } from "../middleware/rate-limiter";

const router = Router();

router.post("/login", loginLimiter, validateBody(loginSchema), loginController);

export default router;
