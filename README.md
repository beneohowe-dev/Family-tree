# Motion Community OS

Private relationship shortlist and approach notebook for Motion and Motion Foundation.

The app starts empty. Add real people one at a time, then capture why they matter, how to contact them, when to approach, how to allocate them, and what Motion or the Foundation can genuinely offer.

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:4174`.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

## What Works Immediately

- Empty local-first shortlist.
- LinkedIn export import from the official ZIP or `Connections.csv`.
- Direct contact links for email, mobile, website, social profile, or intro route.
- Pin, save, allocate, score, and timing controls.
- Approach notes: opening angle, benefit to them, benefit to Motion/Foundation, and what not to say.
- Search across saved people.
- Motion and Motion Foundation branding using the local brand assets in `public/brand`.
- Supabase/PostgreSQL schema for later production data.

## Project Map

- `app/` contains the Next.js app shell and global styling.
- `components/community-os-app.tsx` contains the empty starter workspace UI.
- `public/brand/` contains optimized Motion and Motion Foundation logo/hero assets.
- `lib/` contains typed domain models, empty seed exports, LinkedIn import helpers, fit ranking, search, relationship paths, and entity resolution.
- `database/schema.sql` contains the Supabase-oriented schema.
- `docs/v1-red-team.md` captures the deliberately smaller starting workflow.
- `tests/` covers the core guardrails.
