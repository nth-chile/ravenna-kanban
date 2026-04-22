# Ravenna Take-Home Kanban

## A little about the stack

- React SPA - most of the page is dynamic
- Standalone API - instead of something simpler like Next.js API routes, because I wanted to treat this as if it were a real product
- fly.io volume + SQLite - had to draw the line somewhere between “pretend it’s a real product” and “but it’s a demo”
- React Query - handles server state, caching, optimistic updates. Considered Zustand for client, but I think it’s not needed here
- Hono - type-safe server framework
- Zod - use one schema to validate forms and HTTP bodies, and to infer TS types across server/client
- pino - brief asked for logging; pino would be a wise choice for a real product
- Vitest + React Testing Library
- `dnd-kit` because it’s keyboard-accessible

## Setup

```bash
pnpm install
pnpm dev     # api on :3001, web on :5173 (proxies /api)
```

Requires Node 22+ and `corepack enable pnpm`.

## pnpm workspaces

This is a monorepo that has `apps/web`,`apps/api`, and `packages/shared`. `packages/shared` holds Zod schemas consumed by both web and api.

## More decisions I wanted to explain

### Fractional indexing

By using floats for card/column positions instead of integers, reordering can be a single UPDATE that doesn’t resequence siblings

### Single `GET /api/board` endpoint

This is what the UI needs. Splitting into `/columns` and `/cards` would multiply round trips

## How I used AI

Planned & built with Claude. We had a lot of back & forth in the planning phases. Rather than planning the entire project at once, I decided to do several separate plans - take everything into consideration for each phase, but still focus on one commit at a time. See the commit history for how I sliced the project.

After the initial scaffold, I asked Claude to make actionable GitHub Issues because it’s a workflow that’s working well for me with https://nubium.rocks

### Skills

- `/fix` - this is handy for fixing/testing bugs as they arise. It creates an issue, fixes it, and tells me repro steps so I can confirm that it's fixed.
- `/next` - looks at the GitHub issues and starts a conversation about what we should do next
