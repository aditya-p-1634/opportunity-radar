import { db } from "@/lib/db";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const country = searchParams.get("country");
    const type = searchParams.get("type");
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Math.min(Number(searchParams.get("limit") ?? 24), 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { shortName: { contains: q } },
        { city: { contains: q } },
      ];
    }
    if (country) where.country = country;
    if (type) where.type = type;

    const [total, institutions] = await Promise.all([
      db.institution.count({ where }),
      db.institution.findMany({
        where,
        orderBy: [{ prestigeScore: "desc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    return jsonOk({
      items: institutions.map((i) => ({
        ...i,
        researchAreas: JSON.parse(i.researchAreas || "[]"),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
