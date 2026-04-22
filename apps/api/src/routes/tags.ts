import { CreateTagInputSchema, TagSchema, schema } from '@ravenna/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { zValidator } from '../middleware/validate.js';

const { boards, cardTags, cards, tags } = schema;

export const tagsRoute = new Hono()
  .post('/', zValidator('json', CreateTagInputSchema), (c) => {
    const input = c.req.valid('json');

    const result = db.transaction((tx) => {
      const board = tx
        .select({ id: boards.id })
        .from(boards)
        .where(eq(boards.id, input.boardId))
        .get();
      if (!board) throw new HTTPException(404, { message: 'board not found' });

      const [inserted] = tx.insert(tags).values(input).returning().all();
      return inserted;
    });

    if (!result) throw new HTTPException(500, { message: 'insert failed' });
    return c.json(TagSchema.parse(result), 201);
  })
  .delete('/:id', (c) => {
    const id = c.req.param('id');

    const [deleted] = db.delete(tags).where(eq(tags.id, id)).returning().all();
    if (!deleted) throw new HTTPException(404, { message: 'tag not found' });

    return c.json({ ok: true });
  });

export const cardTagsRoute = new Hono()
  .post('/:cardId/tags/:tagId', (c) => {
    const cardId = c.req.param('cardId');
    const tagId = c.req.param('tagId');

    db.transaction((tx) => {
      const card = tx
        .select({ id: cards.id, columnId: cards.columnId })
        .from(cards)
        .where(and(eq(cards.id, cardId), isNull(cards.deletedAt)))
        .get();
      if (!card) throw new HTTPException(404, { message: 'card not found' });

      const tag = tx.select({ id: tags.id }).from(tags).where(eq(tags.id, tagId)).get();
      if (!tag) throw new HTTPException(404, { message: 'tag not found' });

      tx.insert(cardTags).values({ cardId, tagId }).onConflictDoNothing().run();
    });

    return c.json({ ok: true });
  })
  .delete('/:cardId/tags/:tagId', (c) => {
    const cardId = c.req.param('cardId');
    const tagId = c.req.param('tagId');

    const [deleted] = db
      .delete(cardTags)
      .where(and(eq(cardTags.cardId, cardId), eq(cardTags.tagId, tagId)))
      .returning()
      .all();
    if (!deleted) throw new HTTPException(404, { message: 'card tag not found' });

    return c.json({ ok: true });
  });
