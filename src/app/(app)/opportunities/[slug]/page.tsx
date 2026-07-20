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
import { Button } from "@/components/ui/button";
import {
  formatDeadline,
  formatDate,
  opportunityTypeLabel,
  fundingLabel,
  modeLabel,
  eligibilityLabel,
  deadlineUrgency,
  cn,
} from "@/lib/utils";
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Send,
  MapPin,
  Clock,
  Banknote,
  BadgeCheck,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface Detail {
  id: string;
  slug: string;
  title: string;
  type: string;
  description: string;
  researchArea: string | null;
  eligibilityText: string | null;
  branches: string[];
  minDegree: string | null;
  minCgpa: number | null;
  funding: string | null;
  fundingAmount: string | null;
  location: string | null;
  country: string | null;
  mode: string;
  duration: string | null;
  deadline: string | null;
  startDate: string | null;
  officialUrl: string | null;
  applicationUrl: string | null;
  verified: boolean;
  viewCount: number;
  matchScore: number;
  matchReasons: string[];
  matchFactors: Record<string, number>;
  eligibility: { status: string; score: number; reasons: string[] };
  bookmarked: boolean;
  application: { status: string } | null;
  institution: {
    name: string;
    shortName: string | null;
    slug: string;
    logoUrl: string | null;
    country: string;
    overview: string | null;
    prestigeScore: number;
  };
  related: OpportunityCardData[];
}

export default function OpportunityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetch(`/api/opportunities/${slug}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setData(j.data);
          setBookmarked(j.data.bookmarked);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  async function toggleBookmark() {
    if (!data) return;
    const res = await fetch("/api/bookmarks", {
      method: bookmarked ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: data.id }),
    });
    if (res.ok) {
      setBookmarked(!bookmarked);
      toast.success(bookmarked ? "Removed from saved" : "Saved");
    } else {
      const j = await res.json();
      toast.error(j.error || "Sign in to save");
    }
  }

  async function markApplied() {
    if (!data) return;
    setApplying(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: data.id, status: "APPLIED" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success("Marked as applied");
      setData({ ...data, application: { status: "APPLIED" } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;
  if (!data) return <div className="text-zinc-500">Opportunity not found.</div>;

  const urgency = deadlineUrgency(data.deadline);
  const eligVariant =
    data.eligibility.status === "ELIGIBLE"
      ? "success"
      : data.eligibility.status === "LIKELY"
        ? "default"
        : data.eligibility.status === "POSSIBLY"
          ? "warning"
          : "danger";

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/opportunities"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to opportunities
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start gap-4">
              <InstitutionAvatar
                name={data.institution.shortName || data.institution.name}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/institutions/${data.institution.slug}`}
                  className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {data.institution.name}
                </Link>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.title}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{opportunityTypeLabel(data.type)}</Badge>
                  {data.verified && (
                    <Badge variant="success" className="gap-1">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                  {data.researchArea && <Badge variant="secondary">{data.researchArea}</Badge>}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Meta icon={MapPin} label="Location" value={data.location || data.country || "—"} />
              <Meta icon={Banknote} label="Funding" value={fundingLabel(data.funding)} />
              <Meta icon={Clock} label="Duration" value={data.duration || "—"} />
              <Meta
                icon={Clock}
                label="Deadline"
                value={formatDeadline(data.deadline)}
                className={cn(
                  urgency === "critical" && "text-red-600",
                  urgency === "soon" && "text-amber-600"
                )}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={toggleBookmark} variant="outline">
                {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                {bookmarked ? "Saved" : "Save"}
              </Button>
              <Button onClick={markApplied} disabled={applying || !!data.application}>
                <Send className="h-4 w-4" />
                {data.application ? `Applied (${data.application.status})` : "Mark applied"}
              </Button>
              {(data.applicationUrl || data.officialUrl) && (
                <a
                  href={data.applicationUrl || data.officialUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Official link <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">About</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {data.description}
            </p>
            {data.eligibilityText && (
              <>
                <h3 className="mt-6 font-medium">Eligibility</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{data.eligibilityText}</p>
              </>
            )}
            {data.branches?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {data.branches.map((b) => (
                  <Badge key={b} variant="outline">
                    {b}
                  </Badge>
                ))}
              </div>
            )}
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Mode</dt>
                <dd className="font-medium">{modeLabel(data.mode)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Funding amount</dt>
                <dd className="font-medium">{data.fundingAmount || "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Start date</dt>
                <dd className="font-medium">{formatDate(data.startDate)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Min CGPA</dt>
                <dd className="font-medium">{data.minCgpa ?? "Not specified"}</dd>
              </div>
            </dl>
          </div>

          {data.related?.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">Related opportunities</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.related.slice(0, 4).map((o) => (
                  <OpportunityCard key={o.id} opportunity={o} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: match + eligibility */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-center">
              <div
                className={cn(
                  "text-4xl font-bold tabular-nums",
                  data.matchScore >= 80
                    ? "text-emerald-600"
                    : data.matchScore >= 60
                      ? "text-indigo-600"
                      : "text-zinc-500"
                )}
              >
                {data.matchScore}%
              </div>
              <div className="text-xs uppercase tracking-wide text-zinc-400">Match score</div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {data.matchReasons?.map((r) => (
                <Badge key={r} variant="match">
                  {r}
                </Badge>
              ))}
            </div>
            {data.matchFactors && (
              <div className="mt-5 space-y-2">
                {Object.entries(data.matchFactors).map(([k, v]) => (
                  <div key={k}>
                    <div className="mb-0.5 flex justify-between text-[11px] text-zinc-500">
                      <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                      <span>{Math.round(v)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.min(100, v)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Eligibility</h3>
              <Badge variant={eligVariant as "success"}>{eligibilityLabel(data.eligibility.status)}</Badge>
            </div>
            <ul className="mt-3 space-y-2">
              {data.eligibility.reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="font-medium">Institution</h3>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {data.institution.overview?.slice(0, 160)}…
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Prestige score: {data.institution.prestigeScore}/100
            </p>
            <Link
              href={`/institutions/${data.institution.slug}`}
              className="mt-3 inline-block text-indigo-600 hover:underline dark:text-indigo-400"
            >
              View institution →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={cn("mt-1 font-medium", className)}>{value}</div>
    </div>
  );
}
