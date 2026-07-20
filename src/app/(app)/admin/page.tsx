"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { relativeTime, formatDate, opportunityTypeLabel } from "@/lib/utils";
import { toast } from "sonner";
import {
  Users,
  Building2,
  Briefcase,
  Activity,
  Play,
  Database,
  Shield,
} from "lucide-react";

interface AdminStats {
  overview: {
    users: number;
    opportunities: number;
    institutions: number;
    bookmarks: number;
    applications: number;
    activeOpps: number;
    verifiedOpps: number;
    notifications: number;
  };
  crawlerHealth: {
    running: number;
    failed: number;
    success: number;
    lastSuccessAt: string | null;
  };
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
    emailVerified: string | null;
  }[];
  oppsByType: { type: string; count: number }[];
  recentJobs: {
    id: string;
    name: string;
    status: string;
    itemsFound: number;
    itemsAdded: number;
    itemsUpdated: number;
    startedAt: string | null;
    finishedAt: string | null;
    errorMessage: string | null;
    institution: { name: string; slug: string } | null;
  }[];
}

export default function AdminPage() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [logs, setLogs] = useState<
    {
      id: string;
      name: string;
      status: string;
      logs: { level: string; message: string; createdAt: string }[];
    }[]
  >([]);

  function load() {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
        else toast.error(j.error || "Failed to load admin");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    fetch("/api/admin/crawler")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setLogs(j.data);
      });
  }, []);

  async function runCrawl() {
    setCrawling(true);
    try {
      const res = await fetch("/api/admin/crawler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(
        `Crawl ${j.data.status}: +${j.data.itemsAdded} added, ${j.data.itemsUpdated} updated`
      );
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Crawl failed");
    } finally {
      setCrawling(false);
    }
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;
  if (!data) return <div>Unable to load admin portal.</div>;

  const cards = [
    { label: "Users", value: data.overview.users, icon: Users },
    { label: "Institutions", value: data.overview.institutions, icon: Building2 },
    { label: "Opportunities", value: data.overview.opportunities, icon: Briefcase },
    { label: "Active", value: data.overview.activeOpps, icon: Activity },
    { label: "Verified", value: data.overview.verifiedOpps, icon: Shield },
    { label: "Applications", value: data.overview.applications, icon: Database },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin portal</h1>
          <p className="text-sm text-zinc-500">
            System health, crawler monitoring, and platform analytics
          </p>
        </div>
        <Button onClick={runCrawl} disabled={crawling}>
          <Play className="h-4 w-4" />
          {crawling ? "Crawling..." : "Run crawler"}
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between text-xs text-zinc-500">
              {c.label}
              <c.icon className="h-3.5 w-3.5" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 font-semibold">Crawler health</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-semibold text-emerald-600">
                {data.crawlerHealth.success}
              </div>
              <div className="text-xs text-zinc-500">Success</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-amber-600">
                {data.crawlerHealth.running}
              </div>
              <div className="text-xs text-zinc-500">Running</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-red-600">
                {data.crawlerHealth.failed}
              </div>
              <div className="text-xs text-zinc-500">Failed</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Last success:{" "}
            {data.crawlerHealth.lastSuccessAt
              ? relativeTime(data.crawlerHealth.lastSuccessAt)
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 font-semibold">Opportunities by type</h2>
          <div className="space-y-2">
            {data.oppsByType.map((t) => (
              <div key={t.type} className="flex items-center justify-between text-sm">
                <span>{opportunityTypeLabel(t.type)}</span>
                <span className="font-medium tabular-nums">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 font-semibold">Recent crawler jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="pb-2 pr-4">Job</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Found</th>
                <th className="pb-2 pr-4">Added</th>
                <th className="pb-2">Finished</th>
              </tr>
            </thead>
            <tbody>
              {data.recentJobs.map((j) => (
                <tr key={j.id} className="border-t border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4">{j.name}</td>
                  <td className="py-2 pr-4">
                    <Badge
                      variant={
                        j.status === "SUCCESS"
                          ? "success"
                          : j.status === "FAILED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {j.status}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 tabular-nums">{j.itemsFound}</td>
                  <td className="py-2 pr-4 tabular-nums">{j.itemsAdded}</td>
                  <td className="py-2 text-zinc-500">
                    {j.finishedAt ? formatDate(j.finishedAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 font-semibold">Recent users</h2>
        <div className="space-y-2">
          {data.recentUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{u.name || "—"}</span>
                <span className="ml-2 text-zinc-500">{u.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{u.role}</Badge>
                <span className="text-xs text-zinc-400">{formatDate(u.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {logs[0]?.logs && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 font-semibold">Latest crawler logs</h2>
          <div className="max-h-64 space-y-1 overflow-y-auto font-mono text-xs">
            {logs[0].logs.map((l, i) => (
              <div key={i} className="flex gap-2">
                <span
                  className={
                    l.level === "ERROR"
                      ? "text-red-500"
                      : l.level === "WARN"
                        ? "text-amber-500"
                        : "text-zinc-400"
                  }
                >
                  [{l.level}]
                </span>
                <span>{l.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
