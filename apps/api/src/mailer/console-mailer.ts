import type { Mailer, OutgoingEmail } from "./mailer";

// Local development: prints the email (with its link) instead of sending it
export class ConsoleMailer implements Mailer {
  async send(email: OutgoingEmail): Promise<void> {
    console.log(`[email] to=${email.to} subject="${email.subject}"\n${email.text}`);
  }
}
