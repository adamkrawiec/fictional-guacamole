import { ConsoleMailer } from "./console-mailer";
import { SesMailer } from "./ses-mailer";
import { SmtpMailer } from "./smtp-mailer";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export interface Mailer {
  send(email: OutgoingEmail): Promise<void>;
}

// Which mailer sends email, picked from the environment:
//   SMTP_URL    -> SMTP, locally to Mailpit (apps/api/.env); never set in production
//   EMAIL_FROM  -> Amazon SES (production, via the deploy's env file)
//   otherwise   -> printed to the console
// Tests never send anything: their queue only records jobs (src/queue/email-queue.ts).
export function createMailer(env: NodeJS.ProcessEnv = process.env): Mailer {
  if (env.NODE_ENV === "test") {
    return new ConsoleMailer();
  }
  if (env.SMTP_URL) {
    const from = env.EMAIL_FROM ?? "Fictional Guacamole <no-reply@localhost>";
    return new SmtpMailer(env.SMTP_URL, from);
  }
  if (env.EMAIL_FROM) {
    return new SesMailer(env.EMAIL_FROM);
  }
  return new ConsoleMailer();
}
