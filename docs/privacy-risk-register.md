# Privacy And Data Risk Register

| Risk | Example Failure | Control In This Build | Production Requirement |
| --- | --- | --- | --- |
| Sensitive inference | Labelling someone disabled because they work for a disability charity | `canRecordSensitiveConnection` only accepts explicit public evidence or professional bio evidence | Add reviewer workflow and source evidence IDs before field changes |
| Outreach overreach | Recommending someone for marketing because of a disability-related characteristic | `isOutreachEligible` separates research from outreach and blocks review-required records | Require human approval for every outreach plan |
| Suppression override | Contacting a person who opted out or declined | UI locks suppressed records; database trigger blocks outreach inserts | Add admin revocation workflow with audit history |
| Name-only matching | Merging two people with the same name | Entity resolver caps name-only score below auto-merge | Require multi-signal evidence for automatic merges |
| Copyright reuse | Storing or republishing full news articles | Source docs specify links and short original summaries only | Enforce storage limits per content source |
| Platform terms breach | Scraping logged-in LinkedIn, TikTok, Instagram, or Facebook data | Source adapters list prohibited uses and access status | Legal review for each API/provider |
| Warmth inflation | Treating first-degree LinkedIn as a warm relationship | Warmth is scored separately from connection status | Import message history and manual notes before warmth upgrades |
| Fame bias | Celebrity outranks trusted community members | Daily priority weights warmth, credibility, and evidence separately from public voice | Add red-team tests to ranking model |
| Old data overwrite | Old export overwrites current job or manual note | Import docs require field-level audit and no silent overwrite | Use import staging and reviewer diff screens |
| Purpose creep | Public data reused for unrelated marketing | `privacy_status` stores purpose and lawful-use status | Periodic privacy review and retention expiry jobs |

## Default V1 Decisions

- Default sensitive records to `requires_review = true`.
- Default outreach to blocked unless research purpose, evidence, and suppression checks pass.
- Keep raw source evidence separate from AI interpretation.
- Prefer "Do not approach yet" over weak or exploitative suggestions.
- Do not use image analysis for sensitive attributes.
