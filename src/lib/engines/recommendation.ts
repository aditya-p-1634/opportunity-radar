import { differenceInDays, isPast } from "date-fns";
import { parseJsonArray } from "@/lib/utils";
import { computeEligibility, type ProfileInput, type OpportunityInput } from "./eligibility";

export interface RecommendationFactors {
  eligibility: number;
  profileMatch: number;
  research: number;
  skills: number;
  popularity: number;
  funding: number;
  prestige: number;
  deadline: number;
  freshness: number;
}

export interface RecommendationResult {
  score: number;
  factors: RecommendationFactors;
  reasons: string[];
  eligibilityStatus: string;
  eligibilityReasons: string[];
}

export interface OpportunityForRec extends OpportunityInput {
  id: string;
  title: string;
  type: string;
  researchArea?: string | null;
  funding?: string | null;
  deadline?: Date | string | null;
  publishedAt?: Date | string | null;
  popularityScore?: number | null;
  verified?: boolean | null;
  institution?: {
    prestigeScore?: number | null;
    name?: string | null;
    country?: string | null;
  } | null;
}

export interface ProfileForRec extends ProfileInput {
  preferredCountries?: string | null;
  preferredInstitutions?: string | null;
}

const WEIGHTS: RecommendationFactors = {
  eligibility: 0.22,
  profileMatch: 0.12,
  research: 0.18,
  skills: 0.08,
  popularity: 0.08,
  funding: 0.1,
  prestige: 0.1,
  deadline: 0.07,
  freshness: 0.05,
};

function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  return typeof d === "string" ? new Date(d) : d;
}

function fundingScore(funding?: string | null): number {
  switch (funding) {
    case "FULL":
      return 100;
    case "STIPEND":
      return 85;
    case "PARTIAL":
      return 70;
    case "UNPAID":
      return 35;
    case "NONE":
      return 25;
    default:
      return 50;
  }
}

function deadlineScore(deadline?: Date | string | null): number {
  const d = toDate(deadline);
  if (!d) return 55; // rolling
  if (isPast(d)) return 0;
  const days = differenceInDays(d, new Date());
  if (days <= 3) return 95;
  if (days <= 7) return 90;
  if (days <= 14) return 80;
  if (days <= 30) return 70;
  if (days <= 60) return 55;
  return 40;
}

function freshnessScore(publishedAt?: Date | string | null): number {
  const d = toDate(publishedAt);
  if (!d) return 40;
  const days = differenceInDays(new Date(), d);
  if (days <= 3) return 100;
  if (days <= 7) return 90;
  if (days <= 14) return 75;
  if (days <= 30) return 60;
  if (days <= 60) return 40;
  return 25;
}

function researchScore(profile: ProfileForRec | null | undefined, area?: string | null): number {
  if (!area) return 40;
  const interests = parseJsonArray(profile?.researchInterests);
  if (interests.length === 0) return 35;
  const al = area.toLowerCase();
  let best = 0;
  for (const interest of interests) {
    const i = interest.toLowerCase();
    if (al === i || al.includes(i) || i.includes(al)) best = Math.max(best, 100);
    else {
      const tokens = i.split(/\s+/);
      const hits = tokens.filter((t) => t.length > 2 && al.includes(t)).length;
      best = Math.max(best, (hits / tokens.length) * 90);
    }
  }
  return best;
}

function skillsScore(profile: ProfileForRec | null | undefined, opportunity: OpportunityForRec): number {
  const skills = [
    ...parseJsonArray(profile?.skills),
    ...parseJsonArray(profile?.programmingLanguages),
  ].map((s) => s.toLowerCase());
  if (skills.length === 0) return 30;

  const corpus = `${opportunity.title} ${opportunity.researchArea ?? ""} ${opportunity.eligibilityText ?? ""}`.toLowerCase();
  let hits = 0;
  for (const s of skills) {
    if (corpus.includes(s.toLowerCase())) hits++;
  }
  // Having a solid skill set still helps even without keyword hits
  const base = Math.min(60, skills.length * 8);
  return Math.min(100, base + hits * 15);
}

function profileMatchScore(profile: ProfileForRec | null | undefined, opportunity: OpportunityForRec): number {
  if (!profile) return 30;
  let score = 40;

  const countries = parseJsonArray(profile.preferredCountries);
  if (countries.length && opportunity.institution?.country) {
    if (countries.some((c) => c.toLowerCase() === opportunity.institution!.country!.toLowerCase() || c === "Remote")) {
      score += 25;
    }
  }

  const preferredInst = parseJsonArray(profile.preferredInstitutions);
  // preferredInstitutions may store names or ids
  if (preferredInst.length && opportunity.institution?.name) {
    if (preferredInst.some((p) => opportunity.institution!.name!.toLowerCase().includes(p.toLowerCase()))) {
      score += 25;
    }
  }

  // Type affinity heuristics for students
  if (profile.degree === "Bachelors" || profile.degree === "Dual") {
    if (["RESEARCH_INTERNSHIP", "SUMMER_SCHOOL", "HACKATHON", "COMPETITION", "SCHOLARSHIP"].includes(opportunity.type)) {
      score += 10;
    }
  }
  if (profile.degree === "Masters" || profile.degree === "PhD") {
    if (["RESEARCH_INTERNSHIP", "FELLOWSHIP", "SCHOLARSHIP", "JOB"].includes(opportunity.type)) {
      score += 10;
    }
  }

  return Math.min(100, score);
}

/**
 * Multi-factor recommendation score with explainable reasons.
 */
export function computeRecommendation(
  profile: ProfileForRec | null | undefined,
  opportunity: OpportunityForRec
): RecommendationResult {
  const eligibility = computeEligibility(profile, opportunity);

  const factors: RecommendationFactors = {
    eligibility: eligibility.score,
    profileMatch: profileMatchScore(profile, opportunity),
    research: researchScore(profile, opportunity.researchArea),
    skills: skillsScore(profile, opportunity),
    popularity: Math.min(100, (opportunity.popularityScore ?? 0) * 10),
    funding: fundingScore(opportunity.funding),
    prestige: opportunity.institution?.prestigeScore ?? 50,
    deadline: deadlineScore(opportunity.deadline),
    freshness: freshnessScore(opportunity.publishedAt),
  };

  // Hard gate: not eligible heavily penalizes final score
  let weighted =
    factors.eligibility * WEIGHTS.eligibility +
    factors.profileMatch * WEIGHTS.profileMatch +
    factors.research * WEIGHTS.research +
    factors.skills * WEIGHTS.skills +
    factors.popularity * WEIGHTS.popularity +
    factors.funding * WEIGHTS.funding +
    factors.prestige * WEIGHTS.prestige +
    factors.deadline * WEIGHTS.deadline +
    factors.freshness * WEIGHTS.freshness;

  if (eligibility.status === "NOT_ELIGIBLE") {
    weighted *= 0.25;
  } else if (eligibility.status === "POSSIBLY") {
    weighted *= 0.75;
  }

  if (opportunity.verified) {
    weighted = Math.min(100, weighted + 3);
  }

  const score = Math.round(Math.max(0, Math.min(100, weighted)));
  const reasons = buildReasons(factors, eligibility.status, opportunity);

  return {
    score,
    factors,
    reasons,
    eligibilityStatus: eligibility.status,
    eligibilityReasons: eligibility.reasons,
  };
}

function buildReasons(
  factors: RecommendationFactors,
  eligibilityStatus: string,
  opportunity: OpportunityForRec
): string[] {
  const tags: string[] = [];

  if (eligibilityStatus === "ELIGIBLE") tags.push("Eligible");
  else if (eligibilityStatus === "LIKELY") tags.push("Likely Eligible");
  else if (eligibilityStatus === "POSSIBLY") tags.push("Possibly Eligible");

  if (factors.research >= 70) tags.push("Research Interest Match");
  if (factors.skills >= 70) tags.push("Skills Match");
  if (factors.prestige >= 85) tags.push("Top Institution");
  if (factors.funding >= 85) tags.push("Well Funded");
  if (factors.deadline >= 85) tags.push("Deadline Soon");
  if (factors.freshness >= 85) tags.push("Just Posted");
  if (factors.popularity >= 70) tags.push("Trending");
  if (opportunity.verified) tags.push("Verified");
  if (factors.profileMatch >= 70) tags.push("Profile Fit");

  // Ensure at least one tag
  if (tags.length === 0) {
    tags.push(opportunityTypeTag(opportunity.type));
  }

  return tags.slice(0, 5);
}

function opportunityTypeTag(type: string): string {
  const map: Record<string, string> = {
    RESEARCH_INTERNSHIP: "Research Internship",
    SUMMER_SCHOOL: "Summer School",
    SCHOLARSHIP: "Scholarship",
    FELLOWSHIP: "Fellowship",
    HACKATHON: "Hackathon",
    COMPETITION: "Competition",
  };
  return map[type] ?? "Opportunity";
}

export function rankOpportunities(
  profile: ProfileForRec | null | undefined,
  opportunities: OpportunityForRec[]
): Array<OpportunityForRec & { recommendation: RecommendationResult }> {
  return opportunities
    .map((opp) => ({
      ...opp,
      recommendation: computeRecommendation(profile, opp),
    }))
    .sort((a, b) => b.recommendation.score - a.recommendation.score);
}
