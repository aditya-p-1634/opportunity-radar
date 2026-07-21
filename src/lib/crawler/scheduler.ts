/**
 * Reusable Crawl Scheduler & Execution Guard
 *
 * Provides a trigger-independent scheduling pipeline reusable from:
 * - CLI (npx tsx)
 * - Admin UI (/admin)
 * - API Routes (/api/cron, /api/admin/crawler)
 * - System Cron
 *
 * Prevents concurrent execution via database & memory execution guards.
 */

import { db } from "@/lib/db";
import { runCrawler, CrawlResult } from "./index";
import { processOpportunityLifecycle, LifecycleStats } from "./lifecycle";

export type SchedulerTrigger = "MANUAL" | "CRON_HOURLY" | "CRON_DAILY" | "CLI";

export interface ScheduledCrawlOptions {
  trigger?: SchedulerTrigger;
  targetGroup?: string;
  institutionId?: string;
}

export interface ScheduledCrawlResponse {
  jobId?: string;
  status: "SUCCESS" | "FAILED" | "BUSY_LOCKED";
  message: string;
  result?: CrawlResult;
  lifecycleStats?: LifecycleStats;
}

/**
 * Checks if a crawl job is currently running in the platform.
 */
export async function isCrawlLocked(): Promise<boolean> {
  const activeJob = await db.crawlerJob.findFirst({
    where: {
      status: "RUNNING",
      startedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }, // lock expires after 30 mins
    },
  });
  return Boolean(activeJob);
}

/**
 * Executes a crawl batch safely through the shared queue execution pipeline.
 */
export async function executeScheduledCrawl(
  options: ScheduledCrawlOptions = {}
): Promise<ScheduledCrawlResponse> {
  const trigger = options.trigger ?? "MANUAL";
  const targetGroup = options.targetGroup ?? "ALL";

  // Check concurrency lock
  if (await isCrawlLocked()) {
    return {
      status: "BUSY_LOCKED",
      message: "Crawl execution blocked: Another crawl job is currently running.",
    };
  }

  try {
    // Run crawler pipeline
    const crawlResult = await runCrawler(options.institutionId, {
      schedulerType: trigger,
      targetGroup,
    });

    // Run automated lifecycle state transitions
    const lifecycleStats = await processOpportunityLifecycle();

    return {
      jobId: crawlResult.jobId,
      status: crawlResult.status,
      message: `Crawl completed with status ${crawlResult.status}.`,
      result: crawlResult,
      lifecycleStats,
    };
  } catch (err: any) {
    return {
      status: "FAILED",
      message: `Crawl execution failed: ${err.message || err}`,
    };
  }
}
