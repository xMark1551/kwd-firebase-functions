import type { RequestHandler } from "express";
import { getAuth } from "firebase-admin/auth";

export type AuthedUser = {
  uid: string;
  admin?: boolean;
  claims: Record<string, any>;
};

// export type HttpHandler = (req: Request, res: Response, user: AuthedUser) => Promise<void>;

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token)
      return next({
        status: 401,
        error: "Authorization Error",
        message: "Missing Authorization Bearer token",
      });

    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.admin !== true)
      return next({ status: 403, error: "Permission Error", message: "Admin access required" });

    const user: AuthedUser = {
      uid: decoded.uid,
      admin: true,
      claims: decoded,
    };

    req.user = user;
    next();
  } catch (e: any) {
    return next({
      status: 401,
      error: "Authorization Error",
      message: "Invalid or expired token",
      details: e?.message,
    });
  }
};
