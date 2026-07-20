"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setItems(j.data.items);
          setUnread(j.data.unread);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-zinc-500">{unread} unread</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="skeleton h-40 rounded-2xl" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-zinc-500">
          <Bell className="mx-auto mb-2 h-8 w-8 opacity-40" />
          You&apos;re all caught up.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 transition ${
                n.read
                  ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  : "border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/30 dark:bg-indigo-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{n.title}</h3>
                    <Badge variant="secondary">{n.type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{n.body}</p>
                  <p className="mt-2 text-xs text-zinc-400">{relativeTime(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {n.link && (
                    <Link href={n.link} className="text-xs text-indigo-600 hover:underline" onClick={() => markOne(n.id)}>
                      Open
                    </Link>
                  )}
                  {!n.read && (
                    <button className="text-xs text-zinc-500 hover:underline" onClick={() => markOne(n.id)}>
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
