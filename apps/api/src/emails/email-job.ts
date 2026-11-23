// The messages that go through the email queue (SQS in production). One type for now; add more
// to the union as the app sends other emails (password reset, ...).
export type EmailJob = {
  type: "verify-email";
  to: string;
  name: string;
  url: string; // Better Auth's signed verification link
};

// Queue messages are JSON strings; anything malformed throws, so SQS retries and then dead-letters it
export function parseEmailJob(body: string | undefined): EmailJob {
  const job = JSON.parse(body ?? "");
  const valid =
    job?.type === "verify-email" && typeof job.to === "string" && typeof job.url === "string";
  if (!valid) {
    throw new Error(`Not an email job: ${body}`);
  }
  return { type: job.type, to: job.to, name: String(job.name ?? ""), url: job.url };
}
