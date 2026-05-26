import { emailLayout } from "./layout";

export function moderationMessageTemplate(messagesUrl: string) {
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#6b7280;">
      You've received an important message from the ToyX Safety Team.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#9ca3af;">
      Please open your ToyX messages to read it and respond. We're here to help keep the community safe and welcoming for everyone.
    </p>
  `;

  return {
    subject: "You have a new message from the ToyX Safety Team",
    html: emailLayout({
      title: "Message from ToyX Safety Team",
      headline: "New Message",
      bodyHtml,
      cta: { text: "Open ToyX Messages", url: messagesUrl },
      showSafetyReminder: false,
    }),
  };
}
