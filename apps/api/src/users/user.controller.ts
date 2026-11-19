import type { Request, Response } from "express";
import type { AuthSession } from "../auth/auth.middleware";
import { prisma } from "../db/prisma";
import type { User } from "../generated/prisma/client";

export const me = (_req: Request, res: Response) => {
  const user: AuthSession["user"] = res.locals.user;
  res.json({ user });
};

export const index = async (_req: Request, res: Response) => {
  const users: User[] = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json({ users });
};
