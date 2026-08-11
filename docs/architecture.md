# Motion Community OS Architecture

## Product Principle

The central question is: what could this person or organisation contribute to Motion or the Foundation?

People and organisations are graph entities. Roles, skills, evidence, relationships, scores, privacy status, and outreach plans are separate records. A person can be an athlete, product tester, ambassador, adviser, and Foundation advocate at the same time.

## Application Layers

1. Next.js app router for the private workspace.
2. Supabase Auth for identity and role-based access.
3. Supabase PostgreSQL for graph entities, evidence, searches, imports, and audit history.
4. Durable Node/TypeScript workers for scan jobs, enrichment queues, and batch AI analysis.
5. Provider adapters for permitted search, API, feed, import, and manual sources.

The prototype currently runs with synthetic in-repo seed data. Production should replace the seed data with Supabase reads and server-side mutation workflows.

## AI Architecture

Do not use one giant AI prompt. Use structured, auditable functions:

1. Discovery agent finds candidate URLs and source records.
2. Entity agent extracts people, organisations, events, campaigns, and funding.
3. Resolution agent compares candidates against existing records.
4. Classification agent maps potential Motion and Foundation contributions.
5. Evidence agent checks factual support and confidence.
6. Red-team agent challenges exploitation, tokenism, timing, privacy, and reputational risks.
7. Relationship agent calculates warmth, proximity, and introduction routes.
8. Opportunity agent turns signals into possible actions.
9. Outreach strategist drafts respectful approach strategy without sending anything.
10. Digest agent chooses the smallest useful daily briefing.

All AI outputs should be JSON validated against typed schemas before writing to database tables.

## Source Adapter Contract

Every adapter must declare:

- source name
- permitted access method
- API/feed/import/manual/web-search type
- required credentials
- rate limits and budgets
- allowed data
- prohibited uses
- retention restrictions
- last successful run
- errors

Adapters must fail closed. If an approved access route is unavailable, the user sees: "Source currently unavailable through an approved automated method."

## Discovery Pipeline

1. Queue enabled watch topics.
2. Search permitted sources within daily budgets.
3. Collect candidate URLs.
4. Deduplicate before AI analysis.
5. Extract named people, organisations, events, campaigns, policy changes, and funding.
6. Match against existing entities.
7. Add evidence to existing entities.
8. Create new candidates in Discovered -> Review Required state.
9. Recalculate fit scores and relationship warmth.
10. Generate a concise daily digest.

Do not rescan every profile every day. Watchlist records run daily, priority community weekly, general database monthly, archive only when manually requested.

## Privacy Boundary

Community research and outreach eligibility are separate. A person can appear in research results for public professional work while remaining blocked from outreach. Sensitive information requires explicit evidence, source URL, source date, and review status. The system must never infer disability, medical condition, sexuality, race/ethnicity, religion, political affiliation, or gender identity from appearance, name, associations, followers, or model output.

## Production Deployment Notes

- Store secrets only in platform environment variables.
- Keep raw imports in private storage with retention controls.
- Use Supabase row-level security for every table.
- Run scans in background workers, not serverless request handlers.
- Log every material data change to `audit_log`.
- Use suppression-list triggers to block outreach records for opted-out or inappropriate contacts.
