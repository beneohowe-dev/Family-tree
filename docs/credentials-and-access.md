# Credentials And Access

## Required For Production

| Area | Credential Or Approval | Needed For | Current Status |
| --- | --- | --- | --- |
| Supabase | Project URL, anon key, service role key, JWT secret | Auth, database, storage, workers | Config required |
| LinkedIn | Ben's exported data files | Connections, messages, recommendations, positions | Awaiting files |
| Motion Scout | Existing export files | Seed classifications and history | Awaiting files |
| Meta / Instagram | Meta app, approved permissions | Professional and creator account discovery | Awaiting API access |
| Facebook Pages | Meta app review and relevant Page permissions | Public Page discovery | Awaiting API access |
| TikTok | Approved TikTok API or compliant provider | Optional creator discovery | No approved automated method |
| YouTube | Google Cloud API key/OAuth client | Channel and video discovery | Config required |
| Web/news search | Licensed search/enrichment provider key | News and public web discovery | Config required |
| Background worker host | Railway, Fly.io, Render, or equivalent | Durable scan jobs | Config required |

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
YOUTUBE_DATA_API_KEY=
SEARCH_PROVIDER_API_KEY=
META_APP_ID=
META_APP_SECRET=
WORKER_SHARED_SECRET=
```

## Access Rules

- Do not store platform credentials in source files.
- Do not automate LinkedIn login, browsing, messaging, or connection requests.
- Do not scrape private social profiles.
- Do not bypass rate limits or paywalls.
- Store raw imports separately from interpreted records.
- Add terms and retention notes to every source adapter.
