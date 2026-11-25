import "../env";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../db/prisma";
import { parseRole, setUserRole } from "./set-role";

const email = `set-role-spec-${Date.now()}@example.com`;

describe("setUserRole", () => {
  beforeAll(async () => {
    await prisma.user.create({ data: { id: randomUUID(), name: "", email, emailVerified: true } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
  });

  it("new users start as user", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    expect(user.role).toBe("user");
  });

  it("promotes a user to admin, matching the email case-insensitively", async () => {
    const result = await setUserRole(`  ${email.toUpperCase()} `, "admin");

    expect(result).toEqual({ email, role: "admin", previousRole: "user", emailVerified: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { email } })).role).toBe("admin");
  });

  it("reports no change when the user already has the role", async () => {
    const result = await setUserRole(email, "admin");

    expect(result.previousRole).toBe("admin");
    expect(result.role).toBe("admin");
  });

  it("can demote back to user", async () => {
    await setUserRole(email, "user");

    expect((await prisma.user.findUniqueOrThrow({ where: { email } })).role).toBe("user");
  });

  it("fails for an unknown email", async () => {
    await expect(setUserRole("nobody@example.com", "admin")).rejects.toThrow(
      "No user with email nobody@example.com",
    );
  });
});

describe("parseRole", () => {
  it("accepts the enum's roles and rejects anything else", () => {
    expect(parseRole("admin")).toBe("admin");
    expect(parseRole("user")).toBe("user");
    expect(() => parseRole("superadmin")).toThrow(
      'Unknown role "superadmin". Use one of: user, admin',
    );
  });
});
