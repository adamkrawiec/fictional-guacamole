import { ConsoleMailer } from "./console-mailer";
import { SesMailer } from "./ses-mailer";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export interface Mailer {
  send(email: OutgoingEmail): Promise<void>;
}

// SES when a sender is configured (production, via the deploy's env file); otherwise the console,
// so local development and tests never send real email or need AWS credentials.
export function createMailer(): Mailer {
  const from = process.env.EMAIL_FROM;
  if (from && process.env.NODE_ENV !== "test") {
    return new SesMailer(from);
  }
  return new ConsoleMailer();
}
