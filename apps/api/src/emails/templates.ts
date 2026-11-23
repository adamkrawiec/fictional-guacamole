import type { EmailJob } from "./email-job";

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function renderEmail(job: EmailJob): RenderedEmail {
  const greeting = job.name ? `Hello ${job.name},` : "Hello,";

  return {
    subject: "Confirm your email for Fictional Guacamole",
    text: [
      greeting,
      "",
      "Welcome to Fictional Guacamole! Please confirm your email address by opening this link:",
      job.url,
      "",
      "The link expires in 24 hours. If you didn't create an account, you can ignore this email.",
    ].join("\n"),
    html: `<p>${escapeHtml(greeting)}</p>
<p>Welcome to Fictional Guacamole! Please confirm your email address:</p>
<p><a href="${escapeHtml(job.url)}">Confirm my email</a></p>
<p>The link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`,
  };
}
