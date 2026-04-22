import type { Hono } from 'hono';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Fixture, json, resetDb, seedFixture, setupApp } from '../test/harness.js';

let app: Hono;
let fx: Fixture;

beforeAll(() => {
  app = setupApp();
});

beforeEach(() => {
  resetDb();
  fx = seedFixture();
});

function req(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost${path}`, init);
}

function body(payload: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

describe('GET /api/board', () => {
  it('returns the seeded board with its columns, cards, and tags', async () => {
    const res = await app.fetch(req('/api/board'));
    expect(res.status).toBe(200);
    const data = await json<{
      id: string;
      columns: Array<{ id: string; name: string; cards: Array<{ id: string; title: string }> }>;
      tags: Array<{ id: string; name: string }>;
    }>(res);

    expect(data.id).toBe(fx.boardId);
    expect(data.columns).toHaveLength(2);
    expect(data.columns[0]?.name).toBe('A');
    expect(data.columns[0]?.cards.map((c) => c.title)).toEqual(['First', 'Second']);
    expect(data.tags.map((t) => t.name).sort()).toEqual(['bug', 'feature']);
  });
});

describe('POST /api/cards', () => {
  it('creates a card in the target column and returns it', async () => {
    const res = await app.fetch(
      req('/api/cards', body({ columnId: fx.columnAId, title: 'Third', description: 'desc' })),
    );
    expect(res.status).toBe(201);
    const card = await json<{ id: string; title: string; columnId: string; position: number }>(res);

    expect(card.title).toBe('Third');
    expect(card.columnId).toBe(fx.columnAId);
    expect(card.position).toBeGreaterThan(2); // appended after the two seeded cards
  });

  it('400s with VALIDATION_ERROR on missing title', async () => {
    const res = await app.fetch(req('/api/cards', body({ columnId: fx.columnAId })));
    expect(res.status).toBe(400);
    const err = await json<{ error: { code: string } }>(res);
    expect(err.error.code).toBe('VALIDATION_ERROR');
  });

  it('404s when the target column does not exist', async () => {
    const res = await app.fetch(
      req('/api/cards', body({ columnId: '00000000-0000-0000-0000-000000000000', title: 'Nope' })),
    );
    expect(res.status).toBe(404);
    const err = await json<{ error: { code: string } }>(res);
    expect(err.error.code).toBe('NOT_FOUND');
  });
});

describe('PATCH /api/cards/:id', () => {
  it('updates a card and does not find soft-deleted cards', async () => {
    const res = await app.fetch(
      req(`/api/cards/${fx.cardOneId}`, { ...body({ title: 'Renamed' }), method: 'PATCH' }),
    );
    expect(res.status).toBe(200);

    // Soft delete then try to update
    await app.fetch(req(`/api/cards/${fx.cardOneId}`, { method: 'DELETE' }));
    const second = await app.fetch(
      req(`/api/cards/${fx.cardOneId}`, { ...body({ title: 'x' }), method: 'PATCH' }),
    );
    expect(second.status).toBe(404);
  });
});

describe('DELETE + restore', () => {
  it('soft-deletes a card and can restore it', async () => {
    const del = await app.fetch(req(`/api/cards/${fx.cardOneId}`, { method: 'DELETE' }));
    expect(del.status).toBe(200);

    const board1 = await json<{ columns: Array<{ cards: Array<{ id: string }> }> }>(
      await app.fetch(req('/api/board')),
    );
    const ids1 = board1.columns.flatMap((c) => c.cards.map((card) => card.id));
    expect(ids1).not.toContain(fx.cardOneId);

    const restore = await app.fetch(req(`/api/cards/${fx.cardOneId}/restore`, { method: 'POST' }));
    expect(restore.status).toBe(200);

    const board2 = await json<{ columns: Array<{ cards: Array<{ id: string }> }> }>(
      await app.fetch(req('/api/board')),
    );
    const ids2 = board2.columns.flatMap((c) => c.cards.map((card) => card.id));
    expect(ids2).toContain(fx.cardOneId);
  });
});

describe('POST /api/cards/:id/move', () => {
  it('moves a card to another column', async () => {
    const res = await app.fetch(
      req(`/api/cards/${fx.cardOneId}/move`, body({ toColumnId: fx.columnBId })),
    );
    expect(res.status).toBe(200);

    const board = await json<{ columns: Array<{ id: string; cards: Array<{ id: string }> }> }>(
      await app.fetch(req('/api/board')),
    );
    const colB = board.columns.find((c) => c.id === fx.columnBId);
    expect(colB?.cards.map((c) => c.id)).toContain(fx.cardOneId);
  });
});

describe('POST /api/cards/:id/reorder', () => {
  it('reorders a card within its column by beforeCardId', async () => {
    // Move card one (position 1) to after card two (position 2)
    const res = await app.fetch(
      req(`/api/cards/${fx.cardOneId}/reorder`, body({ beforeCardId: fx.cardTwoId })),
    );
    expect(res.status).toBe(200);

    const board = await json<{ columns: Array<{ id: string; cards: Array<{ id: string }> }> }>(
      await app.fetch(req('/api/board')),
    );
    const colA = board.columns.find((c) => c.id === fx.columnAId);
    const ids = colA?.cards.map((c) => c.id) ?? [];
    // Second should now come before First
    expect(ids).toEqual([fx.cardTwoId, fx.cardOneId]);
  });
});

describe('optimistic concurrency control', () => {
  async function loadCard(id: string) {
    const board = await json<{
      columns: Array<{ cards: Array<{ id: string; updatedAt: string }> }>;
    }>(await app.fetch(req('/api/board')));
    return board.columns.flatMap((c) => c.cards).find((c) => c.id === id);
  }

  it('reorder with stale expectedUpdatedAt returns 409 CONFLICT', async () => {
    const card = await loadCard(fx.cardOneId);
    if (!card) throw new Error('card not found');

    // First reorder bumps updatedAt on the server
    await app.fetch(
      req(`/api/cards/${fx.cardOneId}/reorder`, body({ beforeCardId: fx.cardTwoId })),
    );

    // Second reorder with the now-stale updatedAt should conflict
    const res = await app.fetch(
      req(
        `/api/cards/${fx.cardOneId}/reorder`,
        body({ afterCardId: fx.cardTwoId, expectedUpdatedAt: card.updatedAt }),
      ),
    );
    expect(res.status).toBe(409);
    const err = await json<{ error: { code: string } }>(res);
    expect(err.error.code).toBe('CONFLICT');
  });

  it('move with matching expectedUpdatedAt succeeds', async () => {
    const card = await loadCard(fx.cardOneId);
    if (!card) throw new Error('card not found');

    const res = await app.fetch(
      req(
        `/api/cards/${fx.cardOneId}/move`,
        body({ toColumnId: fx.columnBId, expectedUpdatedAt: card.updatedAt }),
      ),
    );
    expect(res.status).toBe(200);
  });
});

describe('filters', () => {
  it('GET /api/cards?tagId=... returns only cards with that tag', async () => {
    // Attach feature tag to card one
    await app.fetch(req(`/api/cards/${fx.cardOneId}/tags/${fx.tagFeatureId}`, { method: 'POST' }));

    const res = await app.fetch(req(`/api/cards?tagId=${fx.tagFeatureId}`));
    expect(res.status).toBe(200);
    const cards = await json<Array<{ id: string; tags: Array<{ id: string }> }>>(res);
    expect(cards.map((c) => c.id)).toEqual([fx.cardOneId]);
    expect(cards[0]?.tags.map((t) => t.id)).toContain(fx.tagFeatureId);
  });

  it('GET /api/cards?q=... matches title', async () => {
    const res = await app.fetch(req('/api/cards?q=second'));
    expect(res.status).toBe(200);
    const cards = await json<Array<{ id: string; title: string }>>(res);
    expect(cards.map((c) => c.title)).toEqual(['Second']);
  });
});

describe('columns', () => {
  it('creates, renames, and deletes columns (cards cascade)', async () => {
    const createRes = await app.fetch(
      req('/api/columns', body({ boardId: fx.boardId, name: 'Testing' })),
    );
    expect(createRes.status).toBe(201);
    const col = await json<{ id: string; name: string }>(createRes);
    expect(col.name).toBe('Testing');

    const renameRes = await app.fetch(
      req(`/api/columns/${col.id}`, { ...body({ name: 'Renamed' }), method: 'PATCH' }),
    );
    expect(renameRes.status).toBe(200);

    const delRes = await app.fetch(req(`/api/columns/${col.id}`, { method: 'DELETE' }));
    expect(delRes.status).toBe(200);

    const renameAgain = await app.fetch(
      req(`/api/columns/${col.id}`, { ...body({ name: 'x' }), method: 'PATCH' }),
    );
    expect(renameAgain.status).toBe(404);
  });
});
