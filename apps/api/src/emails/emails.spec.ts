import { describe, expect, it, vi } from "vitest";
import type { Mailer } from "../mailer/mailer";
import { parseEmailJob } from "./email-job";
import { handleEmailJob } from "./handle-email-job";
import { renderEmail, VerifyAccountEmail } from "./templates";

const job = {
  type: "verify-email" as const,
  to: "ada@example.com",
  name: "Ada",
  url: "https://example.com/api/auth/verify-email?token=abc&callbackURL=%2F",
};

describe("renderEmail", () => {
  it("renders a verify-email job with VerifyAccountEmail", () => {
    expect(renderEmail(job)).toEqual(VerifyAccountEmail({ name: job.name, url: job.url }));
  });
});

describe("parseEmailJob", () => {
  it("reads a job back from its JSON", () => {
    expect(parseEmailJob(JSON.stringify(job))).toEqual(job);
  });

  it("throws on anything else, so SQS retries and dead-letters it", () => {
    expect(() => parseEmailJob("not json")).toThrow();
    expect(() => parseEmailJob(JSON.stringify({ type: "other" }))).toThrow(/Not an email job/);
    expect(() => parseEmailJob(undefined)).toThrow();
  });
});

describe("handleEmailJob", () => {
  it("sends the rendered email to the job's address", async () => {
    const send = vi.fn<Mailer["send"]>(async () => {});

    await handleEmailJob(job, { send });

    expect(send).toHaveBeenCalledWith({ to: job.to, ...renderEmail(job) });
  });
});
