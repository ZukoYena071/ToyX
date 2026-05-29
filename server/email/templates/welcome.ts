import { ctaButton } from "./layout";

export function welcomeTemplate(email: string): { subject: string; html: string } {
  // Welcome is the onboarding exception — larger hero headline and hero image
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#6b7280;">
      Hi there! Thanks for joining the ToyX community. We're building the safest space for parents in South Africa to swap toys, save money, and live greener. Your journey to discovery starts now!
    </p>
  `;

  const heroHtml = `
    <tr>
      <td align="center" style="padding:0 24px 24px;">
        <img src="https://toyxchange.online/assets/hero.png" alt="ToyX Heroes" style="width:100%;max-width:432px;border-radius:12px;display:block;" />
      </td>
    </tr>
  `;

  return {
    subject: "Welcome to the ToyX Family! 💜",
    // Build the layout manually with a larger headline and hero image
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ToyX</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F5FB;font-family:'Inter','Helvetica',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5FB;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:40px 24px 24px;">
              <img src="https://toyxchange.online/assets/toyx-logo.png" alt="ToyX" style="max-height:50px;width:auto;display:block;" />
            </td>
          </tr>

          ${heroHtml}

          <!-- Headline -->
          <tr>
            <td align="center" style="padding:0 24px 8px;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#1f2937;letter-spacing:-0.5px;">Share toys, spread joy.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 24px 32px;">
              ${ctaButton("Start Exploring", "https://toyxchange.online/go/app")}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB;padding:20px 24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                &copy; 2024 ToyX. All Rights Reserved. Made with 💜 for South African Parents.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
