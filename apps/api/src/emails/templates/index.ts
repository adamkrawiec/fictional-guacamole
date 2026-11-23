import type { EmailJob } from "../email-job";
import type { RenderedEmail } from "./rendered-email";
import { VerifyAccountEmail } from "./verify-account-email";

export type { RenderedEmail } from "./rendered-email";
export { VerifyAccountEmail } from "./verify-account-email";

// Picks the template for a queued job. Adding an email: create templates/<name>-email.ts, add its
// job type to EmailJob (email-job.ts) and a case here; TypeScript flags a missing case.
export function renderEmail(job: EmailJob): RenderedEmail {
  switch (job.type) {
    case "verify-email":
      return VerifyAccountEmail({ name: job.name, url: job.url });
    default: {
      const unhandled: never = job.type;
      throw new Error(`No template for email job type: ${unhandled}`);
    }
  }
}
