"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, opportunityTypeLabel, formatDeadline } from "@/lib/utils";
import { InstitutionAvatar } from "@/components/opportunities/opportunity-card";
import { ExternalLink, CheckCircle2, Clock, XCircle, Send, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AppliedItem {
  applicationId: string;
  status: string;
  notes: string | null;
  appliedAt: string;
  id: string;
  slug: string;
  title: string;
  type: string;
  deadline: string | null;
  officialUrl?: string | null;
  institution: { name: string; shortName: string | null; slug: string };
}

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
  APPLIED: "default",
  IN_PROGRESS: "warning",
  SUBMITTED: "default",
  ACCEPTED: "success",
  REJECTED: "danger",
  WITHDRAWN: "secondary",
};

export default function AppliedPage() {
  const [items, setItems] = useState<AppliedItem[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setItems(j.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(opportunityId: string, status: string) {
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setItems((prev) =>
        prev.map((i) => (i.id === opportunityId ? { ...i, status } : i))
      );
      toast.success(`Application updated to ${status}`);
    } catch {
      toast.error("Failed to update application status");
    }
  }

  const filteredItems = filter === "ALL" ? items : items.filter((i) => i.status === filter);

  // Metrics
  const totalCount = items.length;
  const inProgressCount = items.filter((i) => i.status === "IN_PROGRESS" || i.status === "APPLIED").length;
  const acceptedCount = items.filter((i) => i.status === "ACCEPTED").length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Application Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track and update the status of your research applications.
          </p>
        </div>
        <Link
          href="/opportunities"
          className="inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
        >
          Browse Opportunities →
        </Link>
      </div>

      {/* Overview Metric Cards */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Total Tracked</span>
            <Send className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums">{totalCount}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>In Review / Progress</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums">{inProgressCount}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Accepted</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-emerald-600">{acceptedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {[
          { key: "ALL", label: "All Applications" },
          { key: "APPLIED", label: "Applied" },
          { key: "IN_PROGRESS", label: "In Progress" },
          { key: "SUBMITTED", label: "Submitted" },
          { key: "ACCEPTED", label: "Accepted" },
          { key: "REJECTED", label: "Rejected" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              filter === tab.key
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Application List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          No applications in this view. Mark opportunities as applied from their detail page.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.applicationId}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-950"
            >
              <InstitutionAvatar name={item.institution.shortName || item.institution.name} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/opportunities/${item.slug}`}
                  className="font-semibold text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
                >
                  {item.title}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {item.institution.name} · {opportunityTypeLabel(item.type)} · Applied {formatDate(item.appliedAt)}
                </p>
                {item.deadline && (
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Deadline: {formatDeadline(item.deadline)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant[item.status] || "secondary"}>{item.status}</Badge>
                <select
                  className="h-9 rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-900"
                  value={item.status}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                >
                  {["APPLIED", "IN_PROGRESS", "SUBMITTED", "ACCEPTED", "REJECTED", "WITHDRAWN"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {item.officialUrl && (
                  <a
                    href={item.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    title="Official application portal"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
