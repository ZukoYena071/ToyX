import { emailLayout } from "./layout";

export function accountBannedTemplate(reason: string, supportUrl: string) {
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#6b7280;">
      Your ToyX account has been permanently closed due to a community guideline concern.
    </p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#9ca3af;">
      Reason: ${reason}
    </p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#9ca3af;">
      This decision was made to help keep ToyX a safe and welcoming space for all families. If you believe there has been an error, please contact our support team.
    </p>
  `;

  return {
    subject: "Important notice about your ToyX account",
    html: emailLayout({
      title: "Account Closed",
      headline: "Account Closed",
      bodyHtml,
      cta: { text: "Contact Support", url: supportUrl },
      showSafetyReminder: false,
    }),
  };
}
