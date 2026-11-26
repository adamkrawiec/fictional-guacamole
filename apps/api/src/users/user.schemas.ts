import Joi from "joi";
import type { UserRole } from "../generated/prisma/client";
import { userRoles } from "./set-role";

// Request bodies for the users API (user.router.ts validates with these before the handlers run)

export type CreateUserBody = {
  name: string;
  email: string;
  password?: string; // optional: without one, the API sets a random one nobody knows
  role?: UserRole;
};

export type UpdateUserBody = {
  name?: string;
  email?: string;
  role?: UserRole;
};

// Stored lowercased, as Better Auth does. tlds: false accepts any domain ending (no built-in list).
const email = Joi.string()
  .trim()
  .lowercase()
  .email({ tlds: { allow: false } });

// Better Auth's limits for email/password sign-up
const password = Joi.string().min(8).max(128);

// Better Auth requires a name but allows it to be empty
const name = Joi.string().trim().allow("").max(100);

// Only the UserRole enum's values (schema.prisma)
const role = Joi.string().valid(...userRoles);

export const createUserSchema = Joi.object<CreateUserBody>({
  name: name.required(),
  email: email.required(),
  password,
  role,
});

export const updateUserSchema = Joi.object<UpdateUserBody>({ name, email, role })
  .min(1)
  .messages({ "object.min": "Send at least one of name, email, role" });
