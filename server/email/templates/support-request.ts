export function supportRequestTemplate(fromName: string, category: string, subject: string, message: string, email: string) {
  return {
    subject: `[Support] ${subject.substring(0, 60)}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F5FB;font-family:'Inter','Helvetica',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5FB;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:32px 24px 16px;">
              <img src="https://toyxchange.online/assets/toyx-logo.png" alt="ToyX" style="max-height:40px;width:auto;display:block;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 24px 16px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#1f2937;">New Support Request</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:4px 0;font-size:13px;color:#9ca3af;">From</td><td style="padding:4px 0;font-size:14px;color:#1f2937;">${fromName}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#9ca3af;">Email</td><td style="padding:4px 0;font-size:14px;color:#1f2937;">${email}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#9ca3af;">Category</td><td style="padding:4px 0;font-size:14px;color:#1f2937;">${category}</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#9ca3af;">Subject</td><td style="padding:4px 0;font-size:14px;color:#1f2937;">${subject}</td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
              <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap;">${message}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F9FAFB;padding:16px 24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                ToyX — Internal Support Notification
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
