import type { RequestHandler } from "express";
import { getAuth } from "firebase-admin/auth";

export const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return next();

    const decoded = await getAuth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      admin: decoded.admin === true,
      claims: decoded,
      username: decoded.username,
    };

    next();
  } catch {
    next(); // ignore invalid token
  }
};
