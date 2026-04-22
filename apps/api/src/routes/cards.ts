import {
  CardSchema,
  CreateCardInputSchema,
  MoveCardInputSchema,
  ReorderCardInputSchema,
  UpdateCardInputSchema,
  schema,
} from '@ravenna/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { zValidator } from '../middleware/validate.js';
import { computeCardPosition } from '../services/positions.js';

const { cards, columns } = schema;

export const cardsRoute = new Hono()
  .post('/', zValidator('json', CreateCardInputSchema), (c) => {
    const input = c.req.valid('json');

    const column = db.select({ id: columns.id }).from(columns).where(eq(columns.id, input.columnId)).get();
    if (!column) throw new HTTPException(404, { message: 'column not found' });

    const [inserted] = db.insert(cards).values(input).returning().all();
    if (!inserted) throw new HTTPException(500, { message: 'insert failed' });

    return c.json(CardSchema.parse(inserted), 201);
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

      const position = computeCardPosition(tx, card.columnId, input.beforeCardId, input.afterCardId);

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

      const target = tx
        .select({ id: columns.id })
        .from(columns)
        .where(eq(columns.id, input.toColumnId))
        .get();
      if (!target) throw new HTTPException(404, { message: 'target column not found' });

      const position = computeCardPosition(tx, input.toColumnId, input.beforeCardId, input.afterCardId);

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
