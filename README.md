# Private Family Network

A responsive prototype for a private, collaborative, living family network.

## Open Locally

```bash
npm run start
```

Then open `http://localhost:4173`.

## Test

```bash
npm test
```

## What Is Included

- Interactive family map with pan, zoom, search, branch collapse, and a prominent You action.
- Profile panel with claimed profiles, stewarded profiles, optional fields, memories, and family links.
- Contribution flow using Add something rather than profile completion.
- Owner-safe suggestions for edits to claimed living profiles.
- Duplicate detection when adding relatives.
- Private landing page with access request flow.
- Invitation and access request admin panel.
- Reversible local mutations with Saved · Undo.
- Soft deletion and restore list.
- Relationship explorer powered by isolated relationship logic.
- Explore area with privacy-filtered, minimum-group-size aggregation.
- Curated theme and accent controls.
- PostgreSQL/Supabase-oriented schema in `database/schema.sql`.
- Architecture notes in `docs/architecture.md`.

## Prototype Notes

This is a local front-end prototype with in-browser state persistence. It intentionally avoids credentials, hosted services, and external image dependencies. The production build should use Next.js, TypeScript, PostgreSQL, Supabase auth/storage/RLS, and server-side mutation workflows.
