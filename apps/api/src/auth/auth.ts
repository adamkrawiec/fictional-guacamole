import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { toNodeHandler } from "better-auth/node";
import { prisma } from "../db/prisma";
import { enqueueEmail } from "../queue/email-queue";

// Better Auth reads BETTER_AUTH_SECRET (signs session cookies) and BETTER_AUTH_URL (the public base
// URL) from the environment. Outside production it falls back to a built-in dev secret with a warning;
// in production a missing secret is an error.
export const auth = betterAuth({
  basePath: "/api/auth",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Sign-in answers 403 EMAIL_NOT_VERIFIED until the user opens the link from their email.
    // Sign-up therefore doesn't start a session any more; verifying does (below).
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // link valid for 24 hours
    // The link points at BETTER_AUTH_URL + /api/auth/verify-email.
    // Resending a link: POST /api/auth/send-verification-email.
    sendVerificationEmail: async ({ user, url }) => {
      // Not awaited: the response shouldn't wait for the queue, and its timing shouldn't reveal
      // anything about the address. A failure here means no email, never a failed sign-up.
      const job = { type: "verify-email", to: user.email, name: user.name, url } as const;
      void enqueueEmail(job).catch((err) =>
        console.error("[auth] could not enqueue the verification email", err),
      );
    },
  },
});

// Serves every Better Auth endpoint (sign-up/email, sign-in/email, sign-out, get-session, ...)
export const authHandler = toNodeHandler(auth);
