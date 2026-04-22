# Ravenna Take-Home Kanban

## The stack

- **React SPA** instead of a meta-framework because everything's dynamic
- **fly.io volume + SQLite** strikes a balance between “treat this like it’s a real product” and “but it’s a demo”
- **React Query** for server state, caching, and optimistic updates. I considered Zustand for client state because of the assignment's emphasis on state management, but it's really not needed
- **Hono** - type-safe server framework
- **Zod** - one schema to validate forms and HTTP bodies, and to infer TS types across server/client
- **Pino** - the assignment asked for logging; pino is a wise choice
- **Vitest + React Testing Library**
- **`dnd-kit`** because you can use the keyboard to drag n drop 😍
- **`@tanstack/react-virtual`** for virtualizing long card lists so off-screen cards don't render
- **Drizzle ORM** & more

## Setup

```bash
pnpm install && pnpm dev
```

Requires Node 22+ and `corepack enable pnpm`.

First `pnpm dev` gives you a pre-populated board - 4 columns, 8 sample cards with tags, subtasks, and comments. Migrations and seed run once on boot.

To test the long-column virtualization, reset the DB and reseed Backlog with ~200 extra synthetic cards:

```bash
rm apps/api/data/kanban.db && SEED_LARGE_COLUMN=200 pnpm dev
```

## Live demo

https://ravenna-kanban-demo.fly.dev (Fly.io, SQLite on a volume)

## Accessibility

You can use the whole app with the keyboard. Dialogs and popovers use Radix primitives for focus trap + ARIA. Color contrast stays WCAG-AA in both themes.

**Drag a card with the keyboard:**

1. `Tab` until a card has a visible focus ring.
2. `Space` to pick it up.
3. `↑ ↓` to move within the column, `← →` to move to an adjacent column.
4. `Space` (or `Enter`) to drop.
5. `Esc` at any time to cancel.

Columns drag the same way from their header.

## pnpm workspaces

This is a monorepo that has `apps/web`, `apps/api`, and `packages/shared`. `packages/shared` holds Zod schemas consumed by both web and api.

## Under the hood

Things a reviewer won't notice by clicking around:

- **Rate limiting** per IP on all `/api` routes
- **Structured logging** with per-request IDs (Pino)
- **Soft delete** on cards (`deleted_at` + `POST /cards/:id/restore`)
- **Optimistic updates with rollback** — React Query snapshots the cache in `onMutate`, rolls back on failure
- **Concurrency-safe reordering** — fractional indexing means two clients moving the same card never clobber each other
- **Optimistic concurrency on move/reorder** — the client sends the card's `updatedAt` with each move/reorder and the server rejects with `409 CONFLICT` if another write has landed since. Trade-off: because the optimistic update doesn't bump the cached `updatedAt`, two drags of the same card within a ~100ms window can collide with the server's own response and snap back. Acceptable for a single-user app; a second-drag flicker beats stale writes.
- **API integration tests** — 13 route tests against a fresh DB (`pnpm --filter api test`)

## State management

React Query caches the full board under a single query key, populated by `GET /api/board`. Mutations patch that cache optimistically, roll back on failure, then refetch for truth. Local UI state (modals, form drafts, drag state) lives in component `useState`. No separate client-state library — Zustand/Redux would be overhead for a single-board app.

## Database

SQLite via Drizzle. Migrations in `apps/api/drizzle/`, applied once on boot.

Tables:

- `boards`, `columns`, `cards`, `tags`, `card_tags` (M:N)
- `subtasks`, `comments` (1:M on cards)

Card and column `position` columns are `REAL` (floats) — see fractional indexing below. `cards.deleted_at` enables soft delete + restore.

## API

All routes under `/api`, JSON in/out, Zod-validated with a consistent error shape.

- `GET /board` — full board payload (columns, cards, tags, subtasks, comments)
- `/cards` — CRUD + `/:id/reorder`, `/:id/move`, `/:id/restore`, and list with filters
- `/columns` — CRUD + `/:id/reorder`
- `/tags` — CRUD + attach/detach to cards
- `/subtasks`, `/comments` — CRUD

## More decisions I wanted to mention

### Fractional indexing

By using floats for card/column positions instead of integers, reordering can be a single UPDATE that doesn’t resequence siblings.

### Single `GET /api/board` endpoint

This is what the UI needs. Splitting into `/columns` and `/cards` would multiply round trips. For large boards, I added virtualization to skip rendering off-screen DOM nodes (see above)

## How I used AI

Built with Claude in about 6 hours. After planning, we filed everything as GitHub Issues. I like to track issues as soon as they arise to avoid losing things in conversations. It also allowed me use these skills:

- `/fix` - As soon as I see an issue, I use this to report → fix → test it on the spot. It creates a GitHub Issue, fixes it, and tells me the repro steps so I can confirm that it's fixed.
- `/next` - looks at the tracked Issues and starts a conversation about what we should do next

## Roadmap

- Custom fields on cards - instead of deciding which attributes users want (bloating the UI, scaring away minimalists), maybe let them decide? Add a label and choose a data type, see it appear on all cards, and see a new search filter appear next to the search bar.
