"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InstitutionAvatar } from "@/components/opportunities/opportunity-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { COUNTRIES } from "@/lib/utils";
import { MapPin, Search } from "lucide-react";

interface Institution {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  type: string;
  country: string;
  city: string | null;
  prestigeScore: number;
  verified: boolean;
  opportunityCount: number;
  researchAreas: string[];
  lastCrawledAt: string | null;
}

export default function InstitutionsPage() {
  const [items, setItems] = useState<Institution[]>([]);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (country) params.set("country", country);
    if (type) params.set("type", type);
    params.set("limit", "60");
    const t = setTimeout(() => {
      fetch(`/api/institutions?${params}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setItems(j.data.items);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, country, type]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Institutions</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Top universities, research labs, and organizations we continuously monitor.
      </p>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input className="pl-9" placeholder="Search institutions..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All types</option>
          <option value="UNIVERSITY">University</option>
          <option value="RESEARCH_LAB">Research lab</option>
          <option value="INDUSTRY">Industry</option>
          <option value="GOVERNMENT">Government</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((inst) => (
            <Link
              key={inst.id}
              href={`/institutions/${inst.slug}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-500/40"
            >
              <div className="flex items-start gap-3">
                <InstitutionAvatar name={inst.shortName || inst.name} />
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug">{inst.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                    <MapPin className="h-3 w-3" />
                    {[inst.city, inst.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{inst.type.replace("_", " ")}</Badge>
                {inst.verified && <Badge variant="success">Verified</Badge>}
                <Badge variant="outline">{inst.opportunityCount} opps</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                <span>Prestige {inst.prestigeScore}</span>
                <span className="truncate max-w-[50%]">
                  {inst.researchAreas.slice(0, 2).join(" · ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
