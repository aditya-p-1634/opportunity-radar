import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonError(
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    { success: false, error: message, details },
    { status }
  );
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError("Validation failed", 400, err.flatten());
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (err.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (err.message === "NOT_FOUND") return jsonError("Not found", 404);
    console.error(err);
    return jsonError(err.message || "Internal server error", 500);
  }
  console.error(err);
  return jsonError("Internal server error", 500);
}

export async function parseBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}
