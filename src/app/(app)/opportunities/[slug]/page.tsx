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
  Code2,
  GraduationCap,
  Building2,
  CalendarDays,
  ShieldCheck,
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
  requiredSkills?: string | string[] | null;
  confidenceScore?: number;
  bookmarked: boolean;
  application: { status: string } | null;
  institution: {
    name: string;
    shortName: string | null;
    slug: string;
    logoUrl: string | null;
    country: string;
    city?: string | null;
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
      toast.success(bookmarked ? "Removed from saved" : "Saved to bookmarks");
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
      toast.success("Marked as applied in tracker");
      setData({ ...data, application: { status: "APPLIED" } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;
  if (!data) return <div className="p-12 text-center text-zinc-500">Opportunity not found.</div>;

  const urgency = deadlineUrgency(data.deadline);

  // Parse required skills
  let skills: string[] = [];
  if (Array.isArray(data.requiredSkills)) {
    skills = data.requiredSkills;
  } else if (typeof data.requiredSkills === "string") {
    try {
      skills = JSON.parse(data.requiredSkills);
    } catch {
      skills = [];
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/opportunities"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to opportunities
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start gap-4">
              <InstitutionAvatar
                name={data.institution.shortName || data.institution.name}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/institutions/${data.institution.slug}`}
                  className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {data.institution.name}
                </Link>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                  {data.title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{opportunityTypeLabel(data.type)}</Badge>
                  <Badge variant="outline">{modeLabel(data.mode)}</Badge>
                  {data.verified && (
                    <Badge variant="success" className="gap-1">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified Source
                    </Badge>
                  )}
                  {data.researchArea && <Badge variant="secondary">{data.researchArea}</Badge>}
                </div>
              </div>
            </div>

            {/* Quick Metadata Stats Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Meta icon={MapPin} label="Location" value={data.location || data.country || "—"} />
              <Meta icon={Banknote} label="Funding" value={fundingLabel(data.funding)} />
              <Meta icon={Clock} label="Duration" value={data.duration || "Flexible"} />
              <Meta
                icon={CalendarDays}
                label="Deadline"
                value={formatDeadline(data.deadline)}
                className={cn(
                  urgency === "critical" && "text-red-600 font-semibold",
                  urgency === "soon" && "text-amber-600 font-semibold"
                )}
              />
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-900">
              {(data.applicationUrl || data.officialUrl) && (
                <a
                  href={data.applicationUrl || data.officialUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Apply on Official Portal <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <Button onClick={markApplied} disabled={applying || !!data.application} variant="secondary">
                <Send className="h-4 w-4" />
                {data.application ? `Tracked (${data.application.status})` : "Mark Applied"}
              </Button>
              <Button onClick={toggleBookmark} variant="outline">
                {bookmarked ? <BookmarkCheck className="h-4 w-4 text-indigo-600" /> : <Bookmark className="h-4 w-4" />}
                {bookmarked ? "Saved" : "Save"}
              </Button>
            </div>
          </div>

          {/* Description Section */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold tracking-tight">About Opportunity</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {data.description}
            </p>

            {/* Required Skills */}
            {skills.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-indigo-500" />
                  Required Skills & Technologies
                </h3>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1 text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility & Qualifications */}
            <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-900">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-500" />
                Eligibility Criteria
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {data.eligibilityText || "Open to eligible students in matching academic disciplines."}
              </p>
              {data.branches?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.branches.map((b) => (
                    <Badge key={b} variant="outline">
                      {b}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Metadata Grid */}
            <dl className="mt-6 grid gap-4 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900/60 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-zinc-500">Work Mode</dt>
                <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{modeLabel(data.mode)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Funding Amount</dt>
                <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{data.fundingAmount || "Stipend / Support provided"}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Start Date</dt>
                <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{formatDate(data.startDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Minimum CGPA Requirement</dt>
                <dd className="font-semibold text-zinc-800 dark:text-zinc-200">{data.minCgpa ? `${data.minCgpa} / 10.0` : "No strict CGPA cutoff specified"}</dd>
              </div>
            </dl>
          </div>

          {/* Related Opportunities */}
          {data.related?.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Related Opportunities</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.related.slice(0, 4).map((o) => (
                  <OpportunityCard key={o.id} opportunity={o} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-4">
          {/* Official Source Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Verified Official Source
            </h3>
            <p className="mt-2 text-xs text-zinc-500">
              This opportunity was discovered from the official portal of {data.institution.name}.
            </p>
            {data.confidenceScore && (
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Source Confidence</span>
                <span className="font-semibold text-emerald-600">{Math.round(data.confidenceScore * 100)}%</span>
              </div>
            )}
            {data.officialUrl && (
              <a
                href={data.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                View Source Announcement <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {/* Institution Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{data.institution.name}</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {data.institution.overview?.slice(0, 180) || `${data.institution.name} is a premier research institution.`}…
            </p>
            <Link
              href={`/institutions/${data.institution.slug}`}
              className="mt-3 inline-block text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Explore Institution Profile →
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
      <div className={cn("mt-1 font-semibold text-zinc-800 dark:text-zinc-200", className)}>{value}</div>
    </div>
  );
}
