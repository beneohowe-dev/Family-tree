import assert from "node:assert/strict";
import test from "node:test";
import { canRecordSensitiveConnection, scoreEntityMatch } from "../lib/entity-resolution";
import {
  calculateRelationshipWarmth,
  dailyPriorityScore,
  isOutreachEligible,
  redTeamGate,
  warmOpportunities
} from "../lib/fit-engine";
import { buildLinkedInImportCandidates, parseLinkedInConnections } from "../lib/linkedin-import";
import { describeRelationshipPath, shortestRelationshipPath, type EntityRef } from "../lib/relationship-engine";
import { searchGuardrail, searchPeople } from "../lib/search";
import type { Organisation, OutreachPlan, Person, RedTeamCheck, Relationship, ScoreVector, SensitiveStatus } from "../lib/types";

const organisations: Organisation[] = [
  {
    id: "motion",
    name: "Motion",
    logoText: "MO",
    website: "https://fixture.test/motion",
    sector: "Adaptive activewear",
    organisationType: "fashion_brand",
    country: "United Kingdom",
    region: "London",
    description: "Test organisation.",
    purpose: "Test purpose.",
    keyPeople: [],
    associatedPeople: [],
    socialProfiles: [],
    relationshipToMotion: "Core organisation",
    potentialContribution: [],
    currentPartnerships: [],
    relevantCampaigns: [],
    relevantFundingActivity: [],
    news: [],
    notes: ""
  }
];

const people: Person[] = [
  fixturePerson({
    id: "ben",
    fullName: "Ben Howe",
    currentHeadline: "Founder",
    primaryMotionRole: "Founder / Leadership",
    relationshipWarmth: "HOT",
    status: "ACTIVE_RELATIONSHIP",
    scores: { relationshipWarmth: 100, networkProximity: 100, currentOpportunity: 90, publicVoice: 50 }
  }),
  fixturePerson({
    id: "athlete-example",
    fullName: "Athlete Example",
    currentHeadline: "Athlete mentor with public spinal cord injury charity work",
    currentRole: "Athlete mentor",
    organisationId: "northstar-sci-trust",
    primaryMotionRole: "Athlete Ambassador",
    additionalMotionRoles: ["Product Tester", "Community Voice"],
    foundationRoles: ["Foundation Advocate"],
    skills: ["adaptive sport", "product feedback"],
    communities: ["spinal injury support"],
    relationshipWarmth: "WARM",
    status: "SHORTLIST",
    sensitive: {
      sensitiveDataStatus: "EXPLICIT_PUBLIC_EVIDENCE",
      sourceType: "public_self_disclosure",
      explicitSelfDisclosure: true,
      evidenceUrl: "https://fixture.test/evidence/athlete-example",
      evidenceDate: "2026-07-29",
      allowedForResearch: true,
      allowedForOutreach: false,
      requiresReview: true
    },
    publicAccounts: [
      {
        platform: "LinkedIn",
        accountUrl: "https://fixture.test/linkedin/athlete-example",
        username: "athlete-example",
        accountType: "person",
        verifiedVisible: null,
        dateLastChecked: "2026-08-11",
        matchingConfidence: "HIGH",
        evidence: "Cross-linked from public profile."
      }
    ],
    scores: {
      missionRelevance: 94,
      communityCredibility: 92,
      productRelevance: 90,
      relationshipWarmth: 76,
      networkProximity: 82,
      currentOpportunity: 88
    }
  }),
  fixturePerson({
    id: "warm-connector",
    fullName: "Warm Connector",
    currentHeadline: "Trusted introducer",
    primaryMotionRole: "Warm Introducer",
    relationshipWarmth: "HOT",
    status: "ACTIVE_RELATIONSHIP",
    scores: {
      missionRelevance: 82,
      communityCredibility: 74,
      commercialLeverage: 80,
      relationshipWarmth: 94,
      networkProximity: 96,
      currentOpportunity: 86,
      publicVoice: 36
    }
  }),
  fixturePerson({
    id: "retail-contact",
    fullName: "Retail Contact",
    currentHeadline: "Retail partnerships director",
    primaryMotionRole: "Retail Partner",
    relationshipWarmth: "CONNECTED",
    status: "INTERESTING"
  }),
  fixturePerson({
    id: "charity-lead",
    fullName: "Charity Lead",
    currentHeadline: "Charity lead working on spinal cord injury support",
    primaryMotionRole: "Charity Partner",
    foundationRoles: ["Potential Foundation Partner"],
    communities: ["spinal cord injury", "rehabilitation"],
    relationshipWarmth: "LIGHT",
    status: "SHORTLIST"
  }),
  fixturePerson({
    id: "suppressed-creator",
    fullName: "Suppressed Creator",
    currentHeadline: "High-public-voice creator",
    primaryMotionRole: "Creator",
    relationshipWarmth: "COLD",
    status: "DO_NOT_CONTACT",
    suppressionReason: "Suppressed in test fixture.",
    sensitive: {
      sensitiveDataStatus: "REQUIRES_REVIEW",
      sourceType: "manual_review",
      explicitSelfDisclosure: false,
      evidenceUrl: "https://fixture.test/evidence/suppressed",
      evidenceDate: "2026-07-12",
      allowedForResearch: true,
      allowedForOutreach: false,
      requiresReview: true
    },
    scores: {
      missionRelevance: 82,
      communityCredibility: 78,
      commercialLeverage: 72,
      publicVoice: 92,
      relationshipWarmth: 10,
      networkProximity: 18,
      currentOpportunity: 60
    }
  })
];

const relationships: Relationship[] = [
  {
    id: "rel-ben-warm",
    fromKind: "person",
    fromId: "ben",
    toKind: "person",
    toId: "warm-connector",
    type: "worked together",
    source: "manual note",
    confidence: "HIGH",
    date: "2026-08-11",
    lastVerified: "2026-08-11",
    notes: ""
  },
  {
    id: "rel-warm-retail",
    fromKind: "person",
    fromId: "warm-connector",
    toKind: "person",
    toId: "retail-contact",
    type: "former colleague",
    source: "manual note",
    confidence: "HIGH",
    date: "2026-08-11",
    lastVerified: "2026-08-11",
    notes: ""
  }
];

type PersonFixtureOverrides = Omit<Partial<Person>, "scores" | "sensitive" | "redTeam" | "outreach"> & {
  scores?: Partial<ScoreVector>;
  sensitive?: Partial<SensitiveStatus>;
  redTeam?: Partial<RedTeamCheck>;
  outreach?: Partial<OutreachPlan>;
};

function fixturePerson(overrides: PersonFixtureOverrides): Person {
  const base: Person = {
    id: "fixture",
    fullName: "Fixture Person",
    preferredName: "Fixture",
    currentHeadline: "Fixture headline",
    currentRole: "Fixture role",
    organisationId: undefined,
    previousOrganisations: [],
    previousRoles: [],
    country: "United Kingdom",
    region: "London",
    city: "London",
    languages: ["English"],
    primaryMotionRole: "Community Voice",
    additionalMotionRoles: [],
    foundationRoles: [],
    skills: [],
    sectors: [],
    communities: [],
    contributionTypes: [],
    geographicUsefulness: ["United Kingdom"],
    estimatedStrategicValue: "MEDIUM",
    relationshipWarmth: "UNKNOWN",
    approachability: "MEDIUM",
    currentRelevance: "MEDIUM",
    evidenceConfidence: "MEDIUM",
    scores: {
      missionRelevance: 70,
      communityCredibility: 65,
      commercialLeverage: 45,
      foundationRelevance: 60,
      motionBrandRelevance: 60,
      productRelevance: 50,
      publicVoice: 45,
      networkProximity: 40,
      relationshipWarmth: 30,
      approachability: 60,
      currentOpportunity: 55,
      evidenceConfidence: 70,
      riskSensitivity: "LOW"
    },
    sensitive: {
      sensitiveDataStatus: "NONE_RECORDED",
      sourceType: "none",
      explicitSelfDisclosure: false,
      allowedForResearch: true,
      allowedForOutreach: true,
      requiresReview: false
    },
    publicAccounts: [],
    evidence: [],
    recentChanges: [],
    status: "INTERESTING",
    recommendedMotionRole: "Community Voice",
    recommendedFoundationRole: "Foundation Advocate",
    redTeam: {
      recommendation: "SOON",
      concerns: [],
      mutualValue: "Fixture mutual value."
    },
    outreach: {
      whyThem: "Fixture person.",
      bestRelationshipType: "adviser",
      bestRoute: "manual",
      warmestIntroductionPath: ["Ben"],
      openingAngle: "Ask for advice first.",
      motionCanOffer: "Clear mutual benefit.",
      whatNotToSay: "Do not overpitch.",
      timing: "SOON",
      requiresHumanApproval: true
    }
  };

  return {
    ...base,
    ...overrides,
    scores: {
      ...base.scores,
      ...overrides.scores
    },
    sensitive: {
      ...base.sensitive,
      ...overrides.sensitive
    },
    redTeam: {
      ...base.redTeam,
      ...overrides.redTeam
    },
    outreach: {
      ...base.outreach,
      ...overrides.outreach
    }
  };
}

test("name-only entity matching cannot auto-merge people", () => {
  const athlete = people.find((person) => person.id === "athlete-example");
  assert.ok(athlete);

  const result = scoreEntityMatch({ fullName: "Athlete Example" }, athlete);
  assert.notEqual(result.recommendation, "AUTO_MERGE");
  assert.equal(result.score, 38);
});

test("multi-signal entity matching can auto-merge reviewed candidates", () => {
  const athlete = people.find((person) => person.id === "athlete-example");
  assert.ok(athlete);

  const result = scoreEntityMatch(
    {
      fullName: "Athlete Example",
      organisation: "northstar-sci-trust",
      socialUrls: ["https://fixture.test/linkedin/athlete-example"]
    },
    athlete
  );

  assert.equal(result.recommendation, "AUTO_MERGE");
  assert.ok(result.evidenceCategories.includes("social_url"));
});

test("sensitive information is not recordable from appearance or association", () => {
  assert.equal(canRecordSensitiveConnection({ explicitEvidence: true, sourceType: "appearance" }), false);
  assert.equal(canRecordSensitiveConnection({ explicitEvidence: true, sourceType: "association" }), false);
  assert.equal(canRecordSensitiveConnection({ explicitEvidence: true, sourceType: "public_self_disclosure" }), true);
});

test("suppression and review status block outreach", () => {
  const suppressed = people.find((person) => person.id === "suppressed-creator");
  const athlete = people.find((person) => person.id === "athlete-example");
  assert.ok(suppressed);
  assert.ok(athlete);

  assert.equal(isOutreachEligible(suppressed), false);
  assert.equal(redTeamGate(suppressed).recommendation, "DO_NOT_APPROACH_YET");
  assert.equal(isOutreachEligible(athlete), false);
});

test("first-degree LinkedIn alone does not create a warm relationship", () => {
  const result = calculateRelationshipWarmth({
    firstDegreeLinkedIn: true,
    outboundMessages: 2
  });

  assert.equal(result.level, "COLD");
});

test("warm trusted relationships outrank suppressed high-public-voice prospects", () => {
  const connector = people.find((person) => person.id === "warm-connector");
  const suppressed = people.find((person) => person.id === "suppressed-creator");
  assert.ok(connector);
  assert.ok(suppressed);

  assert.ok(dailyPriorityScore(connector) > dailyPriorityScore(suppressed));
  assert.equal(warmOpportunities(people).some((person) => person.id === "suppressed-creator"), false);
});

test("relationship graph returns a warm introduction path", () => {
  const path = shortestRelationshipPath("person:ben", "person:retail-contact" as EntityRef, relationships);
  const labels = describeRelationshipPath(path, relationships, people, organisations);

  assert.deepEqual(labels, ["Ben Howe", "worked together: Warm Connector", "former colleague: Retail Contact"]);
});

test("sensitive search mode warns that research is not outreach eligibility", () => {
  const guardrail = searchGuardrail("Find people connected to spinal cord injury charities");
  const results = searchPeople(people, "Find people connected to spinal cord injury charities", {});

  assert.equal(guardrail.sensitiveMode, true);
  assert.ok(guardrail.message?.includes("outreach eligibility"));
  assert.ok(results.some((result) => result.person.id === "charity-lead"));
});

test("LinkedIn connections parser handles the export preamble and quoted commas", () => {
  const csv = [
    "Notes from LinkedIn export",
    "Created for account holder",
    "",
    "First Name,Last Name,URL,Email Address,Company,Position,Connected On",
    "Avery,Example,https://fixture.test/avery,,Inclusive Strategy Studio,\"CEO | Keynote Speaker | Disability Advocate | Accessibility Strategist | Podcast Host\",15 Jan 2026",
    "Chris,Moore,https://fixture.test/chris,,\"Move-ment Company Ltd, Japan\",Founder,14 Apr 2026"
  ].join("\n");

  const connections = parseLinkedInConnections(csv);

  assert.equal(connections.length, 2);
  assert.equal(connections[0].fullName, "Avery Example");
  assert.equal(connections[1].company, "Move-ment Company Ltd, Japan");
});

test("LinkedIn import defaults to likely Motion and Foundation matches", () => {
  const csv = [
    "First Name,Last Name,URL,Email Address,Company,Position,Connected On",
    "Avery,Example,https://fixture.test/avery,,Inclusive Strategy Studio,\"CEO | Keynote Speaker | Disability Advocate | Accessibility Strategist | Podcast Host\",15 Jan 2026",
    "Chris,Moore,https://fixture.test/chris,,General Company,Founder,14 Apr 2026"
  ].join("\n");

  const result = buildLinkedInImportCandidates(csv, "likely");

  assert.equal(result.totalRows, 2);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.skippedLowFit, 1);
  assert.equal(result.candidates[0].fullName, "Avery Example");
  assert.equal(result.candidates[0].timing, "Soon");
  assert.ok(result.candidates[0].matchedSignals.includes("Foundation or community relevance"));
});
