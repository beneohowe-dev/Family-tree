import type { NewsItem, Opportunity, Organisation, Person, Relationship, WatchTopic } from "./types";

export const organisations: Organisation[] = [
  {
    id: "motion",
    name: "Motion",
    logoText: "MO",
    website: "",
    sector: "Adaptive activewear",
    organisationType: "fashion_brand",
    country: "United Kingdom",
    region: "London",
    description: "Inclusive activewear and lifestyle brand.",
    purpose: "Build products and representation that make active life more accessible.",
    keyPeople: [],
    associatedPeople: [],
    socialProfiles: [],
    relationshipToMotion: "Core organisation",
    potentialContribution: ["Product", "Community", "Commercial", "Brand"],
    currentPartnerships: [],
    relevantCampaigns: [],
    relevantFundingActivity: [],
    news: [],
    notes: "Anchor entity for the commercial side of the platform."
  },
  {
    id: "motion-foundation",
    name: "Motion Foundation",
    logoText: "MF",
    website: "",
    sector: "Community impact",
    organisationType: "foundation",
    country: "United Kingdom",
    region: "London",
    description: "Community and impact side of the Motion ecosystem.",
    purpose: "Back disabled people, adaptive sport, and practical access to active life.",
    keyPeople: [],
    associatedPeople: [],
    socialProfiles: [],
    relationshipToMotion: "Core foundation",
    potentialContribution: ["Foundation", "Grants", "Community"],
    currentPartnerships: [],
    relevantCampaigns: [],
    relevantFundingActivity: [],
    news: [],
    notes: "Anchor entity for impact and governance intelligence."
  }
];

export const people: Person[] = [];
export const relationships: Relationship[] = [];
export const newsItems: NewsItem[] = [];
export const opportunities: Opportunity[] = [];
export const watchTopics: WatchTopic[] = [];
