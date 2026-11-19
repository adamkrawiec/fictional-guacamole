import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "./auth";

export type AuthSession = typeof auth.$Infer.Session;

// Rejects the request with 401 unless it carries a valid session cookie.
// On success the signed-in user and session are available as res.locals.user / res.locals.session.
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.locals.user = session.user;
  res.locals.session = session.session;
  next();
};
