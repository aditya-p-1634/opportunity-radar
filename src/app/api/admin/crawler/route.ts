import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { runCrawler } from "@/lib/crawler";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);
    if (session.user.role !== "ADMIN") return jsonError("Forbidden", 403);

    const jobs = await db.crawlerJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        institution: { select: { name: true, slug: true } },
        logs: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    return jsonOk(jobs);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);
    if (session.user.role !== "ADMIN") return jsonError("Forbidden", 403);

    let institutionId: string | undefined;
    try {
      const body = await request.json();
      const parsed = z.object({ institutionId: z.string().optional() }).parse(body);
      institutionId = parsed.institutionId;
    } catch {
      // empty body ok
    }

    const result = await runCrawler(institutionId);
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
