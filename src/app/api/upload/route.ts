import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
]);

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return jsonError("No file provided", 400);

    const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 5);
    if (file.size > maxMb * 1024 * 1024) {
      return jsonError(`File too large. Max ${maxMb}MB`, 400);
    }
    if (!ALLOWED.has(file.type)) {
      return jsonError("Invalid file type. Use PDF, DOC, DOCX, PNG, or JPG.", 400);
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeExt = ["pdf", "doc", "docx", "png", "jpg", "jpeg"].includes(ext) ? ext : "bin";
    const filename = `${session.user.id}-${randomBytes(8).toString("hex")}.${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const resumeUrl = `/uploads/${filename}`;
    await db.profile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, resumeUrl, completionPercent: 15 },
      update: { resumeUrl },
    });

    return jsonOk({ url: resumeUrl, filename });
  } catch (err) {
    return handleApiError(err);
  }
}
