import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsoleMailer } from "./console-mailer";
import { createMailer } from "./mailer";
import { SesMailer } from "./ses-mailer";
import { SmtpMailer } from "./smtp-mailer";

// Stand-in for nodemailer, so the SMTP test needs no Mailpit running.
// vi.mock is hoisted above the imports; vi.hoisted makes these available to it.
const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMail = vi.fn(async () => ({}));
  return { sendMail, createTransport: vi.fn(() => ({ sendMail })) };
});
vi.mock("nodemailer", () => ({ default: { createTransport } }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("createMailer", () => {
  it("never sends in tests, whatever is configured", () => {
    const env = { NODE_ENV: "test", SMTP_URL: "smtp://localhost:1025", EMAIL_FROM: "a@b.c" };

    expect(createMailer(env)).toBeInstanceOf(ConsoleMailer);
  });

  it("uses SMTP (Mailpit) when SMTP_URL is set", () => {
    expect(createMailer({ SMTP_URL: "smtp://localhost:1025" })).toBeInstanceOf(SmtpMailer);
  });

  it("uses SES when only EMAIL_FROM is set (production)", () => {
    expect(createMailer({ EMAIL_FROM: "sender@example.com" })).toBeInstanceOf(SesMailer);
  });

  it("falls back to the console", () => {
    expect(createMailer({})).toBeInstanceOf(ConsoleMailer);
  });
});

describe("SmtpMailer", () => {
  it("sends the email through the SMTP URL with the sender as From", async () => {
    const mailer = new SmtpMailer("smtp://localhost:1025", "Guac <no-reply@localhost>");

    const email = { to: "ada@example.com", subject: "Hi", text: "Hello", html: "<p>Hello</p>" };
    await mailer.send(email);

    expect(createTransport).toHaveBeenCalledWith("smtp://localhost:1025");
    expect(sendMail).toHaveBeenCalledWith({
      from: "Guac <no-reply@localhost>",
      to: "ada@example.com",
      subject: "Hi",
      text: "Hello",
      html: "<p>Hello</p>",
    });
  });
});
