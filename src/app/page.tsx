import Link from "next/link";
import {
  Radar,
  Sparkles,
  ShieldCheck,
  Bell,
  Search,
  GraduationCap,
  Globe2,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";

const features = [
  {
    icon: Sparkles,
    title: "AI recommendations",
    description:
      "Ranked matches using eligibility, research interests, skills, prestige, funding, and deadlines — with clear explanations.",
  },
  {
    icon: ShieldCheck,
    title: "Eligibility engine",
    description:
      "Automatically know if you're Eligible, Likely, Possibly, or Not Eligible — before you waste time applying.",
  },
  {
    icon: Globe2,
    title: "Global coverage",
    description:
      "IITs, IIITs, IISc, MIT, Stanford, ETH, DeepMind, Google Research, ISRO, Max Planck, and 50+ more institutions.",
  },
  {
    icon: Bell,
    title: "Deadline intelligence",
    description:
      "In-app and email reminders for saved opportunities, new high matches, and closing windows.",
  },
  {
    icon: Search,
    title: "Precision search",
    description:
      "Instant search with advanced filters across type, country, funding, research area, degree, and more.",
  },
  {
    icon: Zap,
    title: "Always fresh",
    description:
      "Continuous crawlers normalize, deduplicate, and verify opportunities so your feed stays current.",
  },
];

const steps = [
  { step: "01", title: "Create your profile", body: "University, degree, CGPA, skills, research interests — once." },
  { step: "02", title: "We discover & rank", body: "Radar continuously finds opportunities and scores them for you." },
  { step: "03", title: "Apply with confidence", body: "See match reasons, eligibility, and deadlines. Never miss out." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 glow" />
        <div className="pointer-events-none absolute inset-0 hero-grid" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Radar className="h-3.5 w-3.5" />
              AI-powered Opportunity Intelligence
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-white">
              Never miss a research{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                opportunity
              </span>{" "}
              again
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Opportunity Radar discovers internships, scholarships, fellowships, and summer schools
              from the world&apos;s top institutions — then ranks what you should apply for{" "}
              <strong className="font-medium text-zinc-900 dark:text-zinc-200">today</strong>.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-base font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/opportunities"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 text-base font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                Explore opportunities
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Demo: demo@opportunityradar.app · Password123!
            </p>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Institutions", value: "50+" },
              { label: "Opportunities", value: "500+" },
              { label: "Countries", value: "15+" },
              { label: "Match accuracy", value: "Personalized" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 text-center backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70"
              >
                <div className="text-2xl font-semibold text-zinc-900 dark:text-white">{s.value}</div>
                <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-zinc-200 py-24 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Built for ambitious students
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Everything you need to find, evaluate, and act on opportunities — without the noise.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-indigo-300/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-500/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-zinc-200 bg-zinc-50 py-24 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Three steps. Continuous discovery forever after.
            </p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-sm font-mono font-medium text-indigo-600 dark:text-indigo-400">
                  {s.step}
                </div>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-zinc-200 py-24 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Every opportunity type</h2>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {[
              "Research Internships",
              "Summer Schools",
              "Scholarships",
              "Fellowships",
              "Hackathons",
              "Competitions",
              "Conferences",
              "Research Jobs",
            ].map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 py-24 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <GraduationCap className="mx-auto h-10 w-10 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-semibold tracking-tight">
            What should you apply for today?
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Join Opportunity Radar and get a personalized answer in minutes.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-600 px-8 text-base font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
          >
            Create free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-10 dark:border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300">
            <Radar className="h-4 w-4 text-indigo-600" />
            Opportunity Radar
          </div>
          <p>© {new Date().getFullYear()} Opportunity Radar. Built for students worldwide.</p>
        </div>
      </footer>
    </div>
  );
}
