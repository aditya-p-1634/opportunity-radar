/**
 * Opportunity Lifecycle Management Engine
 *
 * Enforces automated lifecycle transitions:
 * NEW -> ACTIVE -> CLOSING_SOON -> EXPIRED -> ARCHIVED
 *
 * Ensures expired items are hidden from public default feeds while preserving
 * historical records for tracking, bookmarks, and platform analytics.
 */

import { db } from "@/lib/db";

export interface LifecycleStats {
  newCount: number;
  activeCount: number;
  closingSoonCount: number;
  expiredCount: number;
  archivedCount: number;
  totalProcessed: number;
}

export async function processOpportunityLifecycle(): Promise<LifecycleStats> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // 1. Transition items past deadline to EXPIRED
  const expiredRes = await db.opportunity.updateMany({
    where: {
      status: { in: ["NEW", "ACTIVE", "CLOSING_SOON"] },
      deadline: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  // 2. Transition items with deadline within 7 days to CLOSING_SOON
  const closingSoonRes = await db.opportunity.updateMany({
    where: {
      status: { in: ["NEW", "ACTIVE"] },
      deadline: { gte: now, lte: sevenDaysFromNow },
    },
    data: { status: "CLOSING_SOON" },
  });

  // 3. Transition items expired over 90 days ago to ARCHIVED
  const archivedRes = await db.opportunity.updateMany({
    where: {
      status: "EXPIRED",
      deadline: { lt: ninetyDaysAgo },
    },
    data: { status: "ARCHIVED" },
  });

  // Query current distribution stats
  const counts = await db.opportunity.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const statsMap: Record<string, number> = {};
  counts.forEach((c) => {
    statsMap[c.status] = c._count.status;
  });

  return {
    newCount: statsMap["NEW"] || 0,
    activeCount: statsMap["ACTIVE"] || 0,
    closingSoonCount: statsMap["CLOSING_SOON"] || 0,
    expiredCount: expiredRes.count,
    archivedCount: archivedRes.count,
    totalProcessed: Object.values(statsMap).reduce((a, b) => a + b, 0),
  };
}
