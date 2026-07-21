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
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  RefreshCw,
  Gauge,
  ListFilter,
  Radio,
  FileCheck,
} from "lucide-react";

interface OperationalMetrics {
  totalCrawls: number;
  successRate: number;
  avgRuntimeMs: number;
  duplicateRate: number;
  institutionCoverage: string;
}

interface AdminStats {
  overview: {
    users: number;
    opportunities: number;
    institutions: number;
    bookmarks: number;
    applications: number;
    activeOpps: number;
    expiredOpps: number;
    closingSoonOpps: number;
    newTodayOpps: number;
    verifiedOpps: number;
    notifications: number;
  };
  operationalMetrics: OperationalMetrics;
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
    itemsSkipped: number;
    schedulerType?: string;
    targetGroup?: string;
    executionTimeMs?: number;
    errorsCount?: number;
    startedAt: string | null;
    finishedAt: string | null;
    errorMessage: string | null;
    institution: { name: string; slug: string } | null;
  }[];
  recentActivity: {
    id: string;
    level: string;
    message: string;
    createdAt: string;
    job: { name: string; status: string };
  }[];
}

export default function AdminPage() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [targetGroup, setTargetGroup] = useState("ALL");

  function load() {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
        else toast.error(j.error || "Failed to load admin telemetry");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function runCrawl() {
    setCrawling(true);
    try {
      const res = await fetch("/api/admin/crawler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGroup }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(
        `Crawl finished (${j.data.status}): +${j.data.result?.itemsAdded || 0} added, ${j.data.result?.itemsUpdated || 0} updated`
      );
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Crawl trigger failed");
    } finally {
      setCrawling(false);
    }
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;
  if (!data) return <div className="p-8 text-center text-zinc-500">Unable to load operations dashboard.</div>;

  const overviewCards = [
    { label: "Active Opportunities", value: data.overview.activeOpps, icon: Activity, color: "text-emerald-600" },
    { label: "New Opps Today", value: data.overview.newTodayOpps, icon: Flame, color: "text-amber-500" },
    { label: "Closing Soon (<=7d)", value: data.overview.closingSoonOpps, icon: Clock, color: "text-indigo-600" },
    { label: "Expired", value: data.overview.expiredOpps, icon: AlertTriangle, color: "text-red-500" },
    { label: "Institutions Covered", value: data.overview.institutions, icon: Building2, color: "text-blue-600" },
    { label: "Verified Sources", value: data.overview.verifiedOpps, icon: Shield, color: "text-teal-600" },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Control Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Operations & Health Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Real-time telemetry, automated crawl scheduler, and platform metrics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-950"
            value={targetGroup}
            onChange={(e) => setTargetGroup(e.target.value)}
          >
            <option value="ALL">All Registered Institutions (28)</option>
            <option value="TIER1_IITS">Tier-1 IITs</option>
            <option value="IISERS">IISER Network</option>
            <option value="IIITS">IIITs & Specialized Labs</option>
          </select>
          <Button onClick={runCrawl} disabled={crawling} className="gap-2 bg-indigo-600 text-white hover:bg-indigo-500">
            {crawling ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {crawling ? "Running Crawl..." : "Trigger Crawl Batch"}
          </Button>
        </div>
      </div>

      {/* Operational Overview Metrics */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {overviewCards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between text-xs text-zinc-500">
              {c.label}
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Operational Performance & Crawler Health */}
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {/* Performance Metrics Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
            <Gauge className="h-4 w-4 text-indigo-500" /> Operational Metrics
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Total Crawls Executed</dt>
              <dd className="font-semibold">{data.operationalMetrics.totalCrawls}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Crawl Success Rate</dt>
              <dd className="font-semibold text-emerald-600">{data.operationalMetrics.successRate}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Avg Crawl Duration</dt>
              <dd className="font-semibold">{Math.round(data.operationalMetrics.avgRuntimeMs / 1000)}s</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Deduplication Rate</dt>
              <dd className="font-semibold text-blue-600">{data.operationalMetrics.duplicateRate}%</dd>
            </div>
          </dl>
        </div>

        {/* Crawler Status Summary */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
            <Radio className="h-4 w-4 text-emerald-500" /> Crawler Health State
          </h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <div className="text-xl font-bold text-emerald-600">{data.crawlerHealth.success}</div>
              <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">Healthy</div>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
              <div className="text-xl font-bold text-amber-600">{data.crawlerHealth.running}</div>
              <div className="text-[11px] font-medium text-amber-800 dark:text-amber-300">Running</div>
            </div>
            <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950/30">
              <div className="text-xl font-bold text-red-600">{data.crawlerHealth.failed}</div>
              <div className="text-[11px] font-medium text-red-800 dark:text-red-300">Failed</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Last successful execution:{" "}
            {data.crawlerHealth.lastSuccessAt
              ? relativeTime(data.crawlerHealth.lastSuccessAt)
              : "—"}
          </p>
        </div>

        {/* Opportunity Types Breakdown */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
            <ListFilter className="h-4 w-4 text-violet-500" /> Catalog Distribution
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {data.oppsByType.map((t) => (
              <div key={t.type} className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">{opportunityTypeLabel(t.type)}</span>
                <span className="font-semibold tabular-nums">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Crawl Execution History Table */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">Crawl Execution History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="pb-3 pr-4 font-semibold">Job / Trigger</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Found</th>
                <th className="pb-3 pr-4 font-semibold">Added</th>
                <th className="pb-3 pr-4 font-semibold">Updated</th>
                <th className="pb-3 pr-4 font-semibold">Skipped</th>
                <th className="pb-3 pr-4 font-semibold">Duration</th>
                <th className="pb-3 font-semibold">Finished</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {data.recentJobs.map((j) => (
                <tr key={j.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                  <td className="py-3 pr-4 font-medium">
                    {j.name}
                    <div className="text-[10px] text-zinc-400">Trigger: {j.schedulerType || "MANUAL"}</div>
                  </td>
                  <td className="py-3 pr-4">
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
                  <td className="py-3 pr-4 tabular-nums">{j.itemsFound}</td>
                  <td className="py-3 pr-4 tabular-nums text-emerald-600 font-semibold">+{j.itemsAdded}</td>
                  <td className="py-3 pr-4 tabular-nums text-blue-600">{j.itemsUpdated}</td>
                  <td className="py-3 pr-4 tabular-nums text-zinc-400">{j.itemsSkipped}</td>
                  <td className="py-3 pr-4 tabular-nums">{j.executionTimeMs ? `${Math.round(j.executionTimeMs / 1000)}s` : "—"}</td>
                  <td className="py-3 text-zinc-500">
                    {j.finishedAt ? formatDate(j.finishedAt) : "Running..."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Log Feed */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">Live Operational Activity Log</h2>
        <div className="max-h-60 space-y-2 overflow-y-auto font-mono text-xs">
          {data.recentActivity.map((log) => (
            <div key={log.id} className="flex items-start gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-900">
              <span className="text-[10px] text-zinc-400 shrink-0">{relativeTime(log.createdAt)}</span>
              <span
                className={
                  log.level === "ERROR"
                    ? "text-red-500 font-semibold"
                    : log.level === "WARN"
                      ? "text-amber-500 font-semibold"
                      : "text-emerald-600"
                }
              >
                [{log.level}]
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
