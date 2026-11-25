import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { toNodeHandler } from "better-auth/node";
import { admin } from "better-auth/plugins";
import { prisma } from "../db/prisma";
import { enqueueEmail } from "../queue/email-queue";
import { ac, roles } from "./permissions";

// Better Auth reads BETTER_AUTH_SECRET (signs session cookies) and BETTER_AUTH_URL (the public base
// URL) from the environment. Outside production it falls back to a built-in dev secret with a warning;
// in production a missing secret is an error.
export const auth = betterAuth({
  basePath: "/api/auth",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      const job = { type: "verify-email", to: user.email, name: user.name, url } as const;
      void enqueueEmail(job).catch((err) =>
        console.error("[auth] could not enqueue the verification email", err),
      );
    },
  },
  plugins: [admin({ ac, roles, defaultRole: "user", adminRoles: ["admin"] })],
});

export const authHandler = toNodeHandler(auth);
