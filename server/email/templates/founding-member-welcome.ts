const LOGO_URL = "https://toyxchange.online/assets/toyx-logo.png";
const BADGE_URL = "https://toyxchange.online/assets/founding-member-badge.png";

export function foundingMemberWelcomeTemplate(firstName: string): { subject: string; html: string } {
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#6b7280;">
      Hi ${firstName},
    </p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#6b7280;">
      Welcome to ToyX. You're officially one of our Founding Members and among the first families helping shape South Africa's toy exchange community.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="background:#F5F3FF;border-radius:12px;margin-bottom:20px;width:100%;">
      <tr>
        <td style="padding:20px 24px;">
          <h2 style="margin:0 0 8px;font-size:15px;font-weight:700;color:#6d28d9;">Why This Matters</h2>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#4c1d95;">
            Every year thousands of toys sit unused while families keep buying new ones. ToyX is changing that. By joining early, you're helping us build a safer, smarter and more rewarding way for families to exchange toys, earn rewards and give toys new adventures.
          </p>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1f2937;">Your Founding Member Benefits</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;width:100%;">
      <tr><td style="padding:6px 0;font-size:14px;color:#374151;">✅ Early access before public launch</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#374151;">✅ Exclusive Founding Member badge</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#374151;">✅ Bonus ToyX Points</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#374151;">✅ Early feature access</td></tr>
      <tr><td style="padding:6px 0 0;font-size:14px;color:#374151;">✅ Special Founding Member rewards</td></tr>
    </table>

    <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1f2937;">Your Founding Member Badge</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;margin-bottom:20px;width:100%;">
      <tr>
        <td align="center" style="padding:24px;">
          <img src="${BADGE_URL}" alt="Founding Member Badge" width="180" height="180" style="border-radius:90px;display:block;margin-bottom:12px;" />
          <p style="margin:0;font-size:13px;color:#6b7280;">Your Founding Member Badge has been reserved and will appear on your ToyX profile as you help build the ToyX community before launch.</p>
          <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">This permanent badge recognises families who joined ToyX early and helped shape the marketplace from the very beginning.</p>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1f2937;">🚀 What Happens Next?</h2>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#6b7280;">
      As a Founding Family Member, you're now part of the ToyX pre-launch community.
    </p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#6b7280;">
      Over the coming weeks we'll continue growing the marketplace and preparing for public launch.
    </p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#6b7280;">
      Families who actively participate in the community will be prioritised for ToyX Beta access.
    </p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#6b7280;">
      To improve your Beta qualification progress:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;width:100%;">
      <tr><td style="padding:4px 0;font-size:14px;color:#374151;">✅ Verify your email address</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#374151;">✅ Complete your profile</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#374151;">✅ List your first toys</td></tr>
      <tr><td style="padding:4px 0 0;font-size:14px;color:#374151;">✅ Invite another family</td></tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6b7280;">
      These actions help us build a healthy marketplace and ensure ToyX launches with a vibrant, active community.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="background:linear-gradient(135deg,#8B5CF6,#EC4899);border-radius:12px;padding:14px 32px;">
          <a href="https://app.toyxchange.online/hub" target="_blank" style="display:inline-block;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Go To My Founding Family Hub</a>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F5F3FF,#E0E7FF);border-radius:12px;margin-bottom:20px;width:100%;">
      <tr>
        <td style="padding:20px 24px;">
          <h2 style="margin:0 0 8px;font-size:15px;font-weight:700;color:#4338ca;">🌟 ToyX Beta Access</h2>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#3730a3;">
            Before ToyX opens publicly, a limited number of families will receive Beta access.
          </p>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#3730a3;">
            Beta families will be the first to:
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:0;width:100%;">
            <tr><td style="padding:3px 0;font-size:13px;color:#4338ca;">• Browse the marketplace</td></tr>
            <tr><td style="padding:3px 0;font-size:13px;color:#4338ca;">• Exchange toys</td></tr>
            <tr><td style="padding:3px 0;font-size:13px;color:#4338ca;">• Send messages</td></tr>
            <tr><td style="padding:3px 0;font-size:13px;color:#4338ca;">• Leave reviews</td></tr>
            <tr><td style="padding:3px 0 0;font-size:13px;color:#4338ca;">• Help shape the future of ToyX</td></tr>
          </table>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#4338ca;">
            Participation inside the Founding Family Hub helps prepare your account for future Beta invitations.
          </p>
        </td>
      </tr>
    </table>

    <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1f2937;">Help Grow The Community</h2>
    <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#6b7280;">
      Know another family who would love ToyX? Invite them to join as a Founding Family Member before launch.
    </p>
    <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#6b7280;">
      Every new family helps us build a stronger ToyX community and moves us closer to launch day.
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">
      <a href="https://toyxchange.online" style="color:#7c3aed;font-weight:600;text-decoration:none;">toyxchange.online</a>
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F5F3FF,#FDF2F8);border-radius:12px;width:100%;">
      <tr>
        <td align="center" style="padding:24px;">
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#4c1d95;font-weight:600;">
            Thank you for believing in ToyX from the very beginning.
          </p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#6d28d9;">
            Together we're turning old toys into new adventures.
          </p>
          <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#6d28d9;font-weight:600;">
            — The ToyX Team
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ToyX Founding Member Program</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F5FB;font-family:'Inter','Helvetica',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5FB;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Logo — 50% larger -->
          <tr>
            <td align="center" style="padding:32px 24px 4px;">
              <img src="${LOGO_URL}" alt="ToyX" style="max-height:60px;width:auto;display:block;" />
            </td>
          </tr>

          <!-- Hero Badge — 67% larger, tighter gap -->
          <tr>
            <td align="center" style="padding:2px 24px 10px;">
              <img src="${BADGE_URL}" alt="Founding Member" width="120" height="120" style="border-radius:60px;display:block;" />
            </td>
          </tr>

          <!-- Headline — tighter gap from badge -->
          <tr>
            <td align="center" style="padding:0 24px 16px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#1f2937;">Welcome to the ToyX Founding Member Program</h1>
            </td>
          </tr>

          <!-- Preview text area -->
          <tr>
            <td align="center" style="padding:0 24px 4px;">
              <p style="margin:0;font-size:14px;color:#7c3aed;font-weight:500;">You're officially one of ToyX's founding families.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td align="center" style="padding:16px 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:left;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB;padding:20px 24px;">
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
</html>`;

  return {
    subject: "🎉 Welcome to the ToyX Founding Member Program",
    html,
  };
}
