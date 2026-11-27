import { type AuthSession, userCan } from "../auth/auth.middleware";
import type { User } from "../generated/prisma/client";

// Who may do what with users:
//   admin -> index, create, and show / update / delete any user
//   user  -> show and update their own account only
//
// "Any user" rights come from the role -> permission map (src/auth/permissions.ts), so a new role
// only needs permissions there. Ownership ("their own") is decided here.
// Changing a role and not deleting yourself are further rules in user.controller.ts.

type Actor = AuthSession["user"];
// Only the target's id matters here, so any user-shaped object will do (a User, a session user)
type Target = Pick<User, "id">;
type Check = (actor: Actor, target?: Target) => Promise<boolean>;

const isSelf = (actor: Actor, target?: Target) => target !== undefined && target.id === actor.id;

export const userPolicy = {
  index: (actor) => userCan(actor, { user: ["list"] }),
  create: (actor) => userCan(actor, { user: ["create"] }),
  show: async (actor, target) => isSelf(actor, target) || userCan(actor, { user: ["get"] }),
  update: async (actor, target) => isSelf(actor, target) || userCan(actor, { user: ["update"] }),
  destroy: (actor, _target) => userCan(actor, { user: ["delete"] }),
} satisfies Record<string, Check>;

export type UserAction = keyof typeof userPolicy;
