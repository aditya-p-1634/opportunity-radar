"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  OpportunityCard,
  type OpportunityCardData,
} from "@/components/opportunities/opportunity-card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Clock,
  Bookmark,
  Send,
  Bell,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

interface DashboardData {
  user: { name: string | null; email: string; profileCompletion: number };
  stats: {
    recommended: number;
    closingSoon: number;
    saved: number;
    applied: number;
    unreadNotifications: number;
  };
  recommended: OpportunityCardData[];
  closingSoon: OpportunityCardData[];
  latest: OpportunityCardData[];
  researchInternships: OpportunityCardData[];
  summerSchools: OpportunityCardData[];
  scholarships: OpportunityCardData[];
  fellowships: OpportunityCardData[];
  hackathons: OpportunityCardData[];
  competitions: OpportunityCardData[];
  international: OpportunityCardData[];
  insights: string[];
  notifications: {
    id: string;
    type: string;
    title: string;
    body: string;
    link: string | null;
    read: boolean;
    createdAt: string;
  }[];
}

function Section({
  title,
  href,
  children,
  icon: Icon,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          {Icon && <Icon className="h-5 w-5 text-indigo-600" />}
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Grid({ items }: { items: OpportunityCardData[] }) {
  if (!items?.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
        No opportunities in this section yet.
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.slice(0, 6).map((o) => (
        <OpportunityCard key={o.id} opportunity={o} />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed to load");
        setData(j.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        {error || "Failed to load dashboard"}
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting}
          {data.user.name ? `, ${data.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-zinc-500">
          Here are the best opportunities you should apply for today.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Recommended", value: data.stats.recommended, icon: Sparkles, href: "/opportunities?sort=match" },
          { label: "Closing soon", value: data.stats.closingSoon, icon: Clock, href: "/opportunities?deadline=month" },
          { label: "Saved", value: data.stats.saved, icon: Bookmark, href: "/saved" },
          { label: "Applied", value: data.stats.applied, icon: Send, href: "/applied" },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-500/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{s.label}</span>
              <s.icon className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</div>
          </Link>
        ))}
      </div>

      {/* Profile completion + insights */}
      <div className="mb-10 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Profile strength</h3>
            <Badge variant={data.user.profileCompletion >= 80 ? "success" : "warning"}>
              {data.user.profileCompletion}%
            </Badge>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${data.user.profileCompletion}%` }}
            />
          </div>
          <Link href="/profile" className="mt-3 inline-block text-xs text-indigo-600 hover:underline">
            Complete profile →
          </Link>
          {data.stats.unreadNotifications > 0 && (
            <Link
              href="/notifications"
              className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
            >
              <Bell className="h-3.5 w-3.5" />
              {data.stats.unreadNotifications} unread notification
              {data.stats.unreadNotifications > 1 ? "s" : ""}
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            AI Insights
          </h3>
          <ul className="space-y-2">
            {data.insights.map((insight, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Section title="Recommended for you" href="/opportunities?sort=match" icon={Sparkles}>
        <Grid items={data.recommended} />
      </Section>

      <Section title="Closing soon" href="/opportunities?deadline=month&sort=deadline" icon={Clock}>
        <Grid items={data.closingSoon} />
      </Section>

      <Section title="Latest opportunities" href="/opportunities?sort=newest">
        <Grid items={data.latest} />
      </Section>

      <Section title="Research internships" href="/opportunities?type=RESEARCH_INTERNSHIP">
        <Grid items={data.researchInternships} />
      </Section>

      <Section title="Summer schools" href="/opportunities?type=SUMMER_SCHOOL">
        <Grid items={data.summerSchools} />
      </Section>

      <Section title="Scholarships" href="/opportunities?type=SCHOLARSHIP">
        <Grid items={data.scholarships} />
      </Section>

      <Section title="Fellowships" href="/opportunities?type=FELLOWSHIP">
        <Grid items={data.fellowships} />
      </Section>

      <Section title="Hackathons & competitions" href="/opportunities?type=HACKATHON">
        <Grid items={[...data.hackathons, ...data.competitions]} />
      </Section>

      <Section title="International opportunities" href="/search?country=United%20States">
        <Grid items={data.international} />
      </Section>
    </div>
  );
}
