"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  OpportunityCard,
  type OpportunityCardData,
} from "@/components/opportunities/opportunity-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  OPPORTUNITY_TYPES,
  opportunityTypeLabel,
  COUNTRIES,
  RESEARCH_AREAS,
  FUNDING_TYPES,
  fundingLabel,
  BRANCHES,
} from "@/lib/utils";
import { Search as SearchIcon, X, SlidersHorizontal, Sparkles, Flame, Clock, Building2, Laptop } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [funding, setFunding] = useState(searchParams.get("funding") || "");
  const [researchArea, setResearchArea] = useState(searchParams.get("researchArea") || "");
  const [branch, setBranch] = useState(searchParams.get("branch") || "");
  const [mode, setMode] = useState(searchParams.get("mode") || "");
  const [verified, setVerified] = useState(searchParams.get("verified") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [showFilters, setShowFilters] = useState(false);

  const [items, setItems] = useState<OpportunityCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sync state to URL search parameters
  const syncUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.push(`/search?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Fetch opportunities matching current search params
  const runSearch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (country) params.set("country", country);
    if (funding) params.set("funding", funding);
    if (researchArea) params.set("researchArea", researchArea);
    if (branch) params.set("branch", branch);
    if (mode) params.set("mode", mode);
    if (verified) params.set("verified", verified);
    params.set("sort", sort);
    params.set("limit", "30");

    try {
      const res = await fetch(`/api/opportunities?${params}`);
      const j = await res.json();
      if (j.success) {
        setItems(j.data.items);
        setTotal(j.data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [q, type, country, funding, researchArea, branch, mode, verified, sort]);

  // Debounced auto-search
  useEffect(() => {
    const t = setTimeout(() => {
      runSearch();
    }, 300);
    return () => clearTimeout(t);
  }, [q, type, country, funding, researchArea, branch, mode, verified, sort, runSearch]);

  // Quick Preset Handlers
  const applyPreset = (preset: "fully_funded" | "closing_soon" | "top_iits" | "remote") => {
    if (preset === "fully_funded") {
      setFunding("FULL");
      syncUrl({ funding: "FULL" });
    } else if (preset === "closing_soon") {
      syncUrl({ deadline: "month", sort: "deadline" });
    } else if (preset === "top_iits") {
      setQ("IIT");
      syncUrl({ q: "IIT" });
    } else if (preset === "remote") {
      setMode("REMOTE");
      syncUrl({ mode: "REMOTE" });
    }
  };

  const resetAll = () => {
    setQ("");
    setType("");
    setCountry("");
    setFunding("");
    setResearchArea("");
    setBranch("");
    setMode("");
    setVerified("");
    setSort("newest");
    router.push("/search");
  };

  // Compute active filters
  const activeFilters = [
    q && { key: "q", label: `Query: "${q}"`, clear: () => { setQ(""); syncUrl({ q: "" }); } },
    type && { key: "type", label: `Type: ${opportunityTypeLabel(type)}`, clear: () => { setType(""); syncUrl({ type: "" }); } },
    country && { key: "country", label: `Country: ${country}`, clear: () => { setCountry(""); syncUrl({ country: "" }); } },
    funding && { key: "funding", label: `Funding: ${fundingLabel(funding)}`, clear: () => { setFunding(""); syncUrl({ funding: "" }); } },
    researchArea && { key: "researchArea", label: `Area: ${researchArea}`, clear: () => { setResearchArea(""); syncUrl({ researchArea: "" }); } },
    branch && { key: "branch", label: `Branch: ${branch}`, clear: () => { setBranch(""); syncUrl({ branch: "" }); } },
    mode && { key: "mode", label: `Mode: ${mode}`, clear: () => { setMode(""); syncUrl({ mode: "" }); } },
    verified && { key: "verified", label: `Verified Only`, clear: () => { setVerified(""); syncUrl({ verified: "" }); } },
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">Search Opportunities</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Search across 250+ live opportunities from India&apos;s top research institutions.
        </p>
      </div>

      {/* Main Search Bar Card */}
      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="h-12 pl-10 text-base rounded-xl"
            placeholder="Search titles, institutions, skills — IISc, IIT Bombay SURGE, Machine Learning..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              syncUrl({ q: e.target.value });
            }}
            autoFocus
          />
        </div>

        {/* Quick Filter Presets Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-900">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-1">Quick Presets:</span>
          <button
            onClick={() => applyPreset("fully_funded")}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <Flame className="h-3.5 w-3.5 text-amber-500" /> Fully Funded
          </button>
          <button
            onClick={() => applyPreset("closing_soon")}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-800 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            <Clock className="h-3.5 w-3.5 text-red-500" /> Closing Soon
          </button>
          <button
            onClick={() => applyPreset("top_iits")}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Top IITs & IISc
          </button>
          <button
            onClick={() => applyPreset("remote")}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <Laptop className="h-3.5 w-3.5 text-emerald-500" /> Remote
          </button>
        </div>

        {/* Filter Select Controls Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Opportunity Type" value={type} onChange={(v) => { setType(v); syncUrl({ type: v }); }} options={OPPORTUNITY_TYPES.map((t) => ({ v: t, l: opportunityTypeLabel(t) }))} />
          <Select label="Funding" value={funding} onChange={(v) => { setFunding(v); syncUrl({ funding: v }); }} options={FUNDING_TYPES.map((f) => ({ v: f, l: fundingLabel(f) }))} />
          <Select label="Research Area" value={researchArea} onChange={(v) => { setResearchArea(v); syncUrl({ researchArea: v }); }} options={RESEARCH_AREAS.map((a) => ({ v: a, l: a }))} />
          <Select label="Academic Branch" value={branch} onChange={(v) => { setBranch(v); syncUrl({ branch: v }); }} options={BRANCHES.map((b) => ({ v: b, l: b }))} />
        </div>

        {/* Action & Toggle Controls */}
        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showFilters ? "Hide Extra Filters" : "More Filters"}
          </Button>
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={resetAll} className="text-xs text-zinc-500 hover:text-zinc-900">
              Reset All Filters
            </Button>
          )}
        </div>

        {/* Extra Expandable Filters */}
        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-900 sm:grid-cols-3">
            <Select label="Country" value={country} onChange={(v) => { setCountry(v); syncUrl({ country: v }); }} options={COUNTRIES.map((c) => ({ v: c, l: c }))} />
            <Select label="Work Mode" value={mode} onChange={(v) => { setMode(v); syncUrl({ mode: v }); }} options={[{ v: "ONSITE", l: "On-site" }, { v: "REMOTE", l: "Remote" }, { v: "HYBRID", l: "Hybrid" }]} />
            <Select label="Sort By" value={sort} onChange={(v) => { setSort(v); syncUrl({ sort: v }); }} options={[{ v: "newest", l: "Newest First" }, { v: "deadline", l: "Closing Soonest" }, { v: "popular", l: "Popular" }]} />
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Active Filters:</span>
          {activeFilters.map((af) => (
            <Badge key={af.key} variant="secondary" className="gap-1 pr-1.5 text-xs py-1">
              {af.label}
              <button onClick={af.clear} className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 p-0.5" aria-label={`Clear ${af.label}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Results Section */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-60 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-500">
              Showing {items.length} of {total} opportunities
            </p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              No matching opportunities found. Try adjusting your query or resetting filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((o) => (
                <OpportunityCard key={o.id} opportunity={o} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-500">{label}</label>
      <select
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="skeleton h-40 rounded-2xl" />}>
      <SearchContent />
    </Suspense>
  );
}
