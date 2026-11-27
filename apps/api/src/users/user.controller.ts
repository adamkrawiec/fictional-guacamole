import { randomBytes } from "node:crypto";
import { APIError } from "better-auth/api";
import type { Request, Response } from "express";
import { auth } from "../auth/auth";
import { type AuthSession, userCan } from "../auth/auth.middleware";
import { prisma } from "../db/prisma";
import type { User } from "../generated/prisma/client";
import { badRequest, conflict, forbidden } from "../http/responses";
import { toUserDto, toUserDtos } from "./user.dto";
import type { CreateUserBody, UpdateUserBody } from "./user.schemas";

// Before these handlers run, user.router.ts validates the body (validateBody + user.schemas.ts),
// for /:id routes loads the user (loadUser -> res.locals.targetUser, 404 if missing), and checks
// user.policy.ts (authorizeUser). So req.body is already clean and the action is allowed here. What's
// left are the rules that need the database or the session: duplicates, changing a role, and not
// acting on your own account.

const emailTaken = (res: Response) => conflict(res, "A user with this email already exists");

// Sends (or re-sends) the verification link through the email queue. Better Auth only sends it
// to unverified users.
const sendVerificationEmail = (email: string) =>
  auth.api.sendVerificationEmail({ body: { email, callbackURL: "/" } });

export const me = async (_req: Request, res: Response) => {
  const user: AuthSession["user"] = res.locals.user;
  res.json({ user: await toUserDto(user, user) });
};

// GET /api/users
export const index = async (_req: Request, res: Response) => {
  const users: User[] = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json({ users: await toUserDtos(users, res.locals.user) });
};

// GET /api/users/:id
export const show = async (_req: Request, res: Response) => {
  const user: User = res.locals.targetUser;
  res.json({ user: await toUserDto(user, res.locals.user) });
};

// POST /api/users  { name, email, password?, role? }
// Without a password, the user gets a random one that is never shown or logged (only its hash is
// stored), so nobody can sign in with it. The verification email still goes out, and opening it
// signs the user in (autoSignInAfterVerification), so it works as an invite. Signing in with a
// password later needs a way to set one (e.g. Better Auth's reset-password flow).
const unguessablePassword = () => randomBytes(32).toString("base64url"); // 43 chars, 256 bits

export const create = async (req: Request<unknown, unknown, CreateUserBody>, res: Response) => {
  const { name, email, password, role } = req.body;

  if (await prisma.user.findUnique({ where: { email } })) return emailTaken(res);

  try {
    const { user } = await auth.api.createUser({
      body: { name, email, password: password ?? unguessablePassword(), role },
    });
    await sendVerificationEmail(user.email);
    res.status(201).json({ user: await toUserDto(user, res.locals.user) });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: err.body?.message ?? err.message });
    }
    throw err;
  }
};

// PATCH /api/users/:id  { name?, email?, role? }
export const update = async (req: Request<unknown, unknown, UpdateUserBody>, res: Response) => {
  const currentUser: AuthSession["user"] = res.locals.user;
  const user: User = res.locals.targetUser;
  const { name, email, role } = req.body;

  const data: { name?: string; email?: string; emailVerified?: boolean; role?: User["role"] } = {};

  if (name !== undefined) data.name = name;

  if (email !== undefined && email !== user.email) {
    if (await prisma.user.findUnique({ where: { email } })) return emailTaken(res);
    data.email = email;
    data.emailVerified = false;
  }

  if (role !== undefined && role !== user.role) {
    if (!(await userCan(currentUser, { user: ["set-role"] }))) {
      return forbidden(res);
    }
    if (user.id === currentUser.id) return badRequest(res, "You can't change your own role");
    data.role = role;
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  if (data.email) await sendVerificationEmail(updated.email);
  res.json({ user: await toUserDto(updated, currentUser) });
};

// DELETE /api/users/:id
// Their sessions and accounts go with them (onDelete: Cascade), so they're signed out everywhere.
export const destroy = async (_req: Request, res: Response) => {
  const currentUser: AuthSession["user"] = res.locals.user;
  const user: User = res.locals.targetUser;

  if (user.id === currentUser.id) return badRequest(res, "You can't delete your own account");

  await prisma.user.delete({ where: { id: user.id } });
  res.status(204).end();
};
