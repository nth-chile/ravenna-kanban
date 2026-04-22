# Ravenna Take-Home Kanban

## A little about the stack

- React SPA - most of the page is dynamic
- Standalone API - instead of something simpler like Next.js API routes, because I wanted to treat this as if it were a real product
- fly.io volume + SQLite - had to draw the line somewhere between “pretend it’s a real product” and “but it’s a demo”
- React Query - handles server state, caching, optimistic updates. Considered Zustand for client, but I think it’s not needed here
- Hono - type-safe server framework
- Zod - use one schema to validate forms and HTTP bodies, and to infer TS types across server/client
- Pino - structured JSON logs with per-request IDs. brief asked for logging; this is what a real product ships.
- Vitest + React Testing Library
- `dnd-kit` because it’s keyboard-accessible

## Setup

```bash
pnpm install
pnpm dev     # api on :3001, web on :5173 (proxies /api)
```

Requires Node 22+ and `corepack enable pnpm`.

First `pnpm dev` gives you a pre-populated board — 4 columns, 8 sample cards with tags, subtasks, and comments. Migrations and seed run once on boot, so there’s no separate setup step.

## Live demo

Live demo: _coming soon — Fly.io, SQLite on a volume_.

## What’s in

Shipped:

- Drag-drop cards between and within columns
- Column drag-reorder
- Optimistic UI with rollback on failure
- Card details panel (subtasks, tags, comments)
- Filter by search + tags
- Soft delete (`deleted_at`, enables undo)
- Dark mode
- Rate limiting
- Structured logging (Pino, per-request IDs)
- One-shot migrate + seed on boot
- Keyboard drag via dnd-kit

Deferred (see Roadmap):

- Custom fields
- Group-by — replace-mode is designed (see NOTES.md decision #2) but the UI is still WIP
- Realtime updates
- Multi-user / auth
- Virtualization for very large boards

## Accessibility

dnd-kit gives us keyboard drag (Tab to card, Space to grab, arrows to move, Esc to cancel). Dialogs and popovers use Radix primitives for focus trap + ARIA. Color contrast stays WCAG-AA in both themes.

## pnpm workspaces

This is a monorepo that has `apps/web`, `apps/api`, and `packages/shared`. `packages/shared` holds Zod schemas consumed by both web and api.

## More decisions I wanted to explain

### Fractional indexing

By using floats for card/column positions instead of integers, reordering can be a single UPDATE that doesn’t resequence siblings.

### Single `GET /api/board` endpoint

This is what the UI needs. Splitting into `/columns` and `/cards` would multiply round trips.

### SQLite now, Postgres later

Moving to Postgres is a schema-file rewrite with Drizzle’s `pg-core`. Service and route layers don’t change.

## How I used AI

Planned & built with Claude. We had a lot of back & forth in the planning phases. Rather than planning the entire project at once, I decided to do several separate plans - take everything into consideration for each phase, but still focus on one commit at a time. See the commit history for how I sliced the project.

After the initial scaffold, I asked Claude to make actionable GitHub Issues because it’s a workflow that’s working well for me with https://nubium.rocks

### Skills

- `/fix` - this is handy for fixing/testing bugs as they arise. It creates an issue, fixes it, and tells me repro steps so I can confirm that it's fixed.
- `/next` - looks at the GitHub issues and starts a conversation about what we should do next

## Roadmap

Things I’d do next if this were heading to production:

- Custom fields — named tags with data types (number, date, select)
- Virtualization for large boards (react-virtual on columns and card lists)
- Real-time updates via SSE or websocket — multiple tabs stay in sync
- User accounts + board sharing
- Audit log — who changed what, when
- Comment mentions + notifications
- Bulk edit (multi-select cards, move/tag/delete)
- Saved filters
- Board templates
