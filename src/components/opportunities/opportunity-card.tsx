"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Clock, BadgeCheck, Banknote, Sparkles, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  cn,
  formatDeadline,
  deadlineUrgency,
  opportunityTypeLabel,
  fundingLabel,
  modeLabel,
  truncate,
} from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export interface OpportunityCardData {
  id: string;
  slug: string;
  title: string;
  type: string;
  researchArea?: string | null;
  funding?: string | null;
  location?: string | null;
  country?: string | null;
  mode?: string;
  duration?: string | null;
  deadline?: string | Date | null;
  verified?: boolean;
  officialUrl?: string | null;
  requiredSkills?: string | string[] | null;
  confidenceScore?: number;
  bookmarked?: boolean;
  institution: {
    name: string;
    shortName?: string | null;
    logoUrl?: string | null;
    slug: string;
    country?: string;
  };
}

export function OpportunityCard({
  opportunity,
  onBookmarkChange,
}: {
  opportunity: OpportunityCardData;
  onBookmarkChange?: (id: string, bookmarked: boolean) => void;
}) {
  const [bookmarked, setBookmarked] = useState(!!opportunity.bookmarked);
  const [loading, setLoading] = useState(false);
  const urgency = deadlineUrgency(opportunity.deadline);

  // Parse required skills
  let skills: string[] = [];
  if (Array.isArray(opportunity.requiredSkills)) {
    skills = opportunity.requiredSkills;
  } else if (typeof opportunity.requiredSkills === "string") {
    try {
      skills = JSON.parse(opportunity.requiredSkills);
    } catch {
      skills = [];
    }
  }

  async function toggleBookmark() {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: bookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBookmarked(!bookmarked);
      onBookmarkChange?.(opportunity.id, !bookmarked);
      toast.success(bookmarked ? "Removed from saved" : "Saved opportunity");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed — sign in required");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="group relative flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-300/60 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-500/40">
      {/* Institution & Badges */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <InstitutionAvatar
            name={opportunity.institution.shortName || opportunity.institution.name}
            logoUrl={opportunity.institution.logoUrl}
          />
          <div>
            <Link
              href={`/institutions/${opportunity.institution.slug}`}
              className="text-sm font-medium text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
            >
              {opportunity.institution.name}
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{opportunityTypeLabel(opportunity.type)}</Badge>
              {opportunity.mode && (
                <Badge variant="outline" className="text-[10px]">
                  {modeLabel(opportunity.mode)}
                </Badge>
              )}
              {opportunity.verified && (
                <Badge variant="success" className="gap-1 text-[10px]">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <Link href={`/opportunities/${opportunity.slug}`} className="mb-2">
        <h3 className="text-base font-semibold leading-snug text-zinc-900 transition group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-400">
          {opportunity.title}
        </h3>
      </Link>

      {/* Research Area */}
      {opportunity.researchArea && (
        <p className="mb-3 text-xs text-indigo-600 font-medium dark:text-indigo-400">
          {opportunity.researchArea}
        </p>
      )}

      {/* Required Skills Chips */}
      {skills.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <Code2 className="h-2.5 w-2.5 text-zinc-400" />
              {skill}
            </span>
          ))}
          {skills.length > 4 && (
            <span className="text-[10px] text-zinc-400 self-center">+{skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Key Metadata Grid */}
      <div className="mt-auto grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {truncate(opportunity.location || opportunity.country || modeLabel(opportunity.mode || "ONSITE"), 25)}
        </span>
        <span className="flex items-center gap-1.5">
          <Banknote className="h-3.5 w-3.5 shrink-0" />
          {fundingLabel(opportunity.funding)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {opportunity.duration || "Flexible"}
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 font-medium",
            urgency === "critical" && "text-red-600 dark:text-red-400 font-semibold",
            urgency === "soon" && "text-amber-600 dark:text-amber-400 font-semibold",
            urgency === "closed" && "text-zinc-400 line-through"
          )}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {formatDeadline(opportunity.deadline)}
        </span>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-900">
        <Link
          href={`/opportunities/${opportunity.slug}`}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-indigo-600 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          View details
        </Link>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={loading}
          onClick={toggleBookmark}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
        >
          {bookmarked ? (
            <BookmarkCheck className="h-4 w-4 text-indigo-600" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </Button>
        {opportunity.officialUrl && (
          <a
            href={opportunity.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            aria-label="Official link"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}

export function InstitutionAvatar({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colors = [
    "from-indigo-500 to-violet-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-fuchsia-500 to-purple-600",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-sm",
        dim,
        color
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
