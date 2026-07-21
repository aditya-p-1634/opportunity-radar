import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { executeScheduledCrawl } from "@/lib/crawler/scheduler";
import { processOpportunityLifecycle } from "@/lib/crawler/lifecycle";
import {
  processDeadlineReminders,
  processNewMatchNotifications,
} from "@/lib/engines/notifications";

/**
 * Production Cron endpoint for automated batch crawling & lifecycle maintenance.
 * Secured with CRON_SECRET header or query parameter.
 * GET /api/cron?task=all|crawl|lifecycle|deadlines|matches
 */
export async function GET(request: Request) {
  try {
    const secret = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
    const expected = process.env.CRON_SECRET || process.env.AUTH_SECRET;
    
    // In dev mode, allow execution if secret is not set
    if (expected && secret !== expected) {
      return jsonError("Unauthorized", 401);
    }

    const task = new URL(request.url).searchParams.get("task") ?? "all";
    const results: Record<string, unknown> = {};

    if (task === "all" || task === "crawl") {
      results.crawl = await executeScheduledCrawl({ trigger: "CRON_HOURLY", targetGroup: "ALL" });
    }
    if (task === "all" || task === "lifecycle") {
      results.lifecycle = await processOpportunityLifecycle();
    }
    if (task === "all" || task === "deadlines") {
      results.deadlineReminders = await processDeadlineReminders();
    }
    if (task === "all" || task === "matches") {
      results.newMatches = await processNewMatchNotifications();
    }

    return jsonOk({ ran: task, results, at: new Date().toISOString() });
  } catch (err) {
    return handleApiError(err);
  }
}
