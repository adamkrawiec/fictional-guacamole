import nodemailer, { type Transporter } from "nodemailer";
import type { Mailer, OutgoingEmail } from "./mailer";

// Local development: sends over SMTP to Mailpit (docker-compose.yml), which shows every email in a
// web inbox at http://localhost:8025 instead of delivering it. Production uses SesMailer.
export class SmtpMailer implements Mailer {
  private readonly transport: Transporter;

  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    this.transport = nodemailer.createTransport(smtpUrl);
  }

  async send(email: OutgoingEmail): Promise<void> {
    await this.transport.sendMail({ from: this.from, ...email });
  }
}
