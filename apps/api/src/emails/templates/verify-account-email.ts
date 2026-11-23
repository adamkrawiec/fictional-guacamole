import { escapeHtml, type RenderedEmail } from "./rendered-email";

type VerifyAccountEmailProps = {
  name: string;
  url: string; // Better Auth's signed verification link
};

// Sent on sign-up (and on resend): the user must open the link before they can sign in
export function VerifyAccountEmail({ name, url }: VerifyAccountEmailProps): RenderedEmail {
  const greeting = name ? `Hello ${name},` : "Hello,";

  return {
    subject: "Confirm your email for Fictional Guacamole",
    text: [
      greeting,
      "",
      "Welcome to Fictional Guacamole! Please confirm your email address by opening this link:",
      url,
      "",
      "The link expires in 24 hours. If you didn't create an account, you can ignore this email.",
    ].join("\n"),
    html: `<p>${escapeHtml(greeting)}</p>
<p>Welcome to Fictional Guacamole! Please confirm your email address:</p>
<p><a href="${escapeHtml(url)}">Confirm my email</a></p>
<p>The link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`,
  };
}
