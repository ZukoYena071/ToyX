export function exchangeRequestTemplate(requesterName: string, toyTitle: string, exchangeUrl: string) {
  return {
    subject: `${requesterName} wants to exchange for “${toyTitle}”`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exchange Request</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F5FB;font-family:'Inter','Helvetica',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5FB;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:32px 24px 16px;">
              <img src="https://toyxchange.online/assets/toyx-logo.png" alt="ToyX" style="max-height:40px;width:auto;display:block;" />
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td align="center" style="padding:0 24px 16px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#1f2937;">New Exchange Request</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#6b7280;">
                <strong style="color:#1f2937;">${requesterName}</strong> would like to exchange for your toy <strong style="color:#1f2937;">${toyTitle}</strong>.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.5;color:#9ca3af;">
                Open the exchange request to chat, arrange a meetup, and complete the swap.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#8B5CF6,#EC4899);border-radius:12px;">
                    <a href="${exchangeUrl}" target="_blank" style="display:inline-block;padding:14px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">View Exchange Request</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Safety reminder -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">
                🛡️ Remember to always meet in safe public community spaces.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB;padding:16px 24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                ToyX — swap toys, not money.<br />
                &copy; 2024 ToyX. All Rights Reserved.
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
