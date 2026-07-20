import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { computeProfileCompletion, toJson } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });
    if (!user) return jsonError("Not found", 404);

    return jsonOk({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      emailVerified: user.emailVerified,
      profile: user.profile
        ? {
            ...user.profile,
            skills: JSON.parse(user.profile.skills || "[]"),
            programmingLanguages: JSON.parse(user.profile.programmingLanguages || "[]"),
            researchInterests: JSON.parse(user.profile.researchInterests || "[]"),
            preferredCountries: JSON.parse(user.profile.preferredCountries || "[]"),
            preferredInstitutions: JSON.parse(user.profile.preferredInstitutions || "[]"),
          }
        : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const data = profileSchema.parse(body);

    if (data.name) {
      await db.user.update({
        where: { id: session.user.id },
        data: { name: data.name },
      });
    }

    const profileData = {
      university: data.university ?? undefined,
      degree: data.degree ?? undefined,
      branch: data.branch ?? undefined,
      year: data.year ?? undefined,
      cgpa: data.cgpa ?? undefined,
      maxCgpa: data.maxCgpa ?? undefined,
      skills: data.skills ? toJson(data.skills) : undefined,
      programmingLanguages: data.programmingLanguages
        ? toJson(data.programmingLanguages)
        : undefined,
      researchInterests: data.researchInterests ? toJson(data.researchInterests) : undefined,
      preferredCountries: data.preferredCountries ? toJson(data.preferredCountries) : undefined,
      preferredInstitutions: data.preferredInstitutions
        ? toJson(data.preferredInstitutions)
        : undefined,
      portfolioUrl: data.portfolioUrl || null,
      githubUrl: data.githubUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      bio: data.bio ?? undefined,
    };

    // Remove undefined keys
    const cleaned = Object.fromEntries(
      Object.entries(profileData).filter(([, v]) => v !== undefined)
    );

    const existing = await db.profile.findUnique({ where: { userId: session.user.id } });
    const merged = { ...(existing ?? {}), ...cleaned };
    const completionPercent = computeProfileCompletion(merged as Parameters<typeof computeProfileCompletion>[0]);

    const profile = await db.profile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...cleaned,
        completionPercent,
      },
      update: {
        ...cleaned,
        completionPercent,
      },
    });

    return jsonOk({
      ...profile,
      skills: JSON.parse(profile.skills || "[]"),
      programmingLanguages: JSON.parse(profile.programmingLanguages || "[]"),
      researchInterests: JSON.parse(profile.researchInterests || "[]"),
      preferredCountries: JSON.parse(profile.preferredCountries || "[]"),
      preferredInstitutions: JSON.parse(profile.preferredInstitutions || "[]"),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
