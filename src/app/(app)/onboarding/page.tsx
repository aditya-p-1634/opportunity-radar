"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRANCHES, RESEARCH_AREAS, COUNTRIES } from "@/lib/utils";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    university: "",
    degree: "Bachelors",
    branch: "Computer Science",
    year: "3",
    cgpa: "",
    researchInterests: [] as string[],
    preferredCountries: ["India"] as string[],
    skills: "",
  });

  function toggleInterest(a: string) {
    setForm((f) => ({
      ...f,
      researchInterests: f.researchInterests.includes(a)
        ? f.researchInterests.filter((x) => x !== a)
        : [...f.researchInterests, a],
    }));
  }

  function toggleCountry(c: string) {
    setForm((f) => ({
      ...f,
      preferredCountries: f.preferredCountries.includes(c)
        ? f.preferredCountries.filter((x) => x !== c)
        : [...f.preferredCountries, c],
    }));
  }

  async function finish() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          university: form.university,
          degree: form.degree,
          branch: form.branch,
          year: Number(form.year),
          cgpa: form.cgpa ? Number(form.cgpa) : null,
          researchInterests: form.researchInterests,
          preferredCountries: form.preferredCountries,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          programmingLanguages: [],
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success("Profile ready — loading your recommendations");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    <div key="1" className="space-y-4">
      <h2 className="text-xl font-semibold">Where do you study?</h2>
      <Input
        placeholder="University name"
        value={form.university}
        onChange={(e) => setForm({ ...form, university: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={form.degree}
          onChange={(e) => setForm({ ...form, degree: e.target.value })}
        >
          {["Bachelors", "Masters", "PhD", "Dual"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
        >
          {BRANCHES.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="Year"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
        />
        <Input
          type="number"
          step="0.01"
          placeholder="CGPA"
          value={form.cgpa}
          onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
        />
      </div>
    </div>,
    <div key="2" className="space-y-4">
      <h2 className="text-xl font-semibold">Research interests</h2>
      <p className="text-sm text-zinc-500">Select all that apply — this powers your match scores.</p>
      <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto">
        {RESEARCH_AREAS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => toggleInterest(a)}
            className={`rounded-full border px-3 py-1 text-xs ${
              form.researchInterests.includes(a)
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>,
    <div key="3" className="space-y-4">
      <h2 className="text-xl font-semibold">Where do you want to go?</h2>
      <div className="flex flex-wrap gap-2">
        {COUNTRIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggleCountry(c)}
            className={`rounded-full border px-3 py-1 text-xs ${
              form.preferredCountries.includes(c)
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <Input
        placeholder="Skills (comma-separated)"
        value={form.skills}
        onChange={(e) => setForm({ ...form, skills: e.target.value })}
      />
    </div>,
  ];

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="mb-6">
        <div className="mb-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"}`}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-500">Step {step + 1} of 3</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        {steps[step]}
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={loading}>
              {loading ? "Saving..." : "Go to dashboard"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
