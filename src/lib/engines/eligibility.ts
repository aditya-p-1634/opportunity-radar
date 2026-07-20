import { parseJsonArray } from "@/lib/utils";

export type EligibilityStatus = "ELIGIBLE" | "LIKELY" | "POSSIBLY" | "NOT_ELIGIBLE";

export interface ProfileInput {
  degree?: string | null;
  branch?: string | null;
  year?: number | null;
  cgpa?: number | null;
  maxCgpa?: number | null;
  skills?: string | null;
  programmingLanguages?: string | null;
  researchInterests?: string | null;
  university?: string | null;
}

export interface OpportunityInput {
  minDegree?: string | null;
  maxDegree?: string | null;
  branches?: string | null;
  minCgpa?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  researchArea?: string | null;
  eligibilityText?: string | null;
  type?: string | null;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  score: number;
  reasons: string[];
}

const DEGREE_RANK: Record<string, number> = {
  HIGH_SCHOOL: 0,
  BACHELORS: 1,
  MASTERS: 2,
  PHD: 3,
};

function normalizeDegree(degree?: string | null): number | null {
  if (!degree) return null;
  const d = degree.toUpperCase().replace(/[^A-Z]/g, "");
  if (d.includes("PHD") || d.includes("DOCTOR")) return 3;
  if (d.includes("MASTER") || d.includes("MS") || d.includes("MTECH") || d.includes("MSC")) return 2;
  if (d.includes("BACHELOR") || d.includes("BS") || d.includes("BTECH") || d.includes("BE") || d.includes("BSC"))
    return 1;
  if (d.includes("HIGH") || d.includes("SCHOOL") || d.includes("XII")) return 0;
  // Free-text degrees stored as "Bachelors" etc.
  if (DEGREE_RANK[degree.toUpperCase()] != null) return DEGREE_RANK[degree.toUpperCase()];
  const mapped: Record<string, number> = {
    Bachelors: 1,
    Masters: 2,
    PhD: 3,
    Dual: 1,
  };
  return mapped[degree] ?? 1;
}

function branchMatch(profileBranch: string | null | undefined, oppBranchesJson: string | null): boolean | null {
  const oppBranches = parseJsonArray(oppBranchesJson);
  if (oppBranches.length === 0) return null; // no constraint
  if (!profileBranch) return false;
  const pb = profileBranch.toLowerCase();
  return oppBranches.some((b) => {
    const bl = b.toLowerCase();
    return pb.includes(bl) || bl.includes(pb) || fuzzyBranch(pb, bl);
  });
}

function fuzzyBranch(a: string, b: string): boolean {
  const aliases: Record<string, string[]> = {
    "computer science": ["cs", "cse", "computing", "informatics", "ai / ml", "data science"],
    "electrical engineering": ["ee", "electrical", "ece", "electronics"],
    electronics: ["ece", "eee", "electrical"],
    "mechanical engineering": ["me", "mechanical"],
    "data science": ["cs", "computer science", "ai / ml", "statistics"],
    "ai / ml": ["computer science", "cs", "data science", "machine learning"],
  };
  for (const [key, vals] of Object.entries(aliases)) {
    if ((a.includes(key) || vals.some((v) => a.includes(v))) && (b.includes(key) || vals.some((v) => b.includes(v)))) {
      return true;
    }
  }
  return false;
}

function researchOverlap(profileInterests: string[], researchArea?: string | null): number {
  if (!researchArea) return 0.5;
  const area = researchArea.toLowerCase();
  if (profileInterests.length === 0) return 0.4;
  let hits = 0;
  for (const interest of profileInterests) {
    const i = interest.toLowerCase();
    if (area.includes(i) || i.includes(area) || tokenOverlap(i, area) >= 0.4) hits++;
  }
  return Math.min(1, hits / Math.max(1, Math.min(profileInterests.length, 3)));
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(/\s+/).filter((t) => t.length > 2));
  const tb = new Set(b.split(/\s+/).filter((t) => t.length > 2));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

/**
 * Determines eligibility of a student profile against an opportunity.
 * Returns status, numeric score (0-100), and human-readable reasons.
 */
export function computeEligibility(
  profile: ProfileInput | null | undefined,
  opportunity: OpportunityInput
): EligibilityResult {
  if (!profile) {
    return {
      status: "POSSIBLY",
      score: 40,
      reasons: ["Complete your profile for accurate eligibility"],
    };
  }

  const reasons: string[] = [];
  let score = 50;
  let hardFail = false;
  let softFails = 0;

  // Degree check
  const profileDegree = normalizeDegree(profile.degree);
  const minDegree = opportunity.minDegree
    ? DEGREE_RANK[opportunity.minDegree] ?? normalizeDegree(opportunity.minDegree)
    : null;
  const maxDegree = opportunity.maxDegree
    ? DEGREE_RANK[opportunity.maxDegree] ?? normalizeDegree(opportunity.maxDegree)
    : null;

  if (profileDegree != null && minDegree != null) {
    if (profileDegree < minDegree) {
      hardFail = true;
      reasons.push(`Requires minimum ${opportunity.minDegree?.replace(/_/g, " ").toLowerCase()} degree`);
    } else {
      score += 15;
      reasons.push("Degree requirement met");
    }
  } else if (profileDegree == null && minDegree != null) {
    softFails++;
    reasons.push("Degree not specified in profile");
  }

  if (profileDegree != null && maxDegree != null && profileDegree > maxDegree) {
    hardFail = true;
    reasons.push(`Open only up to ${opportunity.maxDegree?.replace(/_/g, " ").toLowerCase()} level`);
  }

  // Year check
  if (profile.year != null) {
    if (opportunity.minYear != null && profile.year < opportunity.minYear) {
      softFails++;
      reasons.push(`Typically for year ${opportunity.minYear}+`);
      score -= 10;
    } else if (opportunity.maxYear != null && profile.year > opportunity.maxYear) {
      softFails++;
      reasons.push(`Typically for year ≤ ${opportunity.maxYear}`);
      score -= 10;
    } else if (opportunity.minYear != null || opportunity.maxYear != null) {
      score += 10;
      reasons.push("Year of study matches");
    }
  }

  // CGPA check (normalize to 10-point scale)
  if (profile.cgpa != null && opportunity.minCgpa != null) {
    const max = profile.maxCgpa && profile.maxCgpa > 0 ? profile.maxCgpa : 10;
    const normalized = (profile.cgpa / max) * 10;
    if (normalized + 0.01 < opportunity.minCgpa) {
      hardFail = true;
      reasons.push(`Minimum CGPA ${opportunity.minCgpa}/10 required (yours ≈ ${normalized.toFixed(2)})`);
    } else {
      score += 15;
      reasons.push(`CGPA meets requirement (≥ ${opportunity.minCgpa})`);
      if (normalized >= opportunity.minCgpa + 1) {
        score += 5;
        reasons.push("Strong academic standing");
      }
    }
  } else if (opportunity.minCgpa != null && profile.cgpa == null) {
    softFails++;
    reasons.push("CGPA not provided — cannot verify academic cut-off");
  }

  // Branch check
  const bm = branchMatch(profile.branch, opportunity.branches ?? null);
  if (bm === true) {
    score += 15;
    reasons.push("Branch / major matches");
  } else if (bm === false) {
    softFails++;
    score -= 15;
    reasons.push("Branch may not match preferred majors");
  }

  // Research interest overlap
  const interests = parseJsonArray(profile.researchInterests);
  const overlap = researchOverlap(interests, opportunity.researchArea);
  if (overlap >= 0.6) {
    score += 15;
    reasons.push("Research interests align");
  } else if (overlap >= 0.3) {
    score += 5;
    reasons.push("Partial research interest overlap");
  } else if (opportunity.researchArea && interests.length > 0) {
    softFails++;
    score -= 5;
    reasons.push("Limited research area overlap");
  }

  // Skills / languages soft boost
  const skills = [
    ...parseJsonArray(profile.skills),
    ...parseJsonArray(profile.programmingLanguages),
  ].map((s) => s.toLowerCase());
  if (skills.length >= 3) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  let status: EligibilityStatus;
  if (hardFail) {
    status = "NOT_ELIGIBLE";
    score = Math.min(score, 25);
  } else if (softFails >= 3 || score < 40) {
    status = "POSSIBLY";
  } else if (softFails >= 1 || score < 65) {
    status = "LIKELY";
  } else {
    status = "ELIGIBLE";
  }

  if (reasons.length === 0) {
    reasons.push("No hard constraints detected — review official eligibility");
  }

  return { status, score: Math.round(score), reasons: reasons.slice(0, 6) };
}
