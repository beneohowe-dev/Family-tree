import type { Person, WarmthLevel } from "./types";

export interface PeopleFilters {
  motionRole?: string;
  country?: string;
  warmth?: WarmthLevel | "ANY";
  minStrategic?: number;
}

export interface PeopleSearchResult {
  person: Person;
  matchScore: number;
  rationale: string[];
}

export interface SearchGuardrail {
  sensitiveMode: boolean;
  message?: string;
}

const sensitiveResearchTerms = [
  "spinal cord injury",
  "spinal injury",
  "paralysis",
  "paraplegia",
  "tetraplegia",
  "quadriplegia",
  "autism",
  "wheelchair",
  "disabled",
  "disability"
];

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value: string): string[] {
  return normalise(value)
    .split(" ")
    .filter((token) => token.length > 2);
}

function includesAny(haystack: string, needles: string[]): boolean {
  const text = normalise(haystack);
  return needles.some((needle) => text.includes(normalise(needle)));
}

export function searchGuardrail(query: string): SearchGuardrail {
  const sensitiveMode = sensitiveResearchTerms.some((term) => normalise(query).includes(term));
  return sensitiveMode
    ? {
        sensitiveMode,
        message:
          "Sensitive query mode: results show public areas of work and explicit evidence only. Research relevance is not outreach eligibility."
      }
    : { sensitiveMode };
}

export function searchPeople(people: Person[], query: string, filters: PeopleFilters = {}): PeopleSearchResult[] {
  const queryTokens = tokens(query);
  const wantsUk = /\buk\b|united kingdom|britain|british/i.test(query);
  const wantsAustralia = /australia|australian/i.test(query);
  const wantsAmerica = /\bus\b|usa|america|united states/i.test(query);
  const roleHints = [
    "ambassador",
    "athlete",
    "creator",
    "fashion",
    "advisor",
    "adviser",
    "charity",
    "partner",
    "funding",
    "retail",
    "product",
    "foundation",
    "media",
    "spinal",
    "accessibility"
  ];

  return people
    .filter((person) => {
      if (person.id === "ben") return false;
      if (filters.motionRole && filters.motionRole !== "ANY") {
        const roles = [person.primaryMotionRole, ...person.additionalMotionRoles, ...person.foundationRoles];
        if (!roles.some((role) => normalise(role).includes(normalise(filters.motionRole || "")))) return false;
      }

      if (filters.country && filters.country !== "ANY" && normalise(person.country) !== normalise(filters.country)) return false;
      if (filters.warmth && filters.warmth !== "ANY" && person.relationshipWarmth !== filters.warmth) return false;
      if (filters.minStrategic && person.scores.missionRelevance < filters.minStrategic) return false;
      return true;
    })
    .map((person) => {
      const searchBlob = [
        person.fullName,
        person.currentHeadline,
        person.currentRole,
        person.country,
        person.region,
        person.city || "",
        person.primaryMotionRole,
        ...person.additionalMotionRoles,
        ...person.foundationRoles,
        ...person.skills,
        ...person.sectors,
        ...person.communities,
        ...person.contributionTypes,
        ...person.recentChanges
      ].join(" ");

      let matchScore = 0;
      const rationale: string[] = [];

      queryTokens.forEach((token) => {
        if (normalise(searchBlob).includes(token)) matchScore += 6;
      });

      const roles = [person.primaryMotionRole, ...person.additionalMotionRoles, ...person.foundationRoles].join(" ");
      if (includesAny(roles, roleHints.filter((hint) => normalise(query).includes(hint)))) {
        matchScore += 20;
        rationale.push("role fit");
      }

      if (wantsUk && person.country === "United Kingdom") {
        matchScore += 14;
        rationale.push("UK relevance");
      }
      if (wantsAustralia && person.country === "Australia") {
        matchScore += 14;
        rationale.push("Australia relevance");
      }
      if (wantsAmerica && person.country === "United States") {
        matchScore += 14;
        rationale.push("US relevance");
      }

      if (normalise(query).includes("existing network") || normalise(query).includes("already know")) {
        matchScore += person.scores.networkProximity >= 60 ? 16 : 0;
        if (person.scores.networkProximity >= 60) rationale.push("existing network");
      }

      if (normalise(query).includes("credible") && person.scores.communityCredibility > 75) {
        matchScore += 12;
        rationale.push("community credibility");
      }

      if (normalise(query).includes("low commercial saturation") && person.scores.commercialLeverage < 60) {
        matchScore += 12;
        rationale.push("lower commercial saturation");
      }

      if (queryTokens.length === 0) {
        matchScore = person.scores.currentOpportunity;
      }

      if (rationale.length === 0 && matchScore > 0) {
        rationale.push("text match");
      }

      return { person, matchScore, rationale };
    })
    .filter((result) => queryTokens.length === 0 || result.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || b.person.scores.currentOpportunity - a.person.scores.currentOpportunity);
}
