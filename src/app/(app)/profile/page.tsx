"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BRANCHES, RESEARCH_AREAS, COUNTRIES } from "@/lib/utils";

interface ProfileForm {
  name: string;
  university: string;
  degree: string;
  branch: string;
  year: string;
  cgpa: string;
  maxCgpa: string;
  skills: string[];
  programmingLanguages: string[];
  researchInterests: string[];
  preferredCountries: string[];
  preferredInstitutions: string[];
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  bio: string;
  resumeUrl: string;
  completionPercent: number;
  email: string;
}

const empty: ProfileForm = {
  name: "",
  university: "",
  degree: "",
  branch: "",
  year: "",
  cgpa: "",
  maxCgpa: "10",
  skills: [],
  programmingLanguages: [],
  researchInterests: [],
  preferredCountries: [],
  preferredInstitutions: [],
  portfolioUrl: "",
  githubUrl: "",
  linkedinUrl: "",
  bio: "",
  resumeUrl: "",
  completionPercent: 0,
  email: "",
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(empty);
  const [skillInput, setSkillInput] = useState("");
  const [langInput, setLangInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return;
        const p = j.data.profile;
        setForm({
          name: j.data.name || "",
          email: j.data.email || "",
          university: p?.university || "",
          degree: p?.degree || "",
          branch: p?.branch || "",
          year: p?.year?.toString() || "",
          cgpa: p?.cgpa?.toString() || "",
          maxCgpa: p?.maxCgpa?.toString() || "10",
          skills: p?.skills || [],
          programmingLanguages: p?.programmingLanguages || [],
          researchInterests: p?.researchInterests || [],
          preferredCountries: p?.preferredCountries || [],
          preferredInstitutions: p?.preferredInstitutions || [],
          portfolioUrl: p?.portfolioUrl || "",
          githubUrl: p?.githubUrl || "",
          linkedinUrl: p?.linkedinUrl || "",
          bio: p?.bio || "",
          resumeUrl: p?.resumeUrl || "",
          completionPercent: p?.completionPercent || 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          university: form.university || null,
          degree: form.degree || null,
          branch: form.branch || null,
          year: form.year ? Number(form.year) : null,
          cgpa: form.cgpa ? Number(form.cgpa) : null,
          maxCgpa: form.maxCgpa ? Number(form.maxCgpa) : 10,
          skills: form.skills,
          programmingLanguages: form.programmingLanguages,
          researchInterests: form.researchInterests,
          preferredCountries: form.preferredCountries,
          preferredInstitutions: form.preferredInstitutions,
          portfolioUrl: form.portfolioUrl || null,
          githubUrl: form.githubUrl || null,
          linkedinUrl: form.linkedinUrl || null,
          bio: form.bio || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setForm((f) => ({ ...f, completionPercent: j.data.completionPercent }));
      toast.success(`Profile saved · ${j.data.completionPercent}% complete`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadResume(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setForm((f) => ({ ...f, resumeUrl: j.data.url }));
      toast.success("Resume uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function toggle(list: keyof ProfileForm, value: string) {
    setForm((f) => {
      const arr = f[list] as string[];
      return {
        ...f,
        [list]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value],
      };
    });
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-zinc-500">{form.email}</p>
        </div>
        <Badge variant={form.completionPercent >= 80 ? "success" : "warning"}>
          {form.completionPercent}% complete
        </Badge>
      </div>

      <form onSubmit={save} className="space-y-6">
        <Section title="Basics">
          <Field label="Full name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="University">
            <Input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Degree">
              <select
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
              >
                <option value="">Select</option>
                {["Bachelors", "Masters", "PhD", "Dual"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Branch">
              <select
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              >
                <option value="">Select</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Year">
              <Input type="number" min={1} max={10} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </Field>
            <Field label="CGPA">
              <div className="flex gap-2">
                <Input type="number" step="0.01" min={0} max={10} value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} placeholder="e.g. 8.7" />
                <Input type="number" className="w-20" value={form.maxCgpa} onChange={(e) => setForm({ ...form, maxCgpa: e.target.value })} title="Scale" />
              </div>
            </Field>
          </div>
          <Field label="Bio">
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={1000}
            />
          </Field>
        </Section>

        <Section title="Skills">
          <TagInput
            label="Skills"
            value={skillInput}
            onChange={setSkillInput}
            tags={form.skills}
            onAdd={() => {
              if (skillInput.trim()) {
                setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
                setSkillInput("");
              }
            }}
            onRemove={(t) => setForm({ ...form, skills: form.skills.filter((s) => s !== t) })}
          />
          <TagInput
            label="Programming languages"
            value={langInput}
            onChange={setLangInput}
            tags={form.programmingLanguages}
            onAdd={() => {
              if (langInput.trim()) {
                setForm({
                  ...form,
                  programmingLanguages: [...form.programmingLanguages, langInput.trim()],
                });
                setLangInput("");
              }
            }}
            onRemove={(t) =>
              setForm({
                ...form,
                programmingLanguages: form.programmingLanguages.filter((s) => s !== t),
              })
            }
          />
        </Section>

        <Section title="Research interests">
          <div className="flex flex-wrap gap-2">
            {RESEARCH_AREAS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggle("researchInterests", a)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  form.researchInterests.includes(a)
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Preferences">
          <p className="mb-2 text-xs text-zinc-500">Preferred countries</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {COUNTRIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggle("preferredCountries", c)}
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
          <Field label="Preferred institutions (comma-separated names)">
            <Input
              value={form.preferredInstitutions.join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  preferredInstitutions: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="MIT, Stanford, ETH, IISc"
            />
          </Field>
        </Section>

        <Section title="Links & resume">
          <Field label="Portfolio">
            <Input type="url" value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} />
          </Field>
          <Field label="GitHub">
            <Input type="url" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
          </Field>
          <Field label="LinkedIn">
            <Input type="url" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
          </Field>
          <Field label="Resume (PDF/DOC)">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadResume(f);
              }}
            />
            {form.resumeUrl && (
              <a href={form.resumeUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-indigo-600">
                View uploaded resume
              </a>
            )}
          </Field>
        </Section>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function TagInput({
  label,
  value,
  onChange,
  tags,
  onAdd,
  onRemove,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tags: string[];
  onAdd: () => void;
  onRemove: (t: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="Type and press Enter"
        />
        <Button type="button" variant="secondary" onClick={onAdd}>
          Add
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onRemove(t)}
            className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs dark:bg-zinc-800"
          >
            {t} ×
          </button>
        ))}
      </div>
    </div>
  );
}
