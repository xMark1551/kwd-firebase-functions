import type { RequestHandler } from "express";
import { getAuth } from "firebase-admin/auth";

import { logService } from "../services/logger.service";
import { UnauthorizedError, ForbiddenError } from "../errors";

export type AuthedUser = {
  uid: string;
  admin?: boolean;
  claims: Record<string, any>;
  username?: string;
};

// export type HttpHandler = (req: Request, res: Response, user: AuthedUser) => Promise<void>;

export const auth: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return next();

    const decoded = await getAuth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      admin: decoded.admin === true,
      claims: decoded,
      username: decoded.username ?? "",
    };

    logService.info(`[${req.method}] ${req.path}`, {
      ip: req.ip,
      user: {
        uid: req.user?.uid ?? "anonymous",
        admin: req.user?.admin ?? false,
        username: req.user?.username ?? "",
      },
    });

    next();
  } catch {
    next(); // ignore invalid token
  }
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as AuthedUser;

  if (!user)
    return next(
      new UnauthorizedError("Authentication required", {
        details: "User not authenticated",
      }),
    );

  if (user.admin !== true) return next(new ForbiddenError("Admin access requiredss"));

  next();
};
