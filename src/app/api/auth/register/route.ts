import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, verificationEmailHtml } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const rl = await rateLimit(`register:${ip}`, 10, 60_000);
    if (!rl.success) return jsonError("Too many requests", 429);

    const body = await request.json();
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return jsonError("An account with this email already exists", 409);

    const passwordHash = await hashPassword(data.password);
    const user = await db.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        role: "USER",
        profile: {
          create: { completionPercent: 5 },
        },
      },
    });

    const token = randomBytes(32).toString("hex");
    await db.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendEmail({
      to: email,
      subject: "Verify your Opportunity Radar email",
      html: verificationEmailHtml(data.name, `${appUrl}/verify-email?token=${token}`),
    });

    return jsonOk(
      {
        id: user.id,
        email: user.email,
        message: "Account created. Check your email to verify (also logged in server console in dev).",
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
