import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { runCrawler } from "@/lib/crawler";
import {
  processDeadlineReminders,
  processNewMatchNotifications,
} from "@/lib/engines/notifications";

/**
 * Cron endpoint for background jobs.
 * Secure with CRON_SECRET header in production.
 * GET /api/cron?task=all|crawl|deadlines|matches
 */
export async function GET(request: Request) {
  try {
    const secret = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
    const expected = process.env.CRON_SECRET || process.env.AUTH_SECRET;
    if (secret !== expected) {
      return jsonError("Unauthorized", 401);
    }

    const task = new URL(request.url).searchParams.get("task") ?? "all";
    const results: Record<string, unknown> = {};

    if (task === "all" || task === "crawl") {
      results.crawl = await runCrawler();
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
