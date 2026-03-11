import { Router } from "express";

import { loginController } from "../controller/auth";
import { validateBody } from "../middleware/validate";
import { loginSchema } from "../validation/auth.schema";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);

export default router;
