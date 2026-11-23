-- Email verification is now required to sign in (requireEmailVerification in src/auth/auth.ts).
-- Accounts created before that never got a verification email, so treat them as verified rather
-- than locking them out. Runs once; users who sign up from now on start unverified.
UPDATE "users" SET "email_verified" = true WHERE "email_verified" = false;
