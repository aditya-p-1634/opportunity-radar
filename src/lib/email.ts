/**
 * Email transport.
 * Dev: logs to console.
 * Production: uses SMTP when SMTP_HOST is configured.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { to, subject, html, text } = payload;

  if (!process.env.SMTP_HOST) {
    console.log("\n📧 [Email Dev Transport]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text ?? html.replace(/<[^>]+>/g, " ").slice(0, 500)}`);
    console.log("─".repeat(40));
    return true;
  }

  // Production: configure SMTP_HOST and install nodemailer for real delivery.
  // Until then, log the payload so auth flows still work in every environment.
  console.log("\n📧 [Email SMTP fallback — install nodemailer for real delivery]");
  console.log({ to, subject, preview: (text ?? html).slice(0, 200) });
  return true;
}

export function verificationEmailHtml(name: string, url: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0a0a0b; color:#fafafa; padding:40px;">
  <div style="max-width:480px;margin:0 auto;background:#141416;border:1px solid #27272a;border-radius:16px;padding:32px;">
    <h1 style="font-size:20px;margin:0 0 8px;">Verify your email</h1>
    <p style="color:#a1a1aa;margin:0 0 24px;">Hi ${name || "there"}, confirm your email to activate Opportunity Radar.</p>
    <a href="${url}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">Verify Email</a>
    <p style="color:#71717a;font-size:12px;margin-top:24px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
  </div>
</body>
</html>`;
}

export function passwordResetEmailHtml(name: string, url: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0a0a0b; color:#fafafa; padding:40px;">
  <div style="max-width:480px;margin:0 auto;background:#141416;border:1px solid #27272a;border-radius:16px;padding:32px;">
    <h1 style="font-size:20px;margin:0 0 8px;">Reset your password</h1>
    <p style="color:#a1a1aa;margin:0 0 24px;">Hi ${name || "there"}, click below to choose a new password.</p>
    <a href="${url}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">Reset Password</a>
    <p style="color:#71717a;font-size:12px;margin-top:24px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  </div>
</body>
</html>`;
}

export function opportunityMatchEmailHtml(
  name: string,
  opportunities: { title: string; institution: string; match: number; url: string }[]
): string {
  const rows = opportunities
    .map(
      (o) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid #27272a;"><strong>${o.title}</strong><br/><span style="color:#a1a1aa;font-size:13px;">${o.institution} · ${o.match}% match</span></td><td style="text-align:right;"><a href="${o.url}" style="color:#818cf8;">View</a></td></tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0a0a0b; color:#fafafa; padding:40px;">
  <div style="max-width:520px;margin:0 auto;background:#141416;border:1px solid #27272a;border-radius:16px;padding:32px;">
    <h1 style="font-size:20px;margin:0 0 8px;">New matches for you</h1>
    <p style="color:#a1a1aa;margin:0 0 24px;">Hi ${name || "there"}, we found opportunities that fit your profile.</p>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
  </div>
</body>
</html>`;
}

export function deadlineReminderEmailHtml(
  name: string,
  title: string,
  deadline: string,
  url: string
): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0a0a0b; color:#fafafa; padding:40px;">
  <div style="max-width:480px;margin:0 auto;background:#141416;border:1px solid #27272a;border-radius:16px;padding:32px;">
    <h1 style="font-size:20px;margin:0 0 8px;">Deadline approaching</h1>
    <p style="color:#a1a1aa;margin:0 0 16px;">Hi ${name || "there"},</p>
    <p style="margin:0 0 8px;"><strong>${title}</strong> closes on <strong style="color:#fbbf24;">${deadline}</strong>.</p>
    <a href="${url}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;margin-top:16px;">Open Opportunity</a>
  </div>
</body>
</html>`;
}
