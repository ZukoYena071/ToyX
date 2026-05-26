import { emailLayout } from "./layout";

export function exchangeAcceptedTemplate(ownerName: string, toyTitle: string, messagesUrl: string) {
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#6b7280;">
      <strong style="color:#1f2937;">${ownerName}</strong> has accepted your exchange request for <strong style="color:#1f2937;">${toyTitle}</strong>!
    </p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#9ca3af;">
      Open the conversation to coordinate your meetup and complete the swap.
    </p>
  `;

  return {
    subject: `${ownerName} accepted your exchange request!`,
    html: emailLayout({
      title: "Exchange Accepted",
      headline: "Exchange Accepted!",
      bodyHtml,
      cta: { text: "Open Messages", url: messagesUrl },
      showSafetyReminder: true,
    }),
  };
}
