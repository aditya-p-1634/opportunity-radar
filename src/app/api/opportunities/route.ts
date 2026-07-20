import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchSchema } from "@/lib/validations";
import { jsonOk, handleApiError } from "@/lib/api";
import { computeRecommendation } from "@/lib/engines/recommendation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { jsonError } from "@/lib/api";

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

const createOpportunitySchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  type: z.string(),
  institutionName: z.string().min(2),
  institutionCountry: z.string().min(2).default("India"),
  discoveredVia: z.enum([
    "Official Website",
    "Email",
    "Twitter/X",
    "LinkedIn",
    "Discord",
    "Professor",
    "Friend",
    "Newsletter",
    "Manual",
    "Other",
  ]),
  url: z.string().url().nullable().optional().or(z.literal("")),
  minCgpa: z.number().min(0).max(10).nullable().optional(),
  minDegree: z.enum(["HIGH_SCHOOL", "BACHELORS", "MASTERS", "PHD"]).nullable().optional(),
  maxDegree: z.enum(["HIGH_SCHOOL", "BACHELORS", "MASTERS", "PHD"]).nullable().optional(),
  branches: z.array(z.string()).default([]),
  funding: z.enum(["FULL", "PARTIAL", "STIPEND", "UNPAID", "NONE"]).default("NONE"),
  fundingAmount: z.string().max(100).nullable().optional(),
  mode: z.enum(["ONSITE", "REMOTE", "HYBRID"]).default("ONSITE"),
  duration: z.string().max(100).nullable().optional(),
  deadline: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const data = createOpportunitySchema.parse(body);

    const slugify = (text: string) =>
      text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");

    const instSlug = slugify(data.institutionName);

    // 1. Transparent findOrCreate for Institution
    let institution = await db.institution.findUnique({
      where: { slug: instSlug },
    });

    if (!institution) {
      institution = await db.institution.create({
        data: {
          name: data.institutionName,
          slug: instSlug,
          type: "UNIVERSITY",
          country: data.institutionCountry,
          verified: false,
        },
      });
    }

    // 2. Generate unique slug for opportunity
    const oppSlugBase = slugify(data.title);
    let oppSlug = oppSlugBase;
    let count = 0;
    while (true) {
      const existing = await db.opportunity.findUnique({
        where: { slug: oppSlug },
      });
      if (!existing) break;
      count++;
      oppSlug = `${oppSlugBase}-${count}`;
    }

    // 3. Compute unique sourceHash
    const sourceUrl = data.url || null;
    const { createHash } = await import("crypto");
    const sourceHash = createHash("sha256")
      .update(sourceUrl || `${oppSlug}-${institution.id}-${Date.now()}`)
      .digest("hex");

    // 4. Create Opportunity
    const newOpportunity = await db.opportunity.create({
      data: {
        institutionId: institution.id,
        title: data.title,
        slug: oppSlug,
        type: data.type,
        description: data.description,
        minDegree: data.minDegree || null,
        maxDegree: data.maxDegree || null,
        minCgpa: data.minCgpa || null,
        branches: JSON.stringify(data.branches),
        funding: data.funding,
        fundingAmount: data.fundingAmount || null,
        mode: data.mode,
        duration: data.duration || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        officialUrl: sourceUrl,
        sourceUrl,
        sourceHash,
        discoveredVia: data.discoveredVia,
        status: "ACTIVE",
        verified: false,
      },
    });

    return jsonOk(newOpportunity);
  } catch (err) {
    return handleApiError(err);
  }
}

