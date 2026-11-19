import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { toNodeHandler } from "better-auth/node";
import { prisma } from "../db/prisma";

// Better Auth reads BETTER_AUTH_SECRET (signs session cookies) and BETTER_AUTH_URL (the public base
// URL) from the environment. Outside production it falls back to a built-in dev secret with a warning;
// in production a missing secret is an error.
export const auth = betterAuth({
  basePath: "/api/auth",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Email confirmation comes later: set requireEmailVerification: true and add
    // emailVerification.sendVerificationEmail to send the link.
  },
});

// Serves every Better Auth endpoint (sign-up/email, sign-in/email, sign-out, get-session, ...)
export const authHandler = toNodeHandler(auth);
