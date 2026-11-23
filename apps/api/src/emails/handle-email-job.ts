import type { Mailer } from "../mailer/mailer";
import type { EmailJob } from "./email-job";
import { renderEmail } from "./templates";

// What the worker does with one queued email: render it and send it
export async function handleEmailJob(job: EmailJob, mailer: Mailer): Promise<void> {
  await mailer.send({ to: job.to, ...renderEmail(job) });
}
