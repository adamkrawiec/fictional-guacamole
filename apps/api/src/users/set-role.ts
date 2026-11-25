import { prisma } from "../db/prisma";
import { UserRole } from "../generated/prisma/client";

// The roles the database accepts, from the UserRole enum in schema.prisma
export const userRoles = Object.values(UserRole);

export function parseRole(value: string): UserRole {
  if ((userRoles as string[]).includes(value)) {
    return value as UserRole;
  }
  throw new Error(`Unknown role "${value}". Use one of: ${userRoles.join(", ")}`);
}

export type SetRoleResult = {
  email: string;
  role: UserRole;
  previousRole: UserRole;
  emailVerified: boolean;
};

// Changes a user's role. Takes effect on their next request: sessions read the role from the
// database, so they don't need to sign in again.
export async function setUserRole(email: string, role: UserRole): Promise<SetRoleResult> {
  // Better Auth stores emails lowercased
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    throw new Error(`No user with email ${normalized}`);
  }

  if (user.role !== role) {
    await prisma.user.update({ where: { id: user.id }, data: { role } });
  }

  return {
    email: user.email,
    role,
    previousRole: user.role,
    emailVerified: user.emailVerified,
  };
}
