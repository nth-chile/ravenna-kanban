import {
  ColumnSchema,
  CreateColumnInputSchema,
  ReorderColumnInputSchema,
  UpdateColumnInputSchema,
  schema,
} from '@ravenna/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { zValidator } from '../middleware/validate.js';
import { appendColumnPosition, computeColumnPosition } from '../services/positions.js';

const { boards, columns } = schema;

export const columnsRoute = new Hono()
  .post('/', zValidator('json', CreateColumnInputSchema), (c) => {
    const input = c.req.valid('json');

    const result = db.transaction((tx) => {
      const board = tx
        .select({ id: boards.id })
        .from(boards)
        .where(eq(boards.id, input.boardId))
        .get();
      if (!board) throw new HTTPException(404, { message: 'board not found' });

      const position = appendColumnPosition(tx, input.boardId);
      const [inserted] = tx
        .insert(columns)
        .values({ ...input, position })
        .returning()
        .all();
      return inserted;
    });

    if (!result) throw new HTTPException(500, { message: 'insert failed' });
    return c.json(ColumnSchema.parse(result), 201);
  })
  .patch('/:id', zValidator('json', UpdateColumnInputSchema), (c) => {
    const id = c.req.param('id');
    const input = c.req.valid('json');

    const [updated] = db.update(columns).set(input).where(eq(columns.id, id)).returning().all();
    if (!updated) throw new HTTPException(404, { message: 'column not found' });

    return c.json(ColumnSchema.parse(updated));
  })
  .delete('/:id', (c) => {
    const id = c.req.param('id');

    const [deleted] = db.delete(columns).where(eq(columns.id, id)).returning().all();
    if (!deleted) throw new HTTPException(404, { message: 'column not found' });

    return c.json({ ok: true });
  })
  .post('/:id/reorder', zValidator('json', ReorderColumnInputSchema), (c) => {
    const id = c.req.param('id');
    const input = c.req.valid('json');

    const result = db.transaction((tx) => {
      const column = tx.select().from(columns).where(eq(columns.id, id)).get();
      if (!column) throw new HTTPException(404, { message: 'column not found' });

      const position = computeColumnPosition(
        tx,
        column.boardId,
        input.beforeColumnId,
        input.afterColumnId,
      );
      const [updated] = tx
        .update(columns)
        .set({ position })
        .where(eq(columns.id, id))
        .returning()
        .all();
      return updated;
    });

    if (!result) throw new HTTPException(500, { message: 'reorder failed' });
    return c.json(ColumnSchema.parse(result));
  });
