import { describe, expect, it } from "vitest";
import type { AuthSession } from "../auth/auth.middleware";
import type { User } from "../generated/prisma/client";
import { userPolicy } from "./user.policy";

// Only id and role matter to the policy
const actor = (id: string, role: "user" | "admin") => ({ id, role }) as AuthSession["user"];
const target = (id: string) => ({ id }) as User;

const admin = actor("admin-1", "admin");
const member = actor("member-1", "user");

describe("userPolicy", () => {
  it("admins may do everything, to any user", async () => {
    expect(await userPolicy.index(admin)).toBe(true);
    expect(await userPolicy.create(admin)).toBe(true);
    expect(await userPolicy.show(admin, target("someone"))).toBe(true);
    expect(await userPolicy.update(admin, target("someone"))).toBe(true);
    expect(await userPolicy.destroy(admin, target("someone"))).toBe(true);
  });

  it("users may show and update only their own account", async () => {
    expect(await userPolicy.show(member, target("member-1"))).toBe(true);
    expect(await userPolicy.update(member, target("member-1"))).toBe(true);

    expect(await userPolicy.show(member, target("someone"))).toBe(false);
    expect(await userPolicy.update(member, target("someone"))).toBe(false);
  });

  it("users may not list, create or delete users, not even themselves", async () => {
    expect(await userPolicy.index(member)).toBe(false);
    expect(await userPolicy.create(member)).toBe(false);
    expect(await userPolicy.destroy(member, target("member-1"))).toBe(false);
    expect(await userPolicy.destroy(member, target("someone"))).toBe(false);
  });
});
