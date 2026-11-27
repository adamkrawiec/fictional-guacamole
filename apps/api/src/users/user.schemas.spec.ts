import { describe, expect, it } from "vitest";
import { createUserSchema, updateUserSchema } from "./user.schemas";

describe("createUserSchema", () => {
  it("accepts a valid body and normalizes the email", () => {
    const { value, error } = createUserSchema.validate({
      name: "  Ada ",
      email: "  Ada@Example.COM ",
      password: "correct-horse-battery",
      role: "admin",
    });

    expect(error).toBeUndefined();
    expect(value).toEqual({
      name: "Ada",
      email: "ada@example.com",
      password: "correct-horse-battery",
      role: "admin",
    });
  });

  it("allows an empty name and leaves the role out when not given", () => {
    const { value, error } = createUserSchema.validate({
      name: "",
      email: "a@example.com",
      password: "12345678",
    });

    expect(error).toBeUndefined();
    expect(value).not.toHaveProperty("role");
  });

  it("doesn't require a password", () => {
    const { error } = createUserSchema.validate({ name: "", email: "a@example.com" });

    expect(error).toBeUndefined();
  });

  it("enforces Better Auth's password length limits", () => {
    const base = { name: "", email: "a@example.com" };

    expect(createUserSchema.validate({ ...base, password: "1234567" }).error).toBeDefined();
    expect(createUserSchema.validate({ ...base, password: "x".repeat(129) }).error).toBeDefined();
    expect(createUserSchema.validate({ ...base, password: "x".repeat(128) }).error).toBeUndefined();
  });
});

describe("updateUserSchema", () => {
  it("accepts any subset of name, email, role", () => {
    expect(updateUserSchema.validate({ name: "New" }).error).toBeUndefined();
    expect(updateUserSchema.validate({ role: "user" }).error).toBeUndefined();
    expect(updateUserSchema.validate({ email: "B@Example.com" }).value).toEqual({
      email: "b@example.com",
    });
  });

  it("rejects an empty body, a password and unknown roles", () => {
    expect(updateUserSchema.validate({}).error?.message).toBe(
      "Send at least one of name, email, role",
    );
    expect(updateUserSchema.validate({ password: "12345678" }).error?.message).toBe(
      '"password" is not allowed',
    );
    expect(updateUserSchema.validate({ role: "owner" }).error?.message).toBe(
      '"role" must be one of [user, admin]',
    );
  });
});
