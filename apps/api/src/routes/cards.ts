import { CardSchema, CreateCardInputSchema, UpdateCardInputSchema, schema } from '@ravenna/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { zValidator } from '../middleware/validate.js';

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
  });
