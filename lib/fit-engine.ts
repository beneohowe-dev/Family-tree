import type { NewsItem, Opportunity, Person, RedTeamCheck, Timing, WarmthLevel } from "./types";

export interface WarmthSignals {
  previousConversations?: number;
  inboundMessages?: number;
  outboundMessages?: number;
  repliesFromPerson?: number;
  recommendations?: number;
  workedTogether?: boolean;
  directIntroductions?: number;
  recentEngagement?: number;
  sharedOrganisations?: number;
  firstDegreeLinkedIn?: boolean;
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function warmthToScore(level: WarmthLevel): number {
  const table: Record<WarmthLevel, number> = {
    HOT: 95,
    WARM: 78,
    KNOWN: 60,
    LIGHT: 38,
    CONNECTED: 30,
    COLD: 10,
    UNKNOWN: 0
  };

  return table[level];
}

export function scoreToWarmth(score: number): WarmthLevel {
  if (score >= 86) return "HOT";
  if (score >= 70) return "WARM";
  if (score >= 52) return "KNOWN";
  if (score >= 34) return "LIGHT";
  if (score >= 18) return "CONNECTED";
  if (score > 0) return "COLD";
  return "UNKNOWN";
}

export function calculateRelationshipWarmth(signals: WarmthSignals): { score: number; level: WarmthLevel } {
  const score = clampScore(
    (signals.previousConversations || 0) * 9 +
      (signals.inboundMessages || 0) * 8 +
      (signals.repliesFromPerson || 0) * 10 +
      (signals.recommendations || 0) * 15 +
      (signals.workedTogether ? 28 : 0) +
      (signals.directIntroductions || 0) * 12 +
      (signals.recentEngagement || 0) * 6 +
      (signals.sharedOrganisations || 0) * 5 +
      (signals.firstDegreeLinkedIn ? 10 : 0)
  );

  return {
    score,
    level: scoreToWarmth(score)
  };
}

export function strategicFitScore(person: Person): number {
  const scores = person.scores;
  return clampScore(
    scores.missionRelevance * 0.16 +
      scores.communityCredibility * 0.13 +
      scores.commercialLeverage * 0.1 +
      scores.foundationRelevance * 0.12 +
      scores.motionBrandRelevance * 0.11 +
      scores.productRelevance * 0.11 +
      scores.publicVoice * 0.07 +
      scores.networkProximity * 0.08 +
      scores.approachability * 0.06 +
      scores.currentOpportunity * 0.06
  );
}

export function dailyPriorityScore(person: Person): number {
  if (person.status === "DO_NOT_CONTACT") return -1;

  return clampScore(
    strategicFitScore(person) * 0.42 +
      person.scores.currentOpportunity * 0.2 +
      person.scores.relationshipWarmth * 0.18 +
      person.scores.evidenceConfidence * 0.12 +
      warmthToScore(person.relationshipWarmth) * 0.08
  );
}

export function isOutreachEligible(person: Person): boolean {
  if (person.status === "DO_NOT_CONTACT") return false;
  if (person.suppressionReason) return false;
  if (person.sensitive.requiresReview) return false;
  if (!person.sensitive.allowedForOutreach) return false;
  if (person.redTeam.recommendation === "DO_NOT_APPROACH_YET") return false;
  return true;
}

export function redTeamGate(person: Person): RedTeamCheck {
  const concerns = [...person.redTeam.concerns];

  if (person.status === "DO_NOT_CONTACT" || person.suppressionReason) {
    return {
      recommendation: "DO_NOT_APPROACH_YET",
      concerns: ["Suppression flag is active.", ...concerns],
      mutualValue: person.redTeam.mutualValue,
      doNotApproachReason: person.suppressionReason || "Do not contact status is active."
    };
  }

  if (person.sensitive.requiresReview || !person.sensitive.allowedForOutreach) {
    return {
      recommendation: "DO_NOT_APPROACH_YET",
      concerns: ["Sensitive-data review is required before outreach.", ...concerns],
      mutualValue: person.redTeam.mutualValue,
      doNotApproachReason: "Community research and outreach eligibility are separated."
    };
  }

  if (person.relationshipWarmth === "COLD" || person.relationshipWarmth === "UNKNOWN") {
    return {
      recommendation: "BUILD_RELATIONSHIP_FIRST",
      concerns: ["No warm route is currently recorded.", ...concerns],
      mutualValue: person.redTeam.mutualValue
    };
  }

  return person.redTeam;
}

export function rankPeopleForToday(people: Person[]): Person[] {
  return [...people]
    .filter((person) => person.id !== "ben")
    .sort((a, b) => dailyPriorityScore(b) - dailyPriorityScore(a));
}

export function warmOpportunities(people: Person[]): Person[] {
  return rankPeopleForToday(people).filter((person) => {
    const warmEnough = ["HOT", "WARM", "KNOWN"].includes(person.relationshipWarmth);
    return warmEnough && isOutreachEligible(person);
  });
}

export function digestHighlights(
  people: Person[],
  newsItems: NewsItem[],
  opportunities: Opportunity[]
): {
  highValueChanges: string[];
  newPeople: number;
  warmOpportunities: number;
  foundationItems: number;
  fundingItems: number;
  watchItems: number;
} {
  const ranked = rankPeopleForToday(people).slice(0, 3);
  const highValueChanges = ranked.map((person) => {
    const change = person.recentChanges[0] || "Profile relevance changed";
    return `${person.fullName}: ${change}`;
  });

  return {
    highValueChanges,
    newPeople: people.filter((person) => person.status === "INTERESTING" || person.status === "SHORTLIST").length,
    warmOpportunities: warmOpportunities(people).length,
    foundationItems: opportunities.filter((opportunity) =>
      ["foundation", "funding", "policy"].includes(opportunity.type)
    ).length,
    fundingItems: opportunities.filter((opportunity) => opportunity.type === "funding").length,
    watchItems: newsItems.length
  };
}

export function recommendedTimingLabel(timing: Timing): string {
  const labels: Record<Timing, string> = {
    NOW: "Now",
    SOON: "Soon",
    BUILD_RELATIONSHIP_FIRST: "Build relationship first",
    HOLD: "Hold",
    DO_NOT_APPROACH_YET: "Do not approach yet"
  };

  return labels[timing];
}
