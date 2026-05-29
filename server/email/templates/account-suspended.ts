import { emailLayout } from "./layout";

export function accountSuspendedTemplate(durationText: string, reason: string, supportUrl: string) {
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#6b7280;">
      Your ToyX account has been temporarily suspended for <strong style="color:#1f2937;">${durationText}</strong> due to a community guideline concern.
    </p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#9ca3af;">
      Reason: ${reason}
    </p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#9ca3af;">
      These measures help keep ToyX a safe and welcoming space for all families. If you believe there has been an error, please contact our support team.
    </p>
  `;

  return {
    subject: `Account temporarily suspended for ${durationText}`,
    html: emailLayout({
      title: "Account Suspended",
      headline: "Account Temporarily Suspended",
      bodyHtml,
      cta: { text: "Contact Support", url: supportUrl },
      showSafetyReminder: false,
    }),
  };
}
