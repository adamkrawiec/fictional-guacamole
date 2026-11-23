import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { Mailer, OutgoingEmail } from "./mailer";

// Amazon SES. Credentials come from the EC2 instance role and the region from AWS_REGION, both set
// up by Terraform (infra/app/email.tf), so there are no keys in the app.
export class SesMailer implements Mailer {
  private readonly client = new SESv2Client({});

  constructor(private readonly from: string) {}

  async send(email: OutgoingEmail): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: this.from,
        Destination: { ToAddresses: [email.to] },
        Content: {
          Simple: {
            Subject: { Data: email.subject, Charset: "UTF-8" },
            Body: {
              Text: { Data: email.text, Charset: "UTF-8" },
              Html: { Data: email.html, Charset: "UTF-8" },
            },
          },
        },
      }),
    );
  }
}
