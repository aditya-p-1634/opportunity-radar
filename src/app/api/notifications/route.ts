import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/engines/notifications";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const notifications = await db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unread = notifications.filter((n) => !n.read).length;

    return jsonOk({ items: notifications, unread });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const schema = z.object({
      id: z.string().optional(),
      all: z.boolean().optional(),
    });
    const data = schema.parse(body);

    if (data.all) {
      await markAllNotificationsRead(session.user.id);
    } else if (data.id) {
      await markNotificationRead(session.user.id, data.id);
    }

    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
