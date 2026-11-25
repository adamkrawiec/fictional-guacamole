import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";
import type { UserRole } from "../generated/prisma/client";

// Resources and their actions. defaultStatements covers users and sessions
// (create, list, set-role, ban, impersonate, ...); add the app's own resources.
const statement = {
  ...defaultStatements,
  todo: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
  user: ac.newRole({ ...userAc.statements, todo: ["create", "read", "update"] }),
  admin: ac.newRole({ ...adminAc.statements, todo: ["create", "read", "update", "delete"] }),
} satisfies Record<UserRole, unknown>;
