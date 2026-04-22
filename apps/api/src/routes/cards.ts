import {
  CardSchema,
  CardWithRelationsSchema,
  CreateCardInputSchema,
  ListCardsQuerySchema,
  MoveCardInputSchema,
  ReorderCardInputSchema,
  UpdateCardInputSchema,
  schema,
} from '@ravenna/shared';
import { and, eq, exists, isNull, like, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { db } from '../db/index.js';
import { zValidator } from '../middleware/validate.js';
import { appendCardPosition, computeCardPosition } from '../services/positions.js';

const { cardTags, cards, columns } = schema;

export const cardsRoute = new Hono()
  .get('/', zValidator('query', ListCardsQuerySchema), async (c) => {
    const q = c.req.valid('query');

    const titleDescMatch =
      q.q !== undefined
        ? or(like(cards.title, `%${q.q}%`), like(cards.description, `%${q.q}%`))
        : undefined;

    const tagMatch =
      q.tagId !== undefined
        ? exists(
            db
              .select({ one: cardTags.cardId })
              .from(cardTags)
              .where(and(eq(cardTags.cardId, cards.id), eq(cardTags.tagId, q.tagId))),
          )
        : undefined;

    const rows = await db.query.cards.findMany({
      where: and(
        isNull(cards.deletedAt),
        q.columnId !== undefined ? eq(cards.columnId, q.columnId) : undefined,
        titleDescMatch,
        tagMatch,
      ),
      orderBy: (c, { asc }) => [asc(c.position)],
      with: {
        cardTags: { with: { tag: true } },
        subtasks: { orderBy: (s, { asc }) => [asc(s.position)] },
        comments: { orderBy: (cm, { asc }) => [asc(cm.createdAt)] },
      },
    });

    const body = rows.map(({ cardTags: ct, ...card }) => ({
      ...card,
      tags: ct.map((x) => x.tag),
    }));

    return c.json(z.array(CardWithRelationsSchema).parse(body));
  })
  .post('/', zValidator('json', CreateCardInputSchema), (c) => {
    const input = c.req.valid('json');

    const result = db.transaction((tx) => {
      const column = tx
        .select({ id: columns.id })
        .from(columns)
        .where(eq(columns.id, input.columnId))
        .get();
      if (!column) throw new HTTPException(404, { message: 'column not found' });

      const position = appendCardPosition(tx, input.columnId);
      const [inserted] = tx
        .insert(cards)
        .values({ ...input, position })
        .returning()
        .all();
      return inserted;
    });

    if (!result) throw new HTTPException(500, { message: 'insert failed' });
    return c.json(CardSchema.parse(result), 201);
  })
  .patch('/:id', zValidator('json', UpdateCardInputSchema), (c) => {
    const id = c.req.param('id');
    const input = c.req.valid('json');

    const [updated] = db
      .update(cards)
      .set(input)
      .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
      .returning()
      .all();
    if (!updated) throw new HTTPException(404, { message: 'card not found' });

    return c.json(CardSchema.parse(updated));
  })
  .delete('/:id', (c) => {
    const id = c.req.param('id');

    const [updated] = db
      .update(cards)
      .set({ deletedAt: new Date() })
      .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
      .returning()
      .all();
    if (!updated) throw new HTTPException(404, { message: 'card not found' });

    return c.json({ ok: true });
  })
  .post('/:id/restore', (c) => {
    const id = c.req.param('id');

    const [restored] = db
      .update(cards)
      .set({ deletedAt: null })
      .where(eq(cards.id, id))
      .returning()
      .all();
    if (!restored) throw new HTTPException(404, { message: 'card not found' });

    return c.json(CardSchema.parse(restored));
  })
  .post('/:id/reorder', zValidator('json', ReorderCardInputSchema), (c) => {
    const id = c.req.param('id');
    const input = c.req.valid('json');

    const result = db.transaction((tx) => {
      const card = tx
        .select()
        .from(cards)
        .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
        .get();
      if (!card) throw new HTTPException(404, { message: 'card not found' });

      // Optimistic concurrency: if the client sent the card's updatedAt
      // at drag-start and another write has bumped it since, reject so
      // the client can refetch and retry. The client rolls back its
      // optimistic state on 409.
      if (
        input.expectedUpdatedAt !== undefined &&
        card.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()
      ) {
        throw new HTTPException(409, { message: 'card was modified by another change' });
      }

      const position = computeCardPosition(
        tx,
        card.columnId,
        input.beforeCardId,
        input.afterCardId,
      );

      const [updated] = tx
        .update(cards)
        .set({ position })
        .where(eq(cards.id, id))
        .returning()
        .all();
      return updated;
    });

    if (!result) throw new HTTPException(500, { message: 'reorder failed' });
    return c.json(CardSchema.parse(result));
  })
  .post('/:id/move', zValidator('json', MoveCardInputSchema), (c) => {
    const id = c.req.param('id');
    const input = c.req.valid('json');

    const result = db.transaction((tx) => {
      const card = tx
        .select()
        .from(cards)
        .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
        .get();
      if (!card) throw new HTTPException(404, { message: 'card not found' });

      if (
        input.expectedUpdatedAt !== undefined &&
        card.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()
      ) {
        throw new HTTPException(409, { message: 'card was modified by another change' });
      }

      const target = tx
        .select({ id: columns.id })
        .from(columns)
        .where(eq(columns.id, input.toColumnId))
        .get();
      if (!target) throw new HTTPException(404, { message: 'target column not found' });

      const position = computeCardPosition(
        tx,
        input.toColumnId,
        input.beforeCardId,
        input.afterCardId,
      );

      const [updated] = tx
        .update(cards)
        .set({ columnId: input.toColumnId, position })
        .where(eq(cards.id, id))
        .returning()
        .all();
      return updated;
    });

    if (!result) throw new HTTPException(500, { message: 'move failed' });
    return c.json(CardSchema.parse(result));
  });
