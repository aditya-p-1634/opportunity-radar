import { db } from "@/lib/db";
import {
  sendEmail,
  deadlineReminderEmailHtml,
  opportunityMatchEmailHtml,
} from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { differenceInDays, isPast } from "date-fns";

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  emailSubject?: string;
  emailHtml?: string;
  userEmail?: string;
}) {
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      metadata: JSON.stringify(input.metadata ?? {}),
      emailSent: false,
    },
  });

  if (input.sendEmail && input.userEmail && input.emailHtml) {
    const ok = await sendEmail({
      to: input.userEmail,
      subject: input.emailSubject ?? input.title,
      html: input.emailHtml,
    });
    if (ok) {
      await db.notification.update({
        where: { id: notification.id },
        data: { emailSent: true },
      });
    }
  }

  return notification;
}

/**
 * Scan saved/recommended opportunities for upcoming deadlines and notify.
 */
export async function processDeadlineReminders(): Promise<number> {
  const now = new Date();
  const windows = [1, 3, 7]; // days
  let sent = 0;

  const bookmarks = await db.bookmark.findMany({
    include: {
      user: true,
      opportunity: { include: { institution: true } },
    },
  });

  for (const bm of bookmarks) {
    const deadline = bm.opportunity.deadline;
    if (!deadline || isPast(deadline) || bm.opportunity.status !== "ACTIVE") continue;

    const days = differenceInDays(deadline, now);
    if (!windows.includes(days)) continue;

    // Avoid duplicate notifications for same opportunity + window
    const existing = await db.notification.findFirst({
      where: {
        userId: bm.userId,
        type: "DEADLINE",
        link: `/opportunities/${bm.opportunity.slug}`,
        createdAt: { gte: new Date(now.getTime() - 20 * 60 * 60 * 1000) },
      },
    });
    if (existing) continue;

    const title = `Deadline in ${days} day${days === 1 ? "" : "s"}: ${bm.opportunity.title}`;
    const body = `${bm.opportunity.institution.name} — closes ${formatDate(deadline)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const link = `/opportunities/${bm.opportunity.slug}`;

    await createNotification({
      userId: bm.userId,
      type: "DEADLINE",
      title,
      body,
      link,
      sendEmail: true,
      userEmail: bm.user.email,
      emailSubject: title,
      emailHtml: deadlineReminderEmailHtml(
        bm.user.name ?? "Student",
        bm.opportunity.title,
        formatDate(deadline),
        `${appUrl}${link}`
      ),
    });
    sent++;
  }

  return sent;
}

/**
 * Notify users about high-match new opportunities.
 */
export async function processNewMatchNotifications(): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newOpps = await db.opportunity.findMany({
    where: { status: "ACTIVE", publishedAt: { gte: since } },
    include: { institution: true },
    take: 50,
    orderBy: { publishedAt: "desc" },
  });

  if (newOpps.length === 0) return 0;

  const users = await db.user.findMany({
    where: { role: "USER" },
    include: { profile: true },
    take: 200,
  });

  const { computeRecommendation } = await import("./recommendation");
  let sent = 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  for (const user of users) {
    if (!user.profile) continue;

    const matches = newOpps
      .map((opp) => ({
        opp,
        rec: computeRecommendation(user.profile, {
          ...opp,
          institution: opp.institution,
        }),
      }))
      .filter((m) => m.rec.score >= 75 && m.rec.eligibilityStatus !== "NOT_ELIGIBLE")
      .slice(0, 5);

    if (matches.length === 0) continue;

    const existing = await db.notification.findFirst({
      where: {
        userId: user.id,
        type: "NEW_MATCH",
        createdAt: { gte: since },
      },
    });
    if (existing) continue;

    const top = matches[0];
    await createNotification({
      userId: user.id,
      type: "NEW_MATCH",
      title: `${matches.length} new high-match opportunit${matches.length === 1 ? "y" : "ies"}`,
      body: `Top pick: ${top.opp.title} at ${top.opp.institution.name} (${top.rec.score}% match)`,
      link: "/dashboard",
      sendEmail: true,
      userEmail: user.email,
      emailSubject: "New opportunities matched to your profile",
      emailHtml: opportunityMatchEmailHtml(
        user.name ?? "Student",
        matches.map((m) => ({
          title: m.opp.title,
          institution: m.opp.institution.name,
          match: m.rec.score,
          url: `${appUrl}/opportunities/${m.opp.slug}`,
        }))
      ),
    });
    sent++;
  }

  return sent;
}

export async function markNotificationRead(userId: string, id: string) {
  return db.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
