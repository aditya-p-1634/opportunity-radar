"use client";

import { useEffect, useState, useCallback } from "react";
import {
  OpportunityCard,
  type OpportunityCardData,
} from "@/components/opportunities/opportunity-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  OPPORTUNITY_TYPES,
  opportunityTypeLabel,
  COUNTRIES,
  RESEARCH_AREAS,
  FUNDING_TYPES,
  fundingLabel,
  BRANCHES,
} from "@/lib/utils";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [funding, setFunding] = useState("");
  const [researchArea, setResearchArea] = useState("");
  const [branch, setBranch] = useState("");
  const [mode, setMode] = useState("");
  const [verified, setVerified] = useState("");
  const [sort, setSort] = useState("match");
  const [items, setItems] = useState<OpportunityCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
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

  // Instant search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (q.length >= 2 || type || country || funding || researchArea) {
        runSearch();
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, type, country, funding, researchArea, branch, mode, verified, sort, runSearch]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Search</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Instant global search with advanced filters across the full opportunity catalog.
      </p>

      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="h-12 pl-10 text-base"
            placeholder="Search anything — MIT AI internship, ETH fellowship, ISRO..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Type" value={type} onChange={setType} options={OPPORTUNITY_TYPES.map((t) => ({ v: t, l: opportunityTypeLabel(t) }))} />
          <Select label="Country" value={country} onChange={setCountry} options={COUNTRIES.map((c) => ({ v: c, l: c }))} />
          <Select label="Funding" value={funding} onChange={setFunding} options={FUNDING_TYPES.map((f) => ({ v: f, l: fundingLabel(f) }))} />
          <Select label="Research area" value={researchArea} onChange={setResearchArea} options={RESEARCH_AREAS.map((a) => ({ v: a, l: a }))} />
          <Select label="Branch" value={branch} onChange={setBranch} options={BRANCHES.map((b) => ({ v: b, l: b }))} />
          <Select
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { v: "ONSITE", l: "On-site" },
              { v: "REMOTE", l: "Remote" },
              { v: "HYBRID", l: "Hybrid" },
            ]}
          />
          <Select
            label="Verified"
            value={verified}
            onChange={setVerified}
            options={[
              { v: "true", l: "Verified only" },
              { v: "false", l: "Unverified" },
            ]}
          />
          <Select
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { v: "match", l: "Best match" },
              { v: "deadline", l: "Deadline" },
              { v: "newest", l: "Newest" },
              { v: "popular", l: "Popular" },
            ]}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={runSearch}>Search</Button>
          <Button
            variant="ghost"
            onClick={() => {
              setQ("");
              setType("");
              setCountry("");
              setFunding("");
              setResearchArea("");
              setBranch("");
              setMode("");
              setVerified("");
              setItems([]);
              setSearched(false);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {loading && <div className="skeleton h-40 rounded-2xl" />}

      {!loading && searched && (
        <>
          <p className="mb-4 text-sm text-zinc-500">{total} results</p>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-zinc-500">
              No results. Try broader filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
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
