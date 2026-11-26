import "../env";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../app";
import { auth } from "../auth/auth";
import { prisma } from "../db/prisma";
import { recordedEmailJobs } from "../queue/email-queue";

// Unique addresses per run, so reruns against the same database don't collide
const run = Date.now();
const adminEmail = `crud-admin-${run}@example.com`;
const memberEmail = `crud-member-${run}@example.com`;
const createdEmail = `crud-created-${run}@example.com`;
const password = "correct-horse-battery";

// Verified users with a password, created the way the admin API does it, then signed in
async function signedInAgent(email: string, role: "user" | "admin") {
  await auth.api.createUser({
    body: { email, password, name: role, role, data: { emailVerified: true } },
  });
  const agent = request.agent(app);
  await agent.post("/api/auth/sign-in/email").send({ email, password }).expect(200);
  return agent;
}

describe("users CRUD", () => {
  let admin: ReturnType<typeof request.agent>;
  let member: ReturnType<typeof request.agent>;
  let adminId: string;
  let memberId: string;

  beforeAll(async () => {
    admin = await signedInAgent(adminEmail, "admin");
    member = await signedInAgent(memberEmail, "user");
    adminId = (await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } })).id;
    memberId = (await prisma.user.findUniqueOrThrow({ where: { email: memberEmail } })).id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            adminEmail,
            memberEmail,
            createdEmail,
            `renamed-${createdEmail}`,
            `nopass-${createdEmail}`,
          ],
        },
      },
    });
  });

  describe("permissions", () => {
    it("doesn't let a non-admin list or create users", async () => {
      await member.get("/api/users").expect(403);
      const body = { name: "x", email: createdEmail, password };
      await member.post("/api/users").send(body).expect(403);
    });

    it("lets a non-admin show and update their own account", async () => {
      const shown = await member.get(`/api/users/${memberId}`).expect(200);
      expect(shown.body.user).toMatchObject({ id: memberId, email: memberEmail });

      const updated = await member.patch(`/api/users/${memberId}`).send({ name: "Me" }).expect(200);
      expect(updated.body.user.name).toBe("Me");
    });

    it("doesn't let a non-admin change their own role or delete their account", async () => {
      await member.patch(`/api/users/${memberId}`).send({ role: "admin" }).expect(403);
      await member.delete(`/api/users/${memberId}`).expect(403);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: memberId } })).role).toBe("user");
    });

    it("hides other users from a non-admin: 404, same as an id that doesn't exist", async () => {
      await member.get(`/api/users/${adminId}`).expect(404);
      await member.patch(`/api/users/${adminId}`).send({ name: "x" }).expect(404);
      await member.delete(`/api/users/${adminId}`).expect(404);
      await member.get("/api/users/does-not-exist").expect(404);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: adminId } })).name).toBe("admin");
    });

    it("still lets a non-admin read their own account", async () => {
      const res = await member.get("/api/users/me").expect(200);

      expect(res.body.user).toEqual({
        id: memberId,
        name: "Me",
        email: memberEmail,
        showPath: `/users/${memberId}`,
        editPath: `/users/${memberId}/edit`,
      });
    });

    it("rejects requests without a session with 401", async () => {
      await request(app).get(`/api/users/${adminId}`).expect(401);
    });
  });

  describe("POST /api/users", () => {
    it("creates an unverified user and sends them a verification email", async () => {
      const res = await admin
        .post("/api/users")
        .send({ name: "Created", email: createdEmail.toUpperCase(), password });

      expect(res.status).toBe(201);
      const created = await prisma.user.findUniqueOrThrow({ where: { email: createdEmail } });
      expect(created).toMatchObject({ name: "Created", role: "user", emailVerified: false });
      expect(res.body.user).toEqual({
        id: created.id,
        name: "Created",
        email: createdEmail,
        showPath: `/users/${created.id}`,
        editPath: `/users/${created.id}/edit`,
        deletePath: `/api/users/${created.id}`,
      });
      expect(recordedEmailJobs.some((job) => job.to === createdEmail)).toBe(true);
      // Can't sign in until verified, like any sign-up
      await request(app)
        .post("/api/auth/sign-in/email")
        .send({ email: createdEmail, password })
        .expect(403);
    });

    it("without a password, sets a random one that isn't returned", async () => {
      const email = `nopass-${createdEmail}`;
      const res = await admin.post("/api/users").send({ name: "No password", email });

      expect(res.status).toBe(201);
      const account = await prisma.account.findFirstOrThrow({
        where: { user: { email }, providerId: "credential" },
      });
      expect(account.password).toBeTruthy();
      expect(JSON.stringify(res.body)).not.toContain(account.password);
      expect(recordedEmailJobs.some((job) => job.to === email)).toBe(true);
      await request(app)
        .post("/api/auth/sign-in/email")
        .send({ email, password: "" })
        .expect((r) => expect(r.status).toBeGreaterThanOrEqual(400));
    });

    it("rejects a duplicate email with 409", async () => {
      const res = await admin.post("/api/users").send({ name: "", email: createdEmail, password });

      expect(res.status).toBe(409);
    });

    it("validates the body and reports every problem", async () => {
      const res = await admin
        .post("/api/users")
        .send({ email: "not-an-email", password: "short", role: "superadmin" });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual([
        { path: "name", message: '"name" is required' },
        { path: "email", message: '"email" must be a valid email' },
        { path: "password", message: '"password" length must be at least 8 characters long' },
        { path: "role", message: '"role" must be one of [user, admin]' },
      ]);
      expect(await prisma.user.count({ where: { email: "not-an-email" } })).toBe(0);
    });

    it("rejects fields that aren't part of a user", async () => {
      const res = await admin
        .post("/api/users")
        .send({ name: "", email: "a@example.com", password, emailVerified: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('"emailVerified" is not allowed');
    });
  });

  describe("GET /api/users/:id", () => {
    it("returns only the DTO's fields, never role, ban or verification details", async () => {
      const res = await admin.get(`/api/users/${memberId}`).expect(200);

      expect(Object.keys(res.body.user).sort()).toEqual([
        "deletePath",
        "editPath",
        "email",
        "id",
        "name",
        "showPath",
      ]);
    });

    it("returns the user", async () => {
      const res = await admin.get(`/api/users/${memberId}`).expect(200);

      expect(res.body.user).toMatchObject({ id: memberId, email: memberEmail });
    });

    it("returns 404 for an unknown id", async () => {
      await admin.get("/api/users/does-not-exist").expect(404);
    });
  });

  describe("PATCH /api/users/:id", () => {
    it("updates the name", async () => {
      const res = await admin.patch(`/api/users/${memberId}`).send({ name: "Renamed" }).expect(200);

      expect(res.body.user.name).toBe("Renamed");
    });

    it("changes the role", async () => {
      await admin.patch(`/api/users/${memberId}`).send({ role: "admin" }).expect(200);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: memberId } })).role).toBe("admin");

      await admin.patch(`/api/users/${memberId}`).send({ role: "user" }).expect(200);
    });

    it("rejects an empty body", async () => {
      const res = await admin.patch(`/api/users/${memberId}`).send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Send at least one of name, email, role");
    });

    it("rejects an unknown role, and changing your own role", async () => {
      await admin.patch(`/api/users/${memberId}`).send({ role: "superadmin" }).expect(400);
      const res = await admin.patch(`/api/users/${adminId}`).send({ role: "user" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("You can't change your own role");
    });

    it("changing the email marks it unverified and sends a new link", async () => {
      const created = await prisma.user.findUniqueOrThrow({ where: { email: createdEmail } });
      const newEmail = `renamed-${createdEmail}`;

      const res = await admin.patch(`/api/users/${created.id}`).send({ email: newEmail });

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ id: created.id, email: newEmail });
      const updated = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });
      expect(updated.emailVerified).toBe(false);
      expect(recordedEmailJobs.some((job) => job.to === newEmail)).toBe(true);
    });

    it("rejects an email that another user has with 409", async () => {
      await admin.patch(`/api/users/${memberId}`).send({ email: adminEmail }).expect(409);
    });

    it("returns 404 for an unknown id", async () => {
      await admin.patch("/api/users/does-not-exist").send({ name: "x" }).expect(404);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("won't delete your own account", async () => {
      const res = await admin.delete(`/api/users/${adminId}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("You can't delete your own account");
    });

    it("deletes the user and signs them out everywhere", async () => {
      await admin.delete(`/api/users/${memberId}`).expect(204);

      expect(await prisma.user.findUnique({ where: { id: memberId } })).toBeNull();
      expect(await prisma.session.count({ where: { userId: memberId } })).toBe(0);
      await member.get("/api/users/me").expect(401);
    });

    it("returns 404 for an unknown id", async () => {
      await admin.delete("/api/users/does-not-exist").expect(404);
    });
  });
});
