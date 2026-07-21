import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { getCrawlerHealth } from "@/lib/crawler";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);
    if (session.user.role !== "ADMIN") return jsonError("Forbidden", 403);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      users,
      opportunities,
      institutions,
      bookmarks,
      applications,
      activeOpps,
      expiredOpps,
      closingSoonOpps,
      newTodayOpps,
      verifiedOpps,
      notifications,
      crawlerHealth,
      recentUsers,
      oppsByType,
      recentJobs,
      totalCrawlsCount,
      successCrawlsCount,
      recentLogs,
    ] = await Promise.all([
      db.user.count(),
      db.opportunity.count(),
      db.institution.count(),
      db.bookmark.count(),
      db.application.count(),
      db.opportunity.count({ where: { status: "ACTIVE" } }),
      db.opportunity.count({ where: { status: "EXPIRED" } }),
      db.opportunity.count({ where: { status: "CLOSING_SOON" } }),
      db.opportunity.count({ where: { createdAt: { gte: startOfToday } } }),
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
        take: 20,
        include: { institution: { select: { name: true, slug: true } } },
      }),
      db.crawlerJob.count(),
      db.crawlerJob.count({ where: { status: "SUCCESS" } }),
      db.crawlerLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { job: { select: { name: true, status: true } } },
      }),
    ]);

    // Calculate metrics
    const totalFoundSum = recentJobs.reduce((acc, j) => acc + j.itemsFound, 0);
    const totalSkippedSum = recentJobs.reduce((acc, j) => acc + j.itemsSkipped, 0);
    const duplicateRate = totalFoundSum > 0 ? Math.round((totalSkippedSum / totalFoundSum) * 100) : 0;

    const runtimes = recentJobs.map((j) => j.executionTimeMs).filter((t) => t > 0);
    const avgRuntimeMs = runtimes.length > 0 ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length) : 0;
    const successRate = totalCrawlsCount > 0 ? Math.round((successCrawlsCount / totalCrawlsCount) * 100) : 100;

    return jsonOk({
      overview: {
        users,
        opportunities,
        institutions,
        bookmarks,
        applications,
        activeOpps,
        expiredOpps,
        closingSoonOpps,
        newTodayOpps,
        verifiedOpps,
        notifications,
      },
      operationalMetrics: {
        totalCrawls: totalCrawlsCount,
        successRate,
        avgRuntimeMs,
        duplicateRate,
        institutionCoverage: `${institutions} registered institutions`,
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
      recentActivity: recentLogs,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
