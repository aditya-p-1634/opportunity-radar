import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { computeRecommendation } from "@/lib/engines/recommendation";
import { differenceInDays } from "date-fns";

function mapOpp(
  opp: {
    id: string;
    slug: string;
    title: string;
    type: string;
    researchArea: string | null;
    funding: string | null;
    location: string | null;
    country: string | null;
    mode: string;
    duration: string | null;
    deadline: Date | null;
    verified: boolean;
    officialUrl: string | null;
    institution: {
      name: string;
      shortName: string | null;
      logoUrl: string | null;
      slug: string;
      country: string;
      prestigeScore?: number;
    };
  },
  profile: Parameters<typeof computeRecommendation>[0],
  bookmarked: boolean
) {
  const rec = computeRecommendation(profile, { ...opp, institution: opp.institution });
  return {
    id: opp.id,
    slug: opp.slug,
    title: opp.title,
    type: opp.type,
    researchArea: opp.researchArea,
    funding: opp.funding,
    location: opp.location,
    country: opp.country,
    mode: opp.mode,
    duration: opp.duration,
    deadline: opp.deadline,
    verified: opp.verified,
    officialUrl: opp.officialUrl,
    matchScore: rec.score,
    matchReasons: rec.reasons,
    eligibilityStatus: rec.eligibilityStatus,
    bookmarked,
    institution: {
      name: opp.institution.name,
      shortName: opp.institution.shortName,
      logoUrl: opp.institution.logoUrl,
      slug: opp.institution.slug,
      country: opp.institution.country,
    },
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });
    if (!user) return jsonError("Not found", 404);

    const profile = user.profile;
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [allActive, bookmarks, applications, notifications, closingSoonRaw, latestRaw] =
      await Promise.all([
        db.opportunity.findMany({
          where: { status: "ACTIVE" },
          include: { institution: true },
          take: 200,
          orderBy: { publishedAt: "desc" },
        }),
        db.bookmark.findMany({
          where: { userId: user.id },
          select: { opportunityId: true },
        }),
        db.application.findMany({
          where: { userId: user.id },
          include: { opportunity: { include: { institution: true } } },
          orderBy: { appliedAt: "desc" },
          take: 10,
        }),
        db.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
        db.opportunity.findMany({
          where: {
            status: "ACTIVE",
            deadline: { gte: now, lte: in30 },
          },
          include: { institution: true },
          orderBy: { deadline: "asc" },
          take: 12,
        }),
        db.opportunity.findMany({
          where: { status: "ACTIVE" },
          include: { institution: true },
          orderBy: { publishedAt: "desc" },
          take: 12,
        }),
      ]);

    const bookmarkSet = new Set(bookmarks.map((b) => b.opportunityId));

    const scored = allActive
      .map((o) => mapOpp(o, profile, bookmarkSet.has(o.id)))
      .filter((o) => o.eligibilityStatus !== "NOT_ELIGIBLE")
      .sort((a, b) => b.matchScore - a.matchScore);

    const recommended = scored.slice(0, 12);

    const byType = (type: string) =>
      scored.filter((o) => o.type === type).slice(0, 8);

    const international = scored
      .filter((o) => o.country && o.country !== "India")
      .slice(0, 8);

    const closingSoon = closingSoonRaw.map((o) =>
      mapOpp(o, profile, bookmarkSet.has(o.id))
    );
    const latest = latestRaw.map((o) => mapOpp(o, profile, bookmarkSet.has(o.id)));

    // AI insights
    const insights: string[] = [];
    if (profile) {
      if (profile.completionPercent < 80) {
        insights.push(
          `Your profile is ${profile.completionPercent}% complete. Fill in research interests and skills to improve match accuracy.`
        );
      }
      const topMatch = recommended[0];
      if (topMatch) {
        insights.push(
          `Your strongest match today is "${topMatch.title}" at ${topMatch.institution.name} (${topMatch.matchScore}% match).`
        );
      }
      const urgent = closingSoon.filter((o) => {
        if (!o.deadline) return false;
        return differenceInDays(new Date(o.deadline), now) <= 7;
      });
      if (urgent.length > 0) {
        insights.push(
          `${urgent.length} opportunity(ies) you may qualify for close within 7 days.`
        );
      }
      const interests = JSON.parse(profile.researchInterests || "[]") as string[];
      if (interests[0]) {
        const count = scored.filter(
          (o) => o.researchArea?.toLowerCase().includes(interests[0].toLowerCase())
        ).length;
        insights.push(
          `${count} active opportunities align with your interest in ${interests[0]}.`
        );
      }
    } else {
      insights.push("Complete your academic profile to unlock personalized recommendations.");
    }

    const unreadNotifications = await db.notification.count({
      where: { userId: user.id, read: false },
    });

    return jsonOk({
      user: {
        name: user.name,
        email: user.email,
        profileCompletion: profile?.completionPercent ?? 0,
      },
      stats: {
        recommended: recommended.length,
        closingSoon: closingSoon.length,
        saved: bookmarks.length,
        applied: applications.length,
        unreadNotifications,
      },
      recommended,
      closingSoon,
      latest,
      researchInternships: byType("RESEARCH_INTERNSHIP"),
      summerSchools: byType("SUMMER_SCHOOL"),
      scholarships: byType("SCHOLARSHIP"),
      fellowships: byType("FELLOWSHIP"),
      hackathons: byType("HACKATHON"),
      competitions: byType("COMPETITION"),
      international,
      insights,
      recentApplications: applications.map((a) => ({
        ...mapOpp(a.opportunity, profile, true),
        applicationStatus: a.status,
        appliedAt: a.appliedAt,
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
