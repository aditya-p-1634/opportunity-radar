import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { z } from "zod";
import { computeRecommendation } from "@/lib/engines/recommendation";

const bodySchema = z.object({ opportunityId: z.string().min(1) });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const profile = await db.profile.findUnique({ where: { userId: session.user.id } });
    const bookmarks = await db.bookmark.findMany({
      where: { userId: session.user.id },
      include: { opportunity: { include: { institution: true } } },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk(
      bookmarks.map((b) => {
        const rec = computeRecommendation(profile, {
          ...b.opportunity,
          institution: b.opportunity.institution,
        });
        return {
          id: b.opportunity.id,
          slug: b.opportunity.slug,
          title: b.opportunity.title,
          type: b.opportunity.type,
          researchArea: b.opportunity.researchArea,
          funding: b.opportunity.funding,
          location: b.opportunity.location,
          country: b.opportunity.country,
          mode: b.opportunity.mode,
          duration: b.opportunity.duration,
          deadline: b.opportunity.deadline,
          verified: b.opportunity.verified,
          officialUrl: b.opportunity.officialUrl,
          matchScore: rec.score,
          matchReasons: rec.reasons,
          eligibilityStatus: rec.eligibilityStatus,
          bookmarked: true,
          savedAt: b.createdAt,
          institution: {
            name: b.opportunity.institution.name,
            shortName: b.opportunity.institution.shortName,
            logoUrl: b.opportunity.institution.logoUrl,
            slug: b.opportunity.institution.slug,
            country: b.opportunity.institution.country,
          },
        };
      })
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const { opportunityId } = bodySchema.parse(await request.json());
    const opp = await db.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opp) return jsonError("Opportunity not found", 404);

    await db.bookmark.upsert({
      where: {
        userId_opportunityId: { userId: session.user.id, opportunityId },
      },
      create: { userId: session.user.id, opportunityId },
      update: {},
    });

    await db.opportunity.update({
      where: { id: opportunityId },
      data: { saveCount: { increment: 1 } },
    });

    return jsonOk({ bookmarked: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const { opportunityId } = bodySchema.parse(await request.json());
    await db.bookmark.deleteMany({
      where: { userId: session.user.id, opportunityId },
    });

    return jsonOk({ bookmarked: false });
  } catch (err) {
    return handleApiError(err);
  }
}
