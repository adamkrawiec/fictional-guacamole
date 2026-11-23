import { describe, expect, it } from "vitest";
import { VerifyAccountEmail } from "./verify-account-email";

const url = "https://example.com/api/auth/verify-email?token=abc&callbackURL=%2F";

describe("VerifyAccountEmail", () => {
  it("renders the subject, greeting and link in text and HTML", () => {
    const email = VerifyAccountEmail({ name: "Ada", url });

    expect(email.subject).toBe("Confirm your email for Fictional Guacamole");
    expect(email.text).toContain("Hello Ada,");
    expect(email.text).toContain(url);
    expect(email.html).toContain(`href="${url.replaceAll("&", "&amp;")}"`);
  });

  it("escapes the name in HTML", () => {
    const email = VerifyAccountEmail({ name: "<script>alert(1)</script>", url });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("greets without a name when there is none", () => {
    expect(VerifyAccountEmail({ name: "", url }).text.startsWith("Hello,")).toBe(true);
  });
});
