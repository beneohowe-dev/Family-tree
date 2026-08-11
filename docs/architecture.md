# Private Collaborative Family Network Architecture

## Product Shape

The core loop is deliberately simple:

1. See the family map.
2. Find yourself.
3. Explore people and connections.
4. Add one small contribution.

The tree stays lightweight: photo, name, optional years, and relationships. All richer information lives in the profile panel.

## Recommended Production Stack

- Next.js with TypeScript for app routes, server actions, and responsive UI.
- Supabase for PostgreSQL, authentication, storage, and row-level security.
- Object storage with original uploads plus optimized image variants.
- Netlify or Vercel for initial hosting.
- Scheduled database backups, media replication, and tested restore drills.

This prototype is dependency-free so it can be opened and reviewed immediately. The schema in `database/schema.sql` is the intended production data foundation.

## Data Model

The family is a graph:

- `person` is the node.
- `relationship` is the edge.
- Parent, partner, sibling, adoptive, step, foster, and guardian connections are relationship kinds, not hard-coded gender assumptions.

Personal fields and structural relationships are separated:

- Personal information belongs to the claimed profile owner or profile steward.
- Relationships are shared structural data and are versioned separately.
- Suggestions never overwrite owner-controlled fields silently.

## Privacy Model

Privacy must be enforced server-side.

- `family`: approved members of the Family Space.
- `connections`: members inside a future relationship boundary.
- `only_me`: visible only to the owning user.

Search, autocomplete, filters, aggregates, analytics, and relationship calculations should all use the same permission-filtered data access layer. Sensitive fields should be excluded from aggregation unless a future privacy review approves a safe suppression rule.

## Rendering Large Families

The map should behave like a human map, not an old genealogy chart.

Recommended progression:

- Under 500 people: client graph layout with pan, zoom, search, and branch collapse.
- 500 to 5,000 people: viewport rendering, level-of-detail nodes, branch clustering, and server-side search.
- 5,000+ people: precomputed layout tiles, progressive graph hydration, and worker-based path calculations.

The prototype demonstrates level-of-detail and branch collapse with a small graph.

## Relationship Engine

`relationship-engine.js` is isolated and covered by `tests/relationship-engine.test.js`.

It currently supports:

- ancestors and descendants
- siblings and half-siblings
- cousins, cousin degrees, and removed cousins
- spouse or partner records
- sibling-in-law paths
- ambiguous visible graph fallback

Production should keep this as a pure module with a larger test matrix before allowing relationship terms to drive user-facing claims.

## Mutation Safety

Important changes should be reversible transactions:

- Add revision rows for profile and relationship updates.
- Add `activity_event` rows for visible history.
- Use `deleted_at` and `deletion_record` for soft deletion.
- Keep periodic snapshots for catastrophic recovery.
- Treat backup recovery separately from version history.

## Access And Claiming

Users can enter through:

- admin email invitation
- private URL access request

Existing people should claim their profile rather than creating duplicates. Claims should require approval when the risk is non-trivial.

## V1 Build Path

1. Convert the prototype into a Next.js app with typed domain modules.
2. Implement Supabase auth and membership-scoped data access.
3. Port the schema and tighten RLS policies with integration tests.
4. Replace local prototype mutations with server actions/RPCs.
5. Add media upload pipeline with original preservation and optimized variants.
6. Expand duplicate detection and relationship test coverage.
7. Add admin restore tools and backup restore runbooks.
