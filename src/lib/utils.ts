import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function parseJsonObject<T extends Record<string, unknown> = Record<string, unknown>>(
  value: string | null | undefined
): T {
  if (!value) return {} as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
}

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function formatDeadline(date: Date | string | null | undefined): string {
  if (!date) return "Rolling / Open";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isPast(d)) return "Closed";
  const days = differenceInDays(d, new Date());
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days} days left`;
  return format(d, "MMM d, yyyy");
}

export function deadlineUrgency(
  date: Date | string | null | undefined
): "closed" | "critical" | "soon" | "normal" | "open" {
  if (!date) return "open";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isPast(d)) return "closed";
  const days = differenceInDays(d, new Date());
  if (days <= 3) return "critical";
  if (days <= 14) return "soon";
  return "normal";
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uniqueSlug(base: string, suffix?: string | number): string {
  const s = slugify(base);
  return suffix ? `${s}-${suffix}` : s;
}

export function computeProfileCompletion(profile: {
  university?: string | null;
  degree?: string | null;
  branch?: string | null;
  year?: number | null;
  cgpa?: number | null;
  skills?: string | null;
  programmingLanguages?: string | null;
  researchInterests?: string | null;
  preferredCountries?: string | null;
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  bio?: string | null;
}): number {
  const checks: boolean[] = [
    !!profile.university,
    !!profile.degree,
    !!profile.branch,
    profile.year != null,
    profile.cgpa != null,
    parseJsonArray(profile.skills).length > 0,
    parseJsonArray(profile.programmingLanguages).length > 0,
    parseJsonArray(profile.researchInterests).length > 0,
    parseJsonArray(profile.preferredCountries).length > 0,
    !!profile.resumeUrl,
    !!profile.portfolioUrl || !!profile.githubUrl || !!profile.linkedinUrl,
    !!profile.bio,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function opportunityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    RESEARCH_INTERNSHIP: "Research Internship",
    SUMMER_SCHOOL: "Summer School",
    SCHOLARSHIP: "Scholarship",
    FELLOWSHIP: "Fellowship",
    HACKATHON: "Hackathon",
    COMPETITION: "Competition",
    CONFERENCE: "Conference",
    JOB: "Job / Full-time",
    OTHER: "Other",
  };
  return map[type] ?? type;
}

export function fundingLabel(funding: string | null | undefined): string {
  if (!funding) return "Not specified";
  const map: Record<string, string> = {
    FULL: "Fully Funded",
    PARTIAL: "Partially Funded",
    STIPEND: "Stipend",
    UNPAID: "Unpaid",
    NONE: "No funding",
  };
  return map[funding] ?? funding;
}

export function eligibilityLabel(status: string): string {
  const map: Record<string, string> = {
    ELIGIBLE: "Eligible",
    LIKELY: "Likely Eligible",
    POSSIBLY: "Possibly Eligible",
    NOT_ELIGIBLE: "Not Eligible",
  };
  return map[status] ?? status;
}

export function modeLabel(mode: string): string {
  const map: Record<string, string> = {
    ONSITE: "On-site",
    REMOTE: "Remote",
    HYBRID: "Hybrid",
  };
  return map[mode] ?? mode;
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1).trimEnd() + "…";
}

export function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export const OPPORTUNITY_TYPES = [
  "RESEARCH_INTERNSHIP",
  "SUMMER_SCHOOL",
  "SCHOLARSHIP",
  "FELLOWSHIP",
  "HACKATHON",
  "COMPETITION",
  "CONFERENCE",
  "JOB",
  "OTHER",
] as const;

export const DEGREE_LEVELS = ["HIGH_SCHOOL", "BACHELORS", "MASTERS", "PHD"] as const;

export const FUNDING_TYPES = ["FULL", "PARTIAL", "STIPEND", "UNPAID", "NONE"] as const;

export const BRANCHES = [
  "Computer Science",
  "Electrical Engineering",
  "Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Physics",
  "Mathematics",
  "Biology",
  "Chemistry",
  "Data Science",
  "AI / ML",
  "Biotechnology",
  "Aerospace",
  "Economics",
  "Design",
  "Other",
] as const;

export const RESEARCH_AREAS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Computer Vision",
  "Natural Language Processing",
  "Robotics",
  "Systems & Networking",
  "Security & Privacy",
  "Human-Computer Interaction",
  "Theory & Algorithms",
  "Quantum Computing",
  "Bioinformatics",
  "Computational Biology",
  "Materials Science",
  "Climate & Sustainability",
  "Neuroscience",
  "Astronomy & Astrophysics",
  "Economics & Finance",
  "Data Science",
  "Software Engineering",
  "Distributed Systems",
  "Hardware & Architecture",
  "Signal Processing",
  "Control Systems",
  "Optics & Photonics",
] as const;

export const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Switzerland",
  "Germany",
  "France",
  "Singapore",
  "Canada",
  "Japan",
  "Australia",
  "Netherlands",
  "Sweden",
  "China",
  "South Korea",
  "Israel",
  "Remote",
] as const;
