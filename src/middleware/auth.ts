import type { RequestHandler } from "express";
import { getAuth } from "firebase-admin/auth";

import { UnauthorizedError, ForbiddenError } from "../errors";

export type AuthedUser = {
  uid: string;
  admin?: boolean;
  claims: Record<string, any>;
  username?: string;
};

// export type HttpHandler = (req: Request, res: Response, user: AuthedUser) => Promise<void>;

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token)
      return next(
        new UnauthorizedError("Missing Authorization Bearer token", {
          details: "Missing Authorization Bearer token",
        }),
      );

    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.admin !== true) return next(new ForbiddenError("Admin access required"));

    const user: AuthedUser = {
      uid: decoded.uid,
      admin: true,
      claims: decoded,
    };

    req.user = user;
    next();
  } catch (e: any) {
    return next(
      new UnauthorizedError("Invalid or expired token", {
        details: e?.message,
      }),
    );
  }
};
