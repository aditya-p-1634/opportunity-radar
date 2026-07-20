"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  OpportunityCard,
  type OpportunityCardData,
} from "@/components/opportunities/opportunity-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OPPORTUNITY_TYPES, opportunityTypeLabel, COUNTRIES, FUNDING_TYPES, fundingLabel } from "@/lib/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";

function OpportunitiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<OpportunityCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState(searchParams.get("q") || "");

  const type = searchParams.get("type") || "";
  const country = searchParams.get("country") || "";
  const funding = searchParams.get("funding") || "";
  const sort = searchParams.get("sort") || "match";
  const deadline = searchParams.get("deadline") || "";
  const verified = searchParams.get("verified") || "";
  const mode = searchParams.get("mode") || "";

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.delete("page");
    router.push(`/opportunities?${params.toString()}`);
  }

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (!params.get("sort")) params.set("sort", "match");
    params.set("page", String(page));
    params.set("limit", "21");
    fetch(`/api/opportunities?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setItems(j.data.items);
          setTotal(j.data.pagination.total);
          setTotalPages(j.data.pagination.totalPages);
        }
      })
      .finally(() => setLoading(false));
  }, [searchParams, page]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total > 0 ? `${total} opportunities` : "Browse and filter the full catalog"}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ q });
            setPage(1);
          }}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="pl-9"
            placeholder="Search titles, institutions, research areas..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
        >
          <option value="match">Best match</option>
          <option value="deadline">Deadline</option>
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      {showFilters && (
        <div className="mb-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Type"
            value={type}
            onChange={(v) => updateParams({ type: v })}
            options={OPPORTUNITY_TYPES.map((t) => ({ value: t, label: opportunityTypeLabel(t) }))}
          />
          <FilterSelect
            label="Country"
            value={country}
            onChange={(v) => updateParams({ country: v })}
            options={COUNTRIES.map((c) => ({ value: c, label: c }))}
          />
          <FilterSelect
            label="Funding"
            value={funding}
            onChange={(v) => updateParams({ funding: v })}
            options={FUNDING_TYPES.map((f) => ({ value: f, label: fundingLabel(f) }))}
          />
          <FilterSelect
            label="Deadline"
            value={deadline}
            onChange={(v) => updateParams({ deadline: v })}
            options={[
              { value: "week", label: "Within 7 days" },
              { value: "month", label: "Within 30 days" },
              { value: "quarter", label: "Within 90 days" },
            ]}
          />
          <FilterSelect
            label="Mode"
            value={mode}
            onChange={(v) => updateParams({ mode: v })}
            options={[
              { value: "ONSITE", label: "On-site" },
              { value: "REMOTE", label: "Remote" },
              { value: "HYBRID", label: "Hybrid" },
            ]}
          />
          <FilterSelect
            label="Verified"
            value={verified}
            onChange={(v) => updateParams({ verified: v })}
            options={[
              { value: "true", label: "Verified only" },
              { value: "false", label: "Unverified" },
            ]}
          />
          <div className="flex items-end sm:col-span-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push("/opportunities");
                setQ("");
                setPage(1);
              }}
            >
              <X className="h-4 w-4" />
              Clear filters
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-12 text-center text-zinc-500 dark:border-zinc-800">
          No opportunities match your filters.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-500">{label}</label>
      <select
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense>
      <OpportunitiesContent />
    </Suspense>
  );
}
