import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { computeRecommendation } from "@/lib/engines/recommendation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const institution = await db.institution.findUnique({
      where: { slug },
      include: {
        departments: true,
        opportunities: {
          where: { status: { in: ["ACTIVE", "CLOSED"] } },
          orderBy: { publishedAt: "desc" },
          take: 50,
        },
      },
    });
    if (!institution) return jsonError("Not found", 404);

    const session = await auth();
    const profile = session?.user?.id
      ? await db.profile.findUnique({ where: { userId: session.user.id } })
      : null;

    const active = institution.opportunities.filter((o) => o.status === "ACTIVE");
    const past = institution.opportunities.filter((o) => o.status === "CLOSED");

    const stats = {
      totalOpportunities: await db.opportunity.count({
        where: { institutionId: institution.id },
      }),
      activeOpportunities: active.length,
      researchAreas: JSON.parse(institution.researchAreas || "[]").length,
      departments: institution.departments.length,
      avgPopularity:
        active.length > 0
          ? active.reduce((s, o) => s + o.popularityScore, 0) / active.length
          : 0,
    };

    const mapList = (list: typeof institution.opportunities) =>
      list.map((o) => {
        const rec = computeRecommendation(profile, {
          ...o,
          institution,
        });
        return {
          id: o.id,
          slug: o.slug,
          title: o.title,
          type: o.type,
          researchArea: o.researchArea,
          funding: o.funding,
          location: o.location,
          country: o.country,
          mode: o.mode,
          duration: o.duration,
          deadline: o.deadline,
          verified: o.verified,
          officialUrl: o.officialUrl,
          status: o.status,
          matchScore: rec.score,
          matchReasons: rec.reasons,
          eligibilityStatus: rec.eligibilityStatus,
          institution: {
            name: institution.name,
            shortName: institution.shortName,
            logoUrl: institution.logoUrl,
            slug: institution.slug,
            country: institution.country,
          },
        };
      });

    return jsonOk({
      ...institution,
      researchAreas: JSON.parse(institution.researchAreas || "[]"),
      stats,
      currentOpportunities: mapList(active),
      pastOpportunities: mapList(past),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
