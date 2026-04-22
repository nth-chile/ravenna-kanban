import { CommentSchema, CreateCommentInputSchema, schema } from '@ravenna/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { zValidator } from '../middleware/validate.js';

const { cards, comments } = schema;

export const commentsRoute = new Hono()
  .post('/', zValidator('json', CreateCommentInputSchema), (c) => {
    const input = c.req.valid('json');

    const result = db.transaction((tx) => {
      const card = tx
        .select({ id: cards.id })
        .from(cards)
        .where(and(eq(cards.id, input.cardId), isNull(cards.deletedAt)))
        .get();
      if (!card) throw new HTTPException(404, { message: 'card not found' });

      const [inserted] = tx.insert(comments).values(input).returning().all();
      return inserted;
    });

    if (!result) throw new HTTPException(500, { message: 'insert failed' });
    return c.json(CommentSchema.parse(result), 201);
  })
  .delete('/:id', (c) => {
    const id = c.req.param('id');

    const [deleted] = db.delete(comments).where(eq(comments.id, id)).returning().all();
    if (!deleted) throw new HTTPException(404, { message: 'comment not found' });

    return c.json({ ok: true });
  });
