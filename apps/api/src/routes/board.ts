import { BoardResponseSchema } from '@ravenna/shared';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';

export const boardRoute = new Hono().get('/', async (c) => {
  const board = await db.query.boards.findFirst({
    orderBy: (b, { asc }) => [asc(b.createdAt)],
    with: {
      tags: true,
      columns: {
        orderBy: (col, { asc }) => [asc(col.position)],
        with: {
          cards: {
            where: (card, { isNull }) => isNull(card.deletedAt),
            orderBy: (card, { asc }) => [asc(card.position)],
            with: {
              cardTags: { with: { tag: true } },
              subtasks: { orderBy: (s, { asc }) => [asc(s.position)] },
              comments: { orderBy: (cm, { asc }) => [asc(cm.createdAt)] },
            },
          },
        },
      },
    },
  });

  if (!board) {
    throw new HTTPException(404, { message: 'no board found' });
  }

  const response = {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      cards: col.cards.map(({ cardTags, ...card }) => ({
        ...card,
        tags: cardTags.map((ct) => ct.tag),
      })),
    })),
  };

  return c.json(BoardResponseSchema.parse(response));
});
