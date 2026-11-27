import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { forbidden, unauthorized } from "../http/responses";
import { auth } from "./auth";
import { type Permissions, type RoleName, roles } from "./permissions";

export type AuthSession = typeof auth.$Infer.Session;

// Rejects the request with 401 unless it carries a valid session cookie.
// On success the signed-in user and session are available as res.locals.user / res.locals.session.
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  if (!session) {
    unauthorized(res);
    return;
  }

  res.locals.user = session.user;
  res.locals.session = session.session;
  next();
};

// Better Auth types session.user.role as a plain string. The database only stores UserRole values,
// but anything unexpected falls back to the least-privileged role rather than an error.
export const roleOf = (user: AuthSession["user"]): RoleName =>
  user.role && Object.hasOwn(roles, user.role) ? (user.role as RoleName) : "user";

// Whether a user's role grants the permissions (role -> permissions map: src/auth/permissions.ts).
// Checks the role from the session, so no extra database query.
export async function userCan(user: AuthSession["user"], permissions: Permissions) {
  const { success } = await auth.api.userHasPermission({
    body: { role: roleOf(user), permissions },
  });
  return success;
}

// Use after requireAuth: 403 unless the signed-in user's role has these permissions.
//   router.get("/", requireAuth, requirePermission({ user: ["list"] }), index);
export const requirePermission =
  (permissions: Permissions) => async (_req: Request, res: Response, next: NextFunction) => {
    if (!(await userCan(res.locals.user, permissions))) {
      forbidden(res);
      return;
    }
    next();
  };
