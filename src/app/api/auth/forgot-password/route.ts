import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations";
import { jsonOk, handleApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const rl = await rateLimit(`forgot:${ip}`, 5, 60_000);
    if (!rl.success) {
      return jsonOk({ message: "If that email exists, a reset link was sent." });
    }

    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success to prevent email enumeration
    if (user) {
      const token = randomBytes(32).toString("hex");
      await db.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendEmail({
        to: user.email,
        subject: "Reset your Opportunity Radar password",
        html: passwordResetEmailHtml(user.name ?? "Student", `${appUrl}/reset-password?token=${token}`),
      });
    }

    return jsonOk({ message: "If that email exists, a reset link was sent." });
  } catch (err) {
    return handleApiError(err);
  }
}
