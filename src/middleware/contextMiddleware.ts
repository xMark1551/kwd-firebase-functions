import { Request, Response, NextFunction } from "express";
import { requestContext } from "../context/requestContext";
import { v4 as uuid } from "uuid";

import type { RequestContext } from "../context/requestContext";

export const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;

  const store: RequestContext = {
    requestId: uuid(),
    user: user ? { uid: user.uid, admin: user.admin, email: user.email } : null,
    method: req.method,
    path: req.path,
    ip: req.ip ?? "",
  };

  requestContext.run(store, next);
};
