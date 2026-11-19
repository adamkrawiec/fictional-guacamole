import "../env";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import app from "../app";
import { prisma } from "../db/prisma";

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
    it("creates a user, stores a hashed password and starts a session", async () => {
      const res = await signUp({ email, password, name: "" });

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ email, emailVerified: false });
      expect(res.headers["set-cookie"]).toBeDefined();

      const account = await prisma.account.findFirstOrThrow({
        where: { user: { email }, providerId: "credential" },
      });
      expect(account.password).toBeTruthy();
      expect(account.password).not.toBe(password);
    });

    it("rejects a second sign-up with the same email", async () => {
      const res = await signUp({ email, password, name: "" });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(await prisma.user.count({ where: { email } })).toBe(1);
    });
  });

  describe("POST /api/auth/sign-in/email", () => {
    it("rejects a wrong password", async () => {
      const res = await signIn({ email, password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.headers["set-cookie"]).toBeUndefined();
    });

    it("signs in with the right password and returns a session cookie", async () => {
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

    it("returns all users to a signed-in user", async () => {
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
