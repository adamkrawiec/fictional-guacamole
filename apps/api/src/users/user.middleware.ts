import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { forbidden, notFound } from "../http/responses";
import { type UserAction, userPolicy } from "./user.policy";

// Loads the user named by the route's :id into res.locals.targetUser, or answers 404.
// (res.locals.user is someone else: the signed-in user, from requireAuth.)
//
// Put it after requireAuth, not in router.param(): param handlers run before all other middleware,
// so signed-out visitors could tell existing ids (404) from missing ones.
export const loadUser = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    notFound(res, "User not found");
    return;
  }

  res.locals.targetUser = user;
  next();
};

// Lets the request through only if user.policy.ts allows the action. Use after requireAuth, and
// for /:id routes after loadUser, so the policy can see whose account it is.
// Denied: 404 when the user may not even see the target (so ids can't be probed: someone else's
// account looks the same as a missing one), otherwise 403.
export const authorizeUser =
  (action: UserAction) => async (_req: Request, res: Response, next: NextFunction) => {
    const actor = res.locals.user;
    const target = res.locals.targetUser;

    if (await userPolicy[action](actor, target)) {
      next();
      return;
    }

    if (target && !(await userPolicy.show(actor, target))) {
      notFound(res, "User not found");
      return;
    }
    forbidden(res);
  };
