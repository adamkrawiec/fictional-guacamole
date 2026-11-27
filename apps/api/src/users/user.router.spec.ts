import "../env";
import request from "supertest";
import { afterAll, describe, expect, it, vi } from "vitest";
import app from "../app";
import { prisma } from "../db/prisma";
import { recordedEmailJobs } from "../queue/email-queue";

// A unique address per run, so reruns against the same database don't collide
const email = `auth-spec-${Date.now()}@example.com`;
const password = "correct-horse-battery";

const signUp = (body: Record<string, string>) =>
  request(app).post("/api/auth/sign-up/email").send(body);

const signIn = (body: Record<string, string>) =>
  request(app).post("/api/auth/sign-in/email").send(body);

describe("auth + user.router", () => {
  afterAll(async () => {
    // Sessions and accounts are removed with the user (onDelete: Cascade)
    await prisma.user.deleteMany({ where: { email } });
  });

  describe("POST /api/auth/sign-up/email", () => {
    it("creates an unverified user with a hashed password, and no session yet", async () => {
      const res = await signUp({ email, password, name: "" });

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ email, emailVerified: false });
      expect(res.headers["set-cookie"]).toBeUndefined();

      const account = await prisma.account.findFirstOrThrow({
        where: { user: { email }, providerId: "credential" },
      });
      expect(account.password).toBeTruthy();
      expect(account.password).not.toBe(password);
    });

    it("queues a verification email with the link", async () => {
      const job = await vi.waitFor(() => {
        const found = recordedEmailJobs.find((j) => j.to === email);
        if (!found) throw new Error("no email job yet");
        return found;
      });

      expect(job).toMatchObject({ type: "verify-email", to: email });
      expect(job.url).toContain("/api/auth/verify-email?token=");
    });

    it("doesn't create a second user with the same email", async () => {
      await signUp({ email, password, name: "" });

      expect(await prisma.user.count({ where: { email } })).toBe(1);
    });
  });

  describe("email verification", () => {
    it("refuses to sign in before the email is verified", async () => {
      const res = await signIn({ email, password });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("EMAIL_NOT_VERIFIED");
      expect(res.headers["set-cookie"]).toBeUndefined();
    });

    it("verifies the email through the link and signs the user in", async () => {
      const job = recordedEmailJobs.find((j) => j.to === email);
      if (!job) throw new Error("expected a verification email job");
      // The link's host is BETTER_AUTH_URL; call the app directly with its path and query
      const { pathname, search } = new URL(job.url);

      const agent = request.agent(app);
      const res = await agent.get(pathname + search);

      expect(res.status).toBeLessThan(400); // a redirect to callbackURL, or JSON without one
      expect(res.headers["set-cookie"]).toBeDefined(); // autoSignInAfterVerification
      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      expect(user.emailVerified).toBe(true);
      await agent.get("/api/users/me").expect(200);
    });

    it("rejects a link with a forged token", async () => {
      const res = await request(app).get("/api/auth/verify-email?token=not-a-real-token");

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/auth/sign-in/email", () => {
    it("rejects a wrong password", async () => {
      const res = await signIn({ email, password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.headers["set-cookie"]).toBeUndefined();
    });

    it("signs in a verified user and returns a session cookie", async () => {
      const res = await signIn({ email, password });

      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"]).toBeDefined();
    });
  });

  describe("GET /api/users", () => {
    it("returns 401 without a session", async () => {
      const res = await request(app).get("/api/users");

      expect(res.status).toBe(401);
    });

    it("returns 403 to a signed-in user who isn't an admin", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/sign-in/email").send({ email, password }).expect(200);

      const res = await agent.get("/api/users");

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Forbidden" });
    });

    it("returns all users to an admin", async () => {
      await prisma.user.update({ where: { email }, data: { role: "admin" } });
      const agent = request.agent(app);
      await agent.post("/api/auth/sign-in/email").send({ email, password }).expect(200);

      const res = await agent.get("/api/users");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
      expect(res.body.users).toEqual(expect.arrayContaining([expect.objectContaining({ email })]));
      expect(res.body.users).toHaveLength(await prisma.user.count());
    });
  });

  describe("GET /api/users/me", () => {
    it("returns 401 without a session", async () => {
      const res = await request(app).get("/api/users/me");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns the signed-in user", async () => {
      const agent = request.agent(app); // keeps cookies between requests
      await agent.post("/api/auth/sign-in/email").send({ email, password }).expect(200);

      const res = await agent.get("/api/users/me");

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ email });
      expect(res.body.user).not.toHaveProperty("password");
    });
  });
});
