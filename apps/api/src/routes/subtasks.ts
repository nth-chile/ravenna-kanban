import {
  CreateSubtaskInputSchema,
  SubtaskSchema,
  UpdateSubtaskInputSchema,
  schema,
} from '@ravenna/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { zValidator } from '../middleware/validate.js';
import { appendSubtaskPosition } from '../services/positions.js';

const { cards, subtasks } = schema;

export const subtasksRoute = new Hono()
  .post('/', zValidator('json', CreateSubtaskInputSchema), (c) => {
    const input = c.req.valid('json');

    const result = db.transaction((tx) => {
      const card = tx
        .select({ id: cards.id })
        .from(cards)
        .where(and(eq(cards.id, input.cardId), isNull(cards.deletedAt)))
        .get();
      if (!card) throw new HTTPException(404, { message: 'card not found' });

      const position = appendSubtaskPosition(tx, input.cardId);
      const [inserted] = tx
        .insert(subtasks)
        .values({ ...input, position })
        .returning()
        .all();
      return inserted;
    });

    if (!result) throw new HTTPException(500, { message: 'insert failed' });
    return c.json(SubtaskSchema.parse(result), 201);
  })
  .patch('/:id', zValidator('json', UpdateSubtaskInputSchema), (c) => {
    const id = c.req.param('id');
    const input = c.req.valid('json');

    const [updated] = db.update(subtasks).set(input).where(eq(subtasks.id, id)).returning().all();
    if (!updated) throw new HTTPException(404, { message: 'subtask not found' });

    return c.json(SubtaskSchema.parse(updated));
  })
  .delete('/:id', (c) => {
    const id = c.req.param('id');

    const [deleted] = db.delete(subtasks).where(eq(subtasks.id, id)).returning().all();
    if (!deleted) throw new HTTPException(404, { message: 'subtask not found' });

    return c.json({ ok: true });
  });
