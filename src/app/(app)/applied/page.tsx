"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, opportunityTypeLabel } from "@/lib/utils";
import { InstitutionAvatar } from "@/components/opportunities/opportunity-card";

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
  matchScore: number;
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
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId, status }),
    });
    setItems((prev) =>
      prev.map((i) => (i.id === opportunityId ? { ...i, status } : i))
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Applied</h1>
      <p className="mb-6 text-sm text-zinc-500">Track applications you&apos;ve started or submitted.</p>

      {loading ? (
        <div className="skeleton h-40 rounded-2xl" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-zinc-500">
          No applications yet. Mark opportunities as applied from their detail page.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.applicationId}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-950"
            >
              <InstitutionAvatar name={item.institution.shortName || item.institution.name} />
              <div className="min-w-0 flex-1">
                <Link href={`/opportunities/${item.slug}`} className="font-medium hover:text-indigo-600">
                  {item.title}
                </Link>
                <p className="text-sm text-zinc-500">
                  {item.institution.name} · {opportunityTypeLabel(item.type)} · Applied{" "}
                  {formatDate(item.appliedAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-indigo-600">{item.matchScore}%</span>
                <Badge variant={statusVariant[item.status] || "secondary"}>{item.status}</Badge>
                <select
                  className="h-8 rounded-md border border-zinc-200 bg-transparent px-2 text-xs dark:border-zinc-700"
                  value={item.status}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                >
                  {["APPLIED", "IN_PROGRESS", "SUBMITTED", "ACCEPTED", "REJECTED", "WITHDRAWN"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
