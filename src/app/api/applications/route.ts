import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { applicationSchema } from "@/lib/validations";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { computeRecommendation } from "@/lib/engines/recommendation";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const profile = await db.profile.findUnique({ where: { userId: session.user.id } });
    const apps = await db.application.findMany({
      where: { userId: session.user.id },
      include: { opportunity: { include: { institution: true } } },
      orderBy: { appliedAt: "desc" },
    });

    return jsonOk(
      apps.map((a) => {
        const rec = computeRecommendation(profile, {
          ...a.opportunity,
          institution: a.opportunity.institution,
        });
        return {
          applicationId: a.id,
          status: a.status,
          notes: a.notes,
          appliedAt: a.appliedAt,
          id: a.opportunity.id,
          slug: a.opportunity.slug,
          title: a.opportunity.title,
          type: a.opportunity.type,
          researchArea: a.opportunity.researchArea,
          funding: a.opportunity.funding,
          location: a.opportunity.location,
          country: a.opportunity.country,
          mode: a.opportunity.mode,
          duration: a.opportunity.duration,
          deadline: a.opportunity.deadline,
          verified: a.opportunity.verified,
          officialUrl: a.opportunity.officialUrl,
          matchScore: rec.score,
          matchReasons: rec.reasons,
          eligibilityStatus: rec.eligibilityStatus,
          institution: {
            name: a.opportunity.institution.name,
            shortName: a.opportunity.institution.shortName,
            logoUrl: a.opportunity.institution.logoUrl,
            slug: a.opportunity.institution.slug,
            country: a.opportunity.institution.country,
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

    const data = applicationSchema.parse(await request.json());
    const opp = await db.opportunity.findUnique({ where: { id: data.opportunityId } });
    if (!opp) return jsonError("Opportunity not found", 404);

    const app = await db.application.upsert({
      where: {
        userId_opportunityId: {
          userId: session.user.id,
          opportunityId: data.opportunityId,
        },
      },
      create: {
        userId: session.user.id,
        opportunityId: data.opportunityId,
        status: data.status ?? "APPLIED",
        notes: data.notes,
      },
      update: {
        status: data.status ?? "APPLIED",
        notes: data.notes,
      },
    });

    await db.opportunity.update({
      where: { id: data.opportunityId },
      data: { applyCount: { increment: 1 } },
    });

    return jsonOk(app, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const data = applicationSchema.parse(await request.json());
    const app = await db.application.updateMany({
      where: { userId: session.user.id, opportunityId: data.opportunityId },
      data: {
        status: data.status,
        notes: data.notes,
      },
    });

    return jsonOk({ updated: app.count });
  } catch (err) {
    return handleApiError(err);
  }
}
