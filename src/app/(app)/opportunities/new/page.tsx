"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { OPPORTUNITY_TYPES, opportunityTypeLabel, COUNTRIES, FUNDING_TYPES, fundingLabel } from "@/lib/utils";

const SOURCE_OPTIONS = [
  "Official Website",
  "Email",
  "Twitter/X",
  "LinkedIn",
  "Discord",
  "Professor",
  "Friend",
  "Newsletter",
  "Manual",
  "Other"
];

const DEGREE_OPTIONS = [
  { value: "HIGH_SCHOOL", label: "High School" },
  { value: "BACHELORS", label: "Bachelors" },
  { value: "MASTERS", label: "Masters" },
  { value: "PHD", label: "PhD" }
];

const BRANCH_OPTIONS = [
  "Computer Science",
  "Electrical Engineering",
  "Data Science",
  "AI / ML",
  "Physics",
  "Mathematics",
  "Biotechnology",
  "Aerospace",
  "Mechanical Engineering"
];

interface FormState {
  title: string;
  institutionName: string;
  institutionCountry: string;
  type: string;
  discoveredVia: string;
  url: string;
  description: string;
  minCgpa: string;
  minDegree: string;
  maxDegree: string;
  funding: string;
  fundingAmount: string;
  mode: string;
  duration: string;
  deadline: string;
  deadlineUnknown: boolean;
  branches: string[];
}

const DEFAULT_STATE: FormState = {
  title: "",
  institutionName: "",
  institutionCountry: "India",
  type: "RESEARCH_INTERNSHIP",
  discoveredVia: "Manual",
  url: "",
  description: "",
  minCgpa: "",
  minDegree: "BACHELORS",
  maxDegree: "MASTERS",
  funding: "NONE",
  fundingAmount: "",
  mode: "ONSITE",
  duration: "",
  deadline: "",
  deadlineUnknown: true,
  branches: ["Computer Science"]
};

export default function NewOpportunityPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [scraping, setScraping] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Load Draft from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("opportunity_radar_manual_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm(parsed);
      } catch (err) {
        console.warn("Failed to parse saved draft:", err);
      }
    }
  }, []);

  // 2. Save Draft to LocalStorage on form change
  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("opportunity_radar_manual_draft", JSON.stringify(next));
      return next;
    });
  };

  // 3. Clear/Discard Draft
  const handleDiscard = () => {
    if (confirm("Are you sure you want to discard this draft? All progress will be lost.")) {
      setForm(DEFAULT_STATE);
      localStorage.removeItem("opportunity_radar_manual_draft");
      toast.success("Draft discarded");
    }
  };

  // 4. Scrape Link Details
  const handleScrape = async () => {
    if (!form.url) {
      toast.error("Please enter a URL first");
      return;
    }

    setScraping(true);
    toast.info("Scraping metadata from URL...");

    try {
      const res = await fetch("/api/opportunities/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url }),
      });
      const data = await res.json();

      if (data.success) {
        const info = data.data;

        // Auto-fill fields if they are empty
        setForm((prev) => {
          const next = {
            ...prev,
            title: prev.title.trim() === "" ? info.title : prev.title,
            description: prev.description.trim() === "" ? info.description : prev.description,
            institutionName: prev.institutionName.trim() === "" ? info.institutionName : prev.institutionName,
            institutionCountry: prev.institutionName.trim() === "" && info.institutionCountry ? info.institutionCountry : prev.institutionCountry,
            minCgpa: prev.minCgpa === "" && info.minCgpa !== null ? String(info.minCgpa) : prev.minCgpa,
            minDegree: prev.minDegree === "BACHELORS" && info.minDegree ? info.minDegree : prev.minDegree,
            maxDegree: prev.maxDegree === "MASTERS" && info.maxDegree ? info.maxDegree : prev.maxDegree,
            funding: prev.funding === "NONE" && info.funding ? info.funding : prev.funding,
            mode: prev.mode === "ONSITE" && info.mode ? info.mode : prev.mode,
            branches: prev.branches.length === 1 && prev.branches[0] === "Computer Science" && info.branches?.length ? info.branches : prev.branches,
          };
          localStorage.setItem("opportunity_radar_manual_draft", JSON.stringify(next));
          return next;
        });

        toast.success("Autofilled fields based on URL details!");
      } else {
        toast.error(data.error || "Failed to scrape page. You can still input details manually.");
      }
    } catch {
      toast.error("Could not scrape page details. Please complete manually.");
    } finally {
      setScraping(false);
    }
  };

  // 5. Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.institutionName.trim()) return toast.error("Institution is required");
    if (!form.description.trim()) return toast.error("Description is required");
    if (!form.deadlineUnknown && !form.deadline) return toast.error("Deadline is required when not set to Unknown");

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        minCgpa: form.minCgpa ? Number(form.minCgpa) : null,
        deadline: form.deadlineUnknown ? null : form.deadline,
        url: form.url || null,
      };

      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Opportunity added successfully!");
        localStorage.removeItem("opportunity_radar_manual_draft");
        router.push("/opportunities");
      } else {
        toast.error(data.error || "Failed to save opportunity");
      }
    } catch {
      toast.error("An error occurred during save");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBranch = (b: string) => {
    const next = form.branches.includes(b)
      ? form.branches.filter((x) => x !== b)
      : [...form.branches, b];
    updateForm({ branches: next });
  };

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/opportunities"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Link>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleDiscard}
          className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Discard
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add Opportunity</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Capture high-leverage listings manually to include them in your relevance dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL auto-fill layer */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase text-zinc-400">
            Source Link (Optional Autocomplete)
          </h2>
          <div className="flex gap-2">
            <Input
              id="url-input"
              placeholder="Paste opportunity link (e.g. Twitter, website, portal)"
              value={form.url}
              onChange={(e) => updateForm({ url: e.target.value })}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              disabled={scraping}
              onClick={handleScrape}
              className="gap-1 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
            >
              {scraping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Scrape Details
            </Button>
          </div>
        </div>

        {/* Primary Data Grid */}
        <div className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
          {/* Title */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Summer Research Fellowship in Robotics"
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
              required
            />
          </div>

          {/* Institution */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Institution Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Stanford University or Max Planck"
              value={form.institutionName}
              onChange={(e) => updateForm({ institutionName: e.target.value })}
              required
            />
          </div>

          {/* Country */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Country
            </label>
            <select
              value={form.institutionCountry}
              onChange={(e) => updateForm({ institutionCountry: e.target.value })}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Discovered Via */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Discovered Via <span className="text-red-500">*</span>
            </label>
            <select
              value={form.discoveredVia}
              onChange={(e) => updateForm({ discoveredVia: e.target.value })}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Opportunity Type
            </label>
            <select
              value={form.type}
              onChange={(e) => updateForm({ type: e.target.value })}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {opportunityTypeLabel(t)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Paste copy details, research topic details, stipend allocations..."
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              rows={6}
              className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
              required
            />
          </div>
        </div>

        {/* Requirements, funding, timeline */}
        <div className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
          <h3 className="sm:col-span-2 text-sm font-semibold tracking-wide uppercase text-zinc-400">
            Requirements & Logistics Options
          </h3>

          {/* CGPA */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Minimum CGPA Cut-off (out of 10)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="e.g. 8.0"
              value={form.minCgpa}
              onChange={(e) => updateForm({ minCgpa: e.target.value })}
            />
          </div>

          {/* Mode */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Work Mode
            </label>
            <select
              value={form.mode}
              onChange={(e) => updateForm({ mode: e.target.value })}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="ONSITE">On-site</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>

          {/* Min Degree */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Minimum Degree Required
            </label>
            <select
              value={form.minDegree}
              onChange={(e) => updateForm({ minDegree: e.target.value })}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {DEGREE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max Degree */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Maximum Degree Allowed
            </label>
            <select
              value={form.maxDegree}
              onChange={(e) => updateForm({ maxDegree: e.target.value })}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {DEGREE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Funding */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Funding Status
            </label>
            <select
              value={form.funding}
              onChange={(e) => updateForm({ funding: e.target.value })}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {FUNDING_TYPES.map((f) => (
                <option key={f} value={f}>
                  {fundingLabel(f)}
                </option>
              ))}
            </select>
          </div>

          {/* Funding Amount */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Funding Details / Stipend value
            </label>
            <Input
              placeholder="e.g. $2,500/month stipend"
              value={form.fundingAmount}
              onChange={(e) => updateForm({ fundingAmount: e.target.value })}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Project Duration
            </label>
            <Input
              placeholder="e.g. 8 Weeks or 6 Months"
              value={form.duration}
              onChange={(e) => updateForm({ duration: e.target.value })}
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Deadline
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deadlineUnknown"
                  checked={form.deadlineUnknown}
                  onChange={(e) => updateForm({ deadlineUnknown: e.target.checked })}
                  className="rounded border-zinc-300"
                />
                <label htmlFor="deadlineUnknown" className="text-sm text-zinc-500">
                  Deadline Unknown / Rolling
                </label>
              </div>
              {!form.deadlineUnknown && (
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => updateForm({ deadline: e.target.value })}
                  required={!form.deadlineUnknown}
                />
              )}
            </div>
          </div>

          {/* Preferred Branches */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Target Branches
            </label>
            <div className="grid gap-2 border border-zinc-100 p-4 rounded-xl sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/30">
              {BRANCH_OPTIONS.map((branch) => (
                <label key={branch} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={form.branches.includes(branch)}
                    onChange={() => toggleBranch(branch)}
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {branch}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/opportunities">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              "Add Opportunity"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
