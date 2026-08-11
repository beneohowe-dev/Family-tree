import type { SourceAdapter } from "./types";

export const sourceAdapters: SourceAdapter[] = [
  {
    id: "linkedin-export",
    sourceName: "LinkedIn Export",
    permittedAccessMethod: "Ben uploads exported LinkedIn Connections, Messages, Recommendations, and Positions files.",
    accessType: "import",
    credentialsRequired: [],
    rateLimits: "Manual export cadence. No automated LinkedIn browsing.",
    allowedData: [
      "Names and profile URLs from exports",
      "Connection dates",
      "Message metadata and content when included in Ben's export",
      "Recommendations and positions from exported files"
    ],
    prohibitedUses: [
      "Logging in automatically",
      "Scraping logged-in pages",
      "Simulating profile browsing",
      "Automated connection requests",
      "Automated messaging"
    ],
    retentionRestrictions: "Keep imported raw files separate from interpreted intelligence and allow deletion/export.",
    errors: ["No LinkedIn CSV has been provided in this workspace."],
    status: "READY_MANUAL_IMPORT"
  },
  {
    id: "motion-scout",
    sourceName: "Motion Scout Seed Data",
    permittedAccessMethod: "Structured local import from existing Motion Scout export files.",
    accessType: "import",
    credentialsRequired: [],
    rateLimits: "Import only when a reviewed export is placed in the import folder.",
    allowedData: ["Existing classifications", "Profile URLs", "Relationship notes", "Prior shortlist decisions"],
    prohibitedUses: ["Overwriting manually curated notes without audit history"],
    retentionRestrictions: "Preserve source row id, import time, and field-level change history.",
    errors: ["No Motion Scout files were found in this workspace."],
    status: "READY_MANUAL_IMPORT"
  },
  {
    id: "meta-instagram",
    sourceName: "Instagram Professional Discovery",
    permittedAccessMethod: "Approved Meta APIs for professional or creator accounts where Motion has permission.",
    accessType: "api",
    credentialsRequired: ["Meta app id", "Meta app secret", "Instagram Graph API permissions"],
    rateLimits: "Use Meta account limits and per-source daily budgets.",
    allowedData: ["Permitted public metadata", "Public account URLs", "Public creator or organisation profile context"],
    prohibitedUses: ["Private profile scraping", "Collecting non-public data", "Circumventing API restrictions"],
    retentionRestrictions: "Store only allowed metadata and evidence references.",
    errors: [],
    status: "AWAITING_API_ACCESS"
  },
  {
    id: "facebook-pages",
    sourceName: "Facebook Public Pages",
    permittedAccessMethod: "Approved Facebook/Meta API routes for public Pages and public figures.",
    accessType: "api",
    credentialsRequired: ["Meta app review", "Page public content access if granted"],
    rateLimits: "Use approved API quotas and source-level daily caps.",
    allowedData: ["Public Page metadata", "Public organisation links", "Campaign announcements"],
    prohibitedUses: ["Ordinary personal profile collection at scale", "Private profile scraping"],
    retentionRestrictions: "Keep page evidence and source terms with each fact.",
    errors: [],
    status: "AWAITING_API_ACCESS"
  },
  {
    id: "tiktok-optional",
    sourceName: "TikTok Optional Adapter",
    permittedAccessMethod: "Manual URLs, compliant indexed web search, or approved TikTok/commercial APIs.",
    accessType: "manual",
    credentialsRequired: ["TikTok API approval or approved commercial provider contract"],
    rateLimits: "Disabled until an approved access route exists.",
    allowedData: ["Manually reviewed public URLs", "Approved creator discovery metadata"],
    prohibitedUses: ["Unauthorised scraping", "Private account collection", "Rate-limit circumvention"],
    retentionRestrictions: "Evidence URL required for each retained claim.",
    errors: ["Source currently unavailable through an approved automated method."],
    status: "UNAVAILABLE_APPROVED_METHOD_ONLY"
  },
  {
    id: "youtube-data-api",
    sourceName: "YouTube Data API",
    permittedAccessMethod: "Official YouTube Data API.",
    accessType: "api",
    credentialsRequired: ["Google Cloud project", "YouTube Data API key or OAuth client"],
    rateLimits: "Respect quota units; run broad discovery through queued batches.",
    allowedData: ["Video metadata", "Channel metadata", "Descriptions", "Permitted public engagement signals"],
    prohibitedUses: ["Downloading or republishing video content outside terms"],
    retentionRestrictions: "Store links, short original summaries, extracted entities, and evidence.",
    errors: [],
    status: "CONFIG_REQUIRED"
  },
  {
    id: "news-search",
    sourceName: "Compliant Web And News Search",
    permittedAccessMethod: "Search/enrichment provider behind a swappable adapter.",
    accessType: "web_search",
    credentialsRequired: ["Search provider API key", "Terms review"],
    rateLimits: "Per-topic budgets, dedupe before AI analysis, incremental daily scans.",
    allowedData: ["Headlines", "URLs", "publication dates", "short original summaries", "extracted entities"],
    prohibitedUses: ["Republishing full copyrighted articles", "Copying news images", "Bypassing paywalls"],
    retentionRestrictions: "Keep source links and concise original intelligence summaries only.",
    errors: [],
    status: "CONFIG_REQUIRED"
  },
  {
    id: "manual-evidence",
    sourceName: "Manual Evidence Review",
    permittedAccessMethod: "Admin-reviewed URLs and notes.",
    accessType: "manual",
    credentialsRequired: [],
    rateLimits: "Human review capacity.",
    allowedData: ["Public source links", "Admin notes", "Correction and opt-out records"],
    prohibitedUses: ["Sensitive inference from appearance, names, followers, or associations"],
    retentionRestrictions: "Audit every change and allow suppression/deletion workflows.",
    lastSuccessfulRun: "2026-08-11",
    errors: [],
    status: "READY"
  }
];

export function unavailableAdapterMessage(adapter: SourceAdapter): string {
  if (adapter.status === "UNAVAILABLE_APPROVED_METHOD_ONLY") {
    return "Source currently unavailable through an approved automated method.";
  }

  if (adapter.status === "AWAITING_API_ACCESS") {
    return "Awaiting API access.";
  }

  if (adapter.status === "CONFIG_REQUIRED") {
    return "Configuration required before automated collection.";
  }

  return "Ready.";
}
