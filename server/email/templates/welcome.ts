export function welcomeTemplate(email: string): { subject: string; html: string } {
  return {
    subject: "Welcome to the ToyX Family! 💜",
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

          <!-- Hero Image -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              <img src="https://toyxchange.online/assets/hero.png" alt="ToyX Heroes" style="width:100%;max-width:432px;border-radius:12px;display:block;" />
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td align="center" style="padding:0 24px 8px;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#1f2937;letter-spacing:-0.5px;">Share toys, spread joy.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              <p style="margin:0;font-size:16px;line-height:1.7;color:#6b7280;">
                Hi there! Thanks for joining the ToyX community. We're building the safest space for parents in South Africa to swap toys, save money, and live greener. Your journey to discovery starts now!
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#8B5CF6,#EC4899);border-radius:12px;">
                    <a href="https://toyxchange.online/go/app" target="_blank" style="display:inline-block;padding:14px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Start Exploring</a>
                  </td>
                </tr>
              </table>
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
