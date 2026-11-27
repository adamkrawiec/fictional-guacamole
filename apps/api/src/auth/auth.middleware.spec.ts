import { describe, expect, it } from "vitest";
import { type AuthSession, roleOf, userCan } from "./auth.middleware";

const withRole = (role: string | null | undefined) => ({ id: "u1", role }) as AuthSession["user"];

describe("roleOf", () => {
  it("returns known roles as they are", () => {
    expect(roleOf(withRole("admin"))).toBe("admin");
    expect(roleOf(withRole("user"))).toBe("user");
  });

  it("falls back to the least-privileged role for anything else", () => {
    expect(roleOf(withRole(undefined))).toBe("user");
    expect(roleOf(withRole(null))).toBe("user");
    expect(roleOf(withRole("superadmin"))).toBe("user");
    expect(roleOf(withRole("toString"))).toBe("user"); // not fooled by Object.prototype
  });
});

describe("userCan", () => {
  it("checks the role's permissions", async () => {
    expect(await userCan(withRole("admin"), { user: ["list"] })).toBe(true);
    expect(await userCan(withRole("user"), { user: ["list"] })).toBe(false);
    expect(await userCan(withRole("superadmin"), { user: ["list"] })).toBe(false);
  });
});
