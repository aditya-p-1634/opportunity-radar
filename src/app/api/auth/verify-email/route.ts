import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = z.object({ token: z.string().min(1) }).parse(body);

    const record = await db.emailVerificationToken.findUnique({ where: { token } });
    if (!record || record.used || record.expires < new Date()) {
      return jsonError("Invalid or expired verification token", 400);
    }

    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      }),
      db.emailVerificationToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    return jsonOk({ message: "Email verified successfully." });
  } catch (err) {
    return handleApiError(err);
  }
}
