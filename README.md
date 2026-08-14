# Family Tree

A responsive family tree prototype with a premium wall-style interface, photo frames, local saving, and a practical share/import flow.

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

- Interactive family wall with pan, zoom, search, date guides, and a prominent You action.
- Portrait-frame profiles with first/last names, middle names, birth date or year, birthplace, gender and photo cropping.
- Simple relative creation for parents, siblings, children, cousins, partners and wider family.
- Duplicate detection when adding relatives.
- Share panel with update links, full share-file download, share-file import, and selected-profile links.
- Reversible local mutations with Saved · Undo.
- Soft deletion and restore list.
- Relationship explorer powered by isolated relationship logic.
- Daily local restore points.
- PostgreSQL/Supabase-oriented schema in `database/schema.sql`.
- Architecture notes in `docs/architecture.md`.

## Sharing

Deploy the app to a public URL first. Do not send a `127.0.0.1` link, because that only works on your computer.

Use **Share → Copy update link** for smaller trees. Anyone who opens that link can import the tree into their browser, edit it, then send an update link back.

Use **Share → Download share file** for larger trees or trees with photos. Send the `.json` file to someone; they can open the same public app and use **Share → Import share file**.

The app asks before importing an update because it replaces the local browser copy. If a small update link does not include photos, existing photos on that device are kept where possible.

## Prototype Notes

This is a static front-end prototype with in-browser state persistence. The share flow works by sending links or files back and forth; it is not yet a live multi-user database. The production build should use hosted storage such as PostgreSQL/Supabase auth/storage/RLS and server-side mutation workflows.
