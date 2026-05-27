const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  emailType?: string;
}

interface SendEmailResult {
  sent: boolean;
  error?: string;
}

const DEFAULT_FROM = "The ToyX Team <hello@toyxchange.online>";

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, emailType } = options;
  const from = options.from || process.env.FROM_EMAIL || DEFAULT_FROM;

  if (!process.env.RESEND_API_KEY) {
    console.warn("EMAIL_SKIPPED: RESEND_API_KEY not set");
    try {
      const Sentry = await import("@sentry/node");
      Sentry.captureMessage("EMAIL_SKIPPED: RESEND_API_KEY not set", "warning");
    } catch {}
    return { sent: false, error: "RESEND_API_KEY not set" };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Resend returned ${res.status}: ${body}`);
    }

    return { sent: true };
  } catch (error: any) {
    console.error("EMAIL_ERROR:", emailType || "unknown", error?.message || error);

    // Capture in Sentry if available (imported lazily to avoid crash if not configured)
    try {
      const Sentry = await import("@sentry/node");
      Sentry.captureException(error, {
        tags: { emailType: emailType || "unknown", subject },
      });
    } catch {}

    return { sent: false, error: error?.message || "Email send failed" };
  }
}
