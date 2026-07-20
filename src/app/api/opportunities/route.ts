import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchSchema } from "@/lib/validations";
import { jsonOk, handleApiError } from "@/lib/api";
import { computeRecommendation } from "@/lib/engines/recommendation";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = Object.fromEntries(searchParams.entries());
    const params = searchSchema.parse(raw);

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OpportunityWhereInput = {
      status: "ACTIVE",
    };

    if (params.q) {
      where.OR = [
        { title: { contains: params.q } },
        { description: { contains: params.q } },
        { researchArea: { contains: params.q } },
        { institution: { name: { contains: params.q } } },
      ];
    }
    if (params.type) where.type = params.type;
    if (params.funding) where.funding = params.funding;
    if (params.country) where.country = params.country;
    if (params.state) where.state = params.state;
    if (params.researchArea) where.researchArea = { contains: params.researchArea };
    if (params.mode) where.mode = params.mode;
    if (params.verified === "true") where.verified = true;
    if (params.verified === "false") where.verified = false;
    if (params.degree) where.minDegree = params.degree;
    if (params.branch) where.branches = { contains: params.branch };
    if (params.institution) {
      where.institution = {
        OR: [
          { slug: params.institution },
          { name: { contains: params.institution } },
          { shortName: { contains: params.institution } },
        ],
      };
    }
    if (params.deadline && params.deadline !== "any") {
      const now = new Date();
      const days = params.deadline === "week" ? 7 : params.deadline === "month" ? 30 : 90;
      where.deadline = {
        gte: now,
        lte: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
      };
    }

    let orderBy: Prisma.OpportunityOrderByWithRelationInput = { publishedAt: "desc" };
    if (params.sort === "deadline") orderBy = { deadline: "asc" };
    if (params.sort === "newest") orderBy = { publishedAt: "desc" };
    if (params.sort === "popular") orderBy = { popularityScore: "desc" };

    const [total, opportunities] = await Promise.all([
      db.opportunity.count({ where }),
      db.opportunity.findMany({
        where,
        include: { institution: true },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const session = await auth();
    let profile = null;
    let bookmarkIds = new Set<string>();

    if (session?.user?.id) {
      profile = await db.profile.findUnique({ where: { userId: session.user.id } });
      const bookmarks = await db.bookmark.findMany({
        where: {
          userId: session.user.id,
          opportunityId: { in: opportunities.map((o) => o.id) },
        },
        select: { opportunityId: true },
      });
      bookmarkIds = new Set(bookmarks.map((b) => b.opportunityId));

      // Save search history
      if (params.q) {
        await db.searchHistory.create({
          data: {
            userId: session.user.id,
            query: params.q,
            filters: JSON.stringify(params),
          },
        });
      }
    }

    const data = opportunities.map((opp) => {
      const rec = computeRecommendation(profile, { ...opp, institution: opp.institution });
      return {
        id: opp.id,
        slug: opp.slug,
        title: opp.title,
        type: opp.type,
        researchArea: opp.researchArea,
        funding: opp.funding,
        fundingAmount: opp.fundingAmount,
        location: opp.location,
        country: opp.country,
        mode: opp.mode,
        duration: opp.duration,
        deadline: opp.deadline,
        verified: opp.verified,
        officialUrl: opp.officialUrl,
        popularityScore: opp.popularityScore,
        matchScore: rec.score,
        matchReasons: rec.reasons,
        eligibilityStatus: rec.eligibilityStatus,
        bookmarked: bookmarkIds.has(opp.id),
        institution: {
          name: opp.institution.name,
          shortName: opp.institution.shortName,
          logoUrl: opp.institution.logoUrl,
          slug: opp.institution.slug,
          country: opp.institution.country,
        },
      };
    });

    // Client-side match sort if requested
    if (params.sort === "match" || params.sort === "relevance") {
      data.sort((a, b) => b.matchScore - a.matchScore);
    }

    return jsonOk({
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
