export type EntityKind = "person" | "organisation" | "topic" | "campaign" | "event";

export type WarmthLevel =
  | "HOT"
  | "WARM"
  | "KNOWN"
  | "LIGHT"
  | "CONNECTED"
  | "COLD"
  | "UNKNOWN";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type Timing =
  | "NOW"
  | "SOON"
  | "BUILD_RELATIONSHIP_FIRST"
  | "HOLD"
  | "DO_NOT_APPROACH_YET";

export type HumanDecision =
  | "SHORTLIST"
  | "INTERESTING"
  | "NOT_RELEVANT"
  | "WRONG_ROLE"
  | "HOLD"
  | "APPROACH"
  | "CONTACTED"
  | "ACTIVE_RELATIONSHIP"
  | "PARTNER"
  | "AMBASSADOR"
  | "ADVISER"
  | "DO_NOT_CONTACT";

export type SensitiveDataStatus =
  | "NONE_RECORDED"
  | "EXPLICIT_PUBLIC_EVIDENCE"
  | "REQUIRES_REVIEW"
  | "SUPPRESSED";

export type SourceAdapterStatus =
  | "READY"
  | "READY_MANUAL_IMPORT"
  | "CONFIG_REQUIRED"
  | "AWAITING_API_ACCESS"
  | "UNAVAILABLE_APPROVED_METHOD_ONLY"
  | "PAUSED";

export interface ScoreVector {
  missionRelevance: number;
  communityCredibility: number;
  commercialLeverage: number;
  foundationRelevance: number;
  motionBrandRelevance: number;
  productRelevance: number;
  publicVoice: number;
  networkProximity: number;
  relationshipWarmth: number;
  approachability: number;
  currentOpportunity: number;
  evidenceConfidence: number;
  riskSensitivity: RiskLevel;
}

export interface Evidence {
  id: string;
  claim: string;
  sourceUrl: string;
  sourcePublisher: string;
  sourceDate: string;
  discoveredDate: string;
  lastChecked: string;
  extractionMethod: "manual" | "import" | "api" | "approved_search" | "ai_structured_review";
  confidence: ConfidenceLevel;
}

export interface SensitiveStatus {
  sensitiveDataStatus: SensitiveDataStatus;
  sourceType: "none" | "public_self_disclosure" | "public_professional_bio" | "manual_review";
  explicitSelfDisclosure: boolean;
  evidenceUrl?: string;
  evidenceDate?: string;
  allowedForResearch: boolean;
  allowedForOutreach: boolean;
  requiresReview: boolean;
}

export interface SocialAccount {
  platform:
    | "LinkedIn"
    | "Instagram"
    | "Facebook"
    | "TikTok"
    | "YouTube"
    | "X"
    | "Threads"
    | "Website"
    | "Podcast"
    | "Substack"
    | "Other";
  accountUrl: string;
  username: string;
  accountType: "person" | "organisation" | "creator" | "public_figure" | "unknown";
  verifiedVisible: boolean | null;
  dateLastChecked: string;
  matchingConfidence: ConfidenceLevel;
  evidence: string;
}

export interface ContactMethod {
  id: string;
  type: "email" | "mobile" | "social" | "website" | "intro" | "form";
  label: string;
  value: string;
  href: string;
  isPrimary: boolean;
  requiresApproval: boolean;
  notes: string;
}

export interface OutreachPlan {
  whyThem: string;
  bestRelationshipType: string;
  bestRoute: string;
  warmestIntroductionPath: string[];
  openingAngle: string;
  motionCanOffer: string;
  whatNotToSay: string;
  timing: Timing;
  requiresHumanApproval: boolean;
}

export interface RedTeamCheck {
  recommendation: Timing;
  concerns: string[];
  mutualValue: string;
  doNotApproachReason?: string;
}

export interface Person {
  id: string;
  fullName: string;
  preferredName: string;
  profileImage?: string;
  currentHeadline: string;
  currentRole: string;
  organisationId?: string;
  previousOrganisations: string[];
  previousRoles: string[];
  country: string;
  region: string;
  city?: string;
  languages: string[];
  primaryMotionRole: string;
  additionalMotionRoles: string[];
  foundationRoles: string[];
  skills: string[];
  sectors: string[];
  communities: string[];
  contributionTypes: string[];
  geographicUsefulness: string[];
  estimatedStrategicValue: "HIGH" | "MEDIUM" | "LOW";
  relationshipWarmth: WarmthLevel;
  approachability: "HIGH" | "MEDIUM" | "LOW";
  currentRelevance: "HIGH" | "MEDIUM" | "LOW";
  evidenceConfidence: ConfidenceLevel;
  scores: ScoreVector;
  sensitive: SensitiveStatus;
  publicAccounts: SocialAccount[];
  contactMethods?: ContactMethod[];
  evidence: Evidence[];
  recentChanges: string[];
  status: HumanDecision;
  suppressionReason?: string;
  recommendedMotionRole: string;
  recommendedFoundationRole: string;
  redTeam: RedTeamCheck;
  outreach: OutreachPlan;
}

export interface Organisation {
  id: string;
  name: string;
  logoText: string;
  website: string;
  sector: string;
  organisationType:
    | "charity"
    | "company"
    | "sports_organisation"
    | "governing_body"
    | "foundation"
    | "media_organisation"
    | "retailer"
    | "fashion_brand"
    | "accessibility_agency"
    | "healthcare_organisation"
    | "rehabilitation_centre"
    | "university"
    | "research_institution"
    | "funder"
    | "investor"
    | "government_body"
    | "regulator"
    | "campaign"
    | "community_group";
  country: string;
  region: string;
  description: string;
  purpose: string;
  keyPeople: string[];
  associatedPeople: string[];
  socialProfiles: SocialAccount[];
  relationshipToMotion: string;
  potentialContribution: string[];
  currentPartnerships: string[];
  relevantCampaigns: string[];
  relevantFundingActivity: string[];
  news: string[];
  notes: string;
}

export interface Relationship {
  id: string;
  fromKind: EntityKind;
  fromId: string;
  toKind: EntityKind;
  toId: string;
  type: string;
  source: string;
  confidence: ConfidenceLevel;
  date: string;
  lastVerified: string;
  notes: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  publisher: string;
  url: string;
  publicationDate: string;
  discoveredDate: string;
  summary: string;
  namedPeople: string[];
  namedOrganisations: string[];
  topics: string[];
  countries: string[];
  whyItMatters: string;
  sourceConfidence: ConfidenceLevel;
}

export interface Opportunity {
  id: string;
  title: string;
  type:
    | "partnership"
    | "funding"
    | "ambassador"
    | "product"
    | "foundation"
    | "policy"
    | "media"
    | "distribution";
  relatedPeople: string[];
  relatedOrganisations: string[];
  urgency: "HIGH" | "MEDIUM" | "LOW";
  status: "NEW" | "REVIEW_REQUIRED" | "SHORTLISTED" | "HOLD" | "APPROVED";
  whyItMatters: string;
  nextStep: string;
}

export interface SourceAdapter {
  id: string;
  sourceName: string;
  permittedAccessMethod: string;
  accessType: "api" | "feed" | "import" | "manual" | "web_search";
  credentialsRequired: string[];
  rateLimits: string;
  allowedData: string[];
  prohibitedUses: string[];
  retentionRestrictions: string;
  lastSuccessfulRun?: string;
  errors: string[];
  status: SourceAdapterStatus;
}

export interface WatchTopic {
  id: string;
  name: string;
  enabled: boolean;
  tier: "WATCHLIST_DAILY" | "PRIORITY_WEEKLY" | "GENERAL_MONTHLY" | "MANUAL_ONLY";
  queries: string[];
}
