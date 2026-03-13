import { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";
import { ok } from "../utils/reponse";

import { authService } from "../services/auth.service";

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const response = await authService.login(req.body);

  ok(res, response, "User logged in");
});
