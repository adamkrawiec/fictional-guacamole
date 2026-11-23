// What every email template returns: ready to hand to a Mailer
export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

// For anything interpolated into a template's HTML (names, links)
export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
