import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const record = await db.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expires < new Date()) {
      return jsonError("Invalid or expired reset token", 400);
    }

    const passwordHash = await hashPassword(password);
    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    return jsonOk({ message: "Password updated. You can log in now." });
  } catch (err) {
    return handleApiError(err);
  }
}
