import type { ConfidenceLevel, Person } from "./types";

export interface EntityCandidateInput {
  fullName: string;
  organisation?: string;
  role?: string;
  country?: string;
  city?: string;
  socialUrls?: string[];
  website?: string;
  biography?: string;
}

export interface EntityResolutionResult {
  candidateId: string;
  score: number;
  confidence: ConfidenceLevel;
  evidenceCategories: string[];
  recommendation: "AUTO_MERGE" | "POSSIBLE_DUPLICATE_REVIEW" | "CREATE_NEW";
  explanation: string;
}

function normalise(value: string | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string | undefined): Set<string> {
  return new Set(normalise(value).split(" ").filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

function orgText(person: Person): string {
  return [person.organisationId, ...person.previousOrganisations].filter(Boolean).join(" ");
}

export function scoreEntityMatch(input: EntityCandidateInput, candidate: Person): EntityResolutionResult {
  const evidenceCategories: string[] = [];
  let score = 0;

  const nameSimilarity = jaccard(tokenSet(input.fullName), tokenSet(candidate.fullName));
  if (nameSimilarity > 0.8) {
    score += 40;
    evidenceCategories.push("name");
  } else if (nameSimilarity > 0.45) {
    score += 22;
    evidenceCategories.push("partial_name");
  }

  const inputUrls = new Set((input.socialUrls || []).map(normalise));
  const matchingUrl = candidate.publicAccounts.some((account) => inputUrls.has(normalise(account.accountUrl)));
  if (matchingUrl) {
    score += 35;
    evidenceCategories.push("social_url");
  }

  if (input.organisation && normalise(orgText(candidate)).includes(normalise(input.organisation))) {
    score += 18;
    evidenceCategories.push("organisation");
  }

  if (input.role && normalise(candidate.currentRole + " " + candidate.currentHeadline).includes(normalise(input.role))) {
    score += 10;
    evidenceCategories.push("role");
  }

  if (input.country && normalise(input.country) === normalise(candidate.country)) {
    score += 7;
    evidenceCategories.push("country");
  }

  if (input.city && candidate.city && normalise(input.city) === normalise(candidate.city)) {
    score += 5;
    evidenceCategories.push("city");
  }

  const biographyOverlap = jaccard(tokenSet(input.biography), tokenSet(candidate.skills.join(" ") + " " + candidate.sectors.join(" ")));
  if (biographyOverlap > 0.2) {
    score += 8;
    evidenceCategories.push("biography");
  }

  if (evidenceCategories.length === 1 && evidenceCategories[0] === "name") {
    score = Math.min(score, 38);
  }

  const confidence: ConfidenceLevel = score >= 86 ? "HIGH" : score >= 55 ? "MEDIUM" : "LOW";
  const recommendation =
    score >= 86 && evidenceCategories.length >= 2
      ? "AUTO_MERGE"
      : score >= 55
        ? "POSSIBLE_DUPLICATE_REVIEW"
        : "CREATE_NEW";

  return {
    candidateId: candidate.id,
    score,
    confidence,
    evidenceCategories,
    recommendation,
    explanation:
      recommendation === "AUTO_MERGE"
        ? "Strong match across multiple non-image signals."
        : recommendation === "POSSIBLE_DUPLICATE_REVIEW"
          ? "Possible duplicate. Human review required before merge."
          : "Insufficient evidence to match; create or review as a new entity."
  };
}

export function canRecordSensitiveConnection(args: {
  explicitEvidence: boolean;
  sourceType: "public_self_disclosure" | "public_professional_bio" | "appearance" | "association" | "model_inference";
}): boolean {
  if (!args.explicitEvidence) return false;
  return args.sourceType === "public_self_disclosure" || args.sourceType === "public_professional_bio";
}
