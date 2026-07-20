import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { computeRecommendation } from "@/lib/engines/recommendation";
import { computeEligibility } from "@/lib/engines/eligibility";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const opportunity = await db.opportunity.findUnique({
      where: { slug },
      include: { institution: { include: { departments: true } } },
    });
    if (!opportunity) return jsonError("Not found", 404);

    // Increment view count
    await db.opportunity.update({
      where: { id: opportunity.id },
      data: { viewCount: { increment: 1 } },
    });

    const session = await auth();
    let profile = null;
    let bookmarked = false;
    let application = null;

    if (session?.user?.id) {
      profile = await db.profile.findUnique({ where: { userId: session.user.id } });
      const bm = await db.bookmark.findUnique({
        where: {
          userId_opportunityId: {
            userId: session.user.id,
            opportunityId: opportunity.id,
          },
        },
      });
      bookmarked = !!bm;
      application = await db.application.findUnique({
        where: {
          userId_opportunityId: {
            userId: session.user.id,
            opportunityId: opportunity.id,
          },
        },
      });
    }

    const rec = computeRecommendation(profile, {
      ...opportunity,
      institution: opportunity.institution,
    });
    const eligibility = computeEligibility(profile, opportunity);

    // Related opportunities
    const related = await db.opportunity.findMany({
      where: {
        status: "ACTIVE",
        id: { not: opportunity.id },
        OR: [
          { institutionId: opportunity.institutionId },
          { researchArea: opportunity.researchArea ?? undefined },
          { type: opportunity.type },
        ],
      },
      include: { institution: true },
      take: 6,
      orderBy: { popularityScore: "desc" },
    });

    return jsonOk({
      ...opportunity,
      branches: JSON.parse(opportunity.branches || "[]"),
      matchScore: rec.score,
      matchReasons: rec.reasons,
      matchFactors: rec.factors,
      eligibility,
      bookmarked,
      application,
      related: related.map((r) => {
        const rrec = computeRecommendation(profile, { ...r, institution: r.institution });
        return {
          id: r.id,
          slug: r.slug,
          title: r.title,
          type: r.type,
          researchArea: r.researchArea,
          funding: r.funding,
          location: r.location,
          country: r.country,
          mode: r.mode,
          duration: r.duration,
          deadline: r.deadline,
          verified: r.verified,
          officialUrl: r.officialUrl,
          matchScore: rrec.score,
          matchReasons: rrec.reasons,
          eligibilityStatus: rrec.eligibilityStatus,
          institution: {
            name: r.institution.name,
            shortName: r.institution.shortName,
            logoUrl: r.institution.logoUrl,
            slug: r.institution.slug,
            country: r.institution.country,
          },
        };
      }),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
