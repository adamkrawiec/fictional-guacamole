import { describe, expect, it } from "vitest";
import type { AuthSession } from "../auth/auth.middleware";
import type { User } from "../generated/prisma/client";
import { toUserDto, toUserDtos, userDeletePath, userEditPath, userShowPath } from "./user.dto";

const viewer = (id: string, role: "user" | "admin") => ({ id, role }) as AuthSession["user"];
const user = (id: string, name = "Someone") =>
  ({
    id,
    name,
    email: `${id}@example.com`,
    role: "admin",
    banned: false,
    emailVerified: true,
  }) as User;

const admin = viewer("admin-1", "admin");
const member = viewer("member-1", "user");

describe("toUserDto", () => {
  it("returns id, name, email, plus the paths an admin may use for anyone", async () => {
    expect(await toUserDto(user("u1", "Ada"), admin)).toEqual({
      id: "u1",
      name: "Ada",
      email: "u1@example.com",
      showPath: "/users/u1",
      editPath: "/users/u1/edit",
      deletePath: "/api/users/u1",
    });
  });

  it("never offers an admin to delete their own account", async () => {
    const dto = await toUserDto(user("admin-1"), admin);

    expect(dto.editPath).toBe("/users/admin-1/edit");
    expect(dto).not.toHaveProperty("deletePath");
  });

  it("includes both paths for your own account", async () => {
    const dto = await toUserDto(user("member-1"), member);

    expect(dto.showPath).toBe("/users/member-1");
    expect(dto.editPath).toBe("/users/member-1/edit");
    expect(dto).not.toHaveProperty("deletePath"); // users can't delete, not even themselves
  });

  it("leaves the paths out for a user the viewer may not see or edit", async () => {
    const dto = await toUserDto(user("u1"), member);

    expect(dto).toEqual({ id: "u1", name: "Someone", email: "u1@example.com" });
    expect(dto).not.toHaveProperty("showPath");
    expect(dto).not.toHaveProperty("editPath");
    expect(dto).not.toHaveProperty("deletePath");
  });

  it("maps a list, deciding the paths per user", async () => {
    const dtos = await toUserDtos([user("member-1"), user("u2")], member);

    expect(dtos.map((dto) => dto.editPath)).toEqual(["/users/member-1/edit", undefined]);
  });
});

describe("userShowPath / userEditPath / userDeletePath", () => {
  it("encode the id", () => {
    expect(userShowPath("a/b c")).toBe("/users/a%2Fb%20c");
    expect(userEditPath("a/b c")).toBe("/users/a%2Fb%20c/edit");
    expect(userDeletePath("a/b c")).toBe("/api/users/a%2Fb%20c");
  });
});
