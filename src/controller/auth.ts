import { Request, Response } from "express";
import { asyncHandler } from "../middleware/handler";

import { authService } from "../services/auth.service";

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const response = await authService.login(req.body);

  return res.status(200).json({ customToken: response });
});
