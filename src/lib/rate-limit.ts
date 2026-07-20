import { db } from "./db";

/**
 * Simple DB-backed rate limiter for production multi-instance safety.
 * Falls back to in-memory if DB is unavailable.
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  key: string,
  max = Number(process.env.RATE_LIMIT_MAX ?? 100),
  windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)
): Promise<{ success: boolean; remaining: number; resetAt: Date }> {
  const now = Date.now();
  const resetAt = new Date(now + windowMs);

  try {
    const existing = await db.rateLimitEntry.findUnique({ where: { key } });

    if (!existing || existing.resetAt.getTime() < now) {
      await db.rateLimitEntry.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { success: true, remaining: max - 1, resetAt };
    }

    if (existing.count >= max) {
      return { success: false, remaining: 0, resetAt: existing.resetAt };
    }

    const updated = await db.rateLimitEntry.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      success: true,
      remaining: Math.max(0, max - updated.count),
      resetAt: existing.resetAt,
    };
  } catch {
    // In-memory fallback
    const entry = memoryStore.get(key);
    if (!entry || entry.resetAt < now) {
      memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      return { success: true, remaining: max - 1, resetAt };
    }
    if (entry.count >= max) {
      return { success: false, remaining: 0, resetAt: new Date(entry.resetAt) };
    }
    entry.count += 1;
    return {
      success: true,
      remaining: Math.max(0, max - entry.count),
      resetAt: new Date(entry.resetAt),
    };
  }
}
