"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  OpportunityCard,
  InstitutionAvatar,
  type OpportunityCardData,
} from "@/components/opportunities/opportunity-card";
import { Badge } from "@/components/ui/badge";
import { relativeTime, formatDate } from "@/lib/utils";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";

interface InstitutionDetail {
  name: string;
  slug: string;
  shortName: string | null;
  type: string;
  country: string;
  state: string | null;
  city: string | null;
  website: string | null;
  overview: string | null;
  researchAreas: string[];
  prestigeScore: number;
  verified: boolean;
  lastCrawledAt: string | null;
  crawlStatus: string;
  opportunityCount: number;
  departments: { id: string; name: string }[];
  stats: {
    totalOpportunities: number;
    activeOpportunities: number;
    researchAreas: number;
    departments: number;
    avgPopularity: number;
  };
  currentOpportunities: OpportunityCardData[];
  pastOpportunities: OpportunityCardData[];
}

export default function InstitutionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<InstitutionDetail | null>(null);
  const [tab, setTab] = useState<"current" | "past">("current");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/institutions/${slug}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;
  if (!data) return <div>Institution not found.</div>;

  const list = tab === "current" ? data.currentOpportunities : data.pastOpportunities;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/institutions" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="h-4 w-4" /> Institutions
      </Link>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <InstitutionAvatar name={data.shortName || data.name} size="lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
              {data.verified && <Badge variant="success">Verified</Badge>}
              <Badge variant="secondary">{data.type.replace("_", " ")}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
              <MapPin className="h-3.5 w-3.5" />
              {[data.city, data.state, data.country].filter(Boolean).join(", ")}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {data.overview}
            </p>
            {data.website && (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
              >
                Official website <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Active opps", v: data.stats.activeOpportunities },
            { l: "Total opps", v: data.stats.totalOpportunities },
            { l: "Prestige", v: data.prestigeScore },
            { l: "Departments", v: data.stats.departments },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
              <div className="text-xs text-zinc-500">{s.l}</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium">Research areas</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.researchAreas.map((a) => (
              <Badge key={a} variant="outline">{a}</Badge>
            ))}
          </div>
        </div>

        {data.departments.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium">Departments</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.departments.map((d) => (
                <Badge key={d.id} variant="secondary">{d.name}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-4 border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-900">
          <span>Crawl status: {data.crawlStatus}</span>
          <span>
            Last crawl: {data.lastCrawledAt ? relativeTime(data.lastCrawledAt) : "Never"} (
            {formatDate(data.lastCrawledAt)})
          </span>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab("current")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "current" ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-900"}`}
          >
            Current ({data.currentOpportunities.length})
          </button>
          <button
            onClick={() => setTab("past")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "past" ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-900"}`}
          >
            Past ({data.pastOpportunities.length})
          </button>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-zinc-500">No opportunities in this category.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
