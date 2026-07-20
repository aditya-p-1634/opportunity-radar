import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { getCrawlerHealth } from "@/lib/crawler";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);
    if (session.user.role !== "ADMIN") return jsonError("Forbidden", 403);

    const [
      users,
      opportunities,
      institutions,
      bookmarks,
      applications,
      activeOpps,
      verifiedOpps,
      notifications,
      crawlerHealth,
      recentUsers,
      oppsByType,
      recentJobs,
    ] = await Promise.all([
      db.user.count(),
      db.opportunity.count(),
      db.institution.count(),
      db.bookmark.count(),
      db.application.count(),
      db.opportunity.count({ where: { status: "ACTIVE" } }),
      db.opportunity.count({ where: { verified: true } }),
      db.notification.count(),
      getCrawlerHealth(),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          emailVerified: true,
        },
      }),
      db.opportunity.groupBy({
        by: ["type"],
        _count: { type: true },
      }),
      db.crawlerJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { institution: { select: { name: true, slug: true } } },
      }),
    ]);

    return jsonOk({
      overview: {
        users,
        opportunities,
        institutions,
        bookmarks,
        applications,
        activeOpps,
        verifiedOpps,
        notifications,
      },
      crawlerHealth: {
        running: crawlerHealth.running,
        failed: crawlerHealth.failed,
        success: crawlerHealth.success,
        lastSuccessAt: crawlerHealth.lastSuccessAt,
      },
      recentUsers,
      oppsByType: oppsByType.map((t) => ({ type: t.type, count: t._count.type })),
      recentJobs,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
