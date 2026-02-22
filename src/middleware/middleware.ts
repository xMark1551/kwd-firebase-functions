import type { Request, Response, RequestHandler } from "express";
import { getAuth } from "firebase-admin/auth";

const ALLOWED_ORIGINS = new Set(["https://your-admin-domain.com", "http://localhost:5173"]);

export function cors(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key");
  res.setHeader("Access-Control-Max-Age", "3600");
}

export function handlePreflight(req: Request, res: Response): boolean {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

export function requireMethod(method: string, req: Request, res: Response): boolean {
  if (req.method !== method) {
    res.status(405).json({ ok: false, error: `Use ${method}` });
    return false;
  }
  return true;
}

export function requireJson(req: Request, res: Response): boolean {
  const ct = String(req.headers["content-type"] ?? "");
  if (!ct.includes("application/json")) {
    res.status(415).json({ ok: false, error: "Content-Type must be application/json" });
    return false;
  }
  return true;
}

export function rejectLarge(req: Request, res: Response, maxBytes = 200_000): boolean {
  const len = Number(req.headers["content-length"] ?? 0);
  if (Number.isFinite(len) && len > maxBytes) {
    res.status(413).json({ ok: false, error: "Payload too large" });
    return false;
  }
  return true;
}

export const requireUser: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const token = authHeader.slice("Bearer ".length);
    const decoded = await getAuth().verifyIdToken(token);

    res.locals.user = { uid: decoded.uid, admin: Boolean((decoded as any).admin), claims: decoded };
    next();
  } catch (e) {
    res.status(401).json({ ok: false, error: "Invalid token" });
    console.error(e);
  }
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ error: "Missing Authorization Bearer token" });

    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.admin !== true) return res.status(403).json({ error: "Admin access required" });

    // attach for downstream handlers
    (req as any).user = decoded;
    next();
  } catch (e: any) {
    return res.status(401).json({ error: "Invalid or expired token", details: e?.message });
  }
};
