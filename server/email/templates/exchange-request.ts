import { emailLayout } from "./layout";

export function exchangeRequestTemplate(requesterName: string, toyTitle: string, exchangeUrl: string) {
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#6b7280;">
      <strong style="color:#1f2937;">${requesterName}</strong> would like to exchange for your toy <strong style="color:#1f2937;">${toyTitle}</strong>.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#9ca3af;">
      Open the exchange request to chat, arrange a meetup, and complete the swap.
    </p>
  `;

  return {
    subject: `${requesterName} wants to exchange for “${toyTitle}”`,
    html: emailLayout({
      title: "Exchange Request",
      headline: "New Exchange Request",
      bodyHtml,
      cta: { text: "View Exchange Request", url: exchangeUrl },
      showSafetyReminder: true,
    }),
  };
}
