import { positionBetween, schema } from '@ravenna/shared';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { DB } from '../db/index.js';

const { cards, columns, subtasks } = schema;

type Tx = DB | Parameters<Parameters<DB['transaction']>[0]>[0];

export function computeCardPosition(
  tx: Tx,
  columnId: string,
  beforeCardId: string | null | undefined,
  afterCardId: string | null | undefined,
): number {
  const lookup = (id: string) =>
    tx
      .select({ position: cards.position, columnId: cards.columnId })
      .from(cards)
      .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
      .get();

  const before = beforeCardId ? lookup(beforeCardId) : null;
  const after = afterCardId ? lookup(afterCardId) : null;

  if (before && before.columnId !== columnId) {
    throw new Error(`beforeCardId ${beforeCardId} is not in column ${columnId}`);
  }
  if (after && after.columnId !== columnId) {
    throw new Error(`afterCardId ${afterCardId} is not in column ${columnId}`);
  }

  return positionBetween(before?.position, after?.position);
}

export function appendCardPosition(tx: Tx, columnId: string): number {
  const last = tx
    .select({ position: cards.position })
    .from(cards)
    .where(and(eq(cards.columnId, columnId), isNull(cards.deletedAt)))
    .orderBy(desc(cards.position))
    .limit(1)
    .get();
  return last ? last.position + 1 : 1;
}

export function computeColumnPosition(
  tx: Tx,
  boardId: string,
  beforeColumnId: string | null | undefined,
  afterColumnId: string | null | undefined,
): number {
  const lookup = (id: string) =>
    tx
      .select({ position: columns.position, boardId: columns.boardId })
      .from(columns)
      .where(eq(columns.id, id))
      .get();

  const before = beforeColumnId ? lookup(beforeColumnId) : null;
  const after = afterColumnId ? lookup(afterColumnId) : null;

  if (before && before.boardId !== boardId) {
    throw new Error(`beforeColumnId ${beforeColumnId} is not in board ${boardId}`);
  }
  if (after && after.boardId !== boardId) {
    throw new Error(`afterColumnId ${afterColumnId} is not in board ${boardId}`);
  }

  return positionBetween(before?.position, after?.position);
}

export function appendColumnPosition(tx: Tx, boardId: string): number {
  const last = tx
    .select({ position: columns.position })
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(desc(columns.position))
    .limit(1)
    .get();
  return last ? last.position + 1 : 1;
}

export function appendSubtaskPosition(tx: Tx, cardId: string): number {
  const last = tx
    .select({ position: subtasks.position })
    .from(subtasks)
    .where(eq(subtasks.cardId, cardId))
    .orderBy(desc(subtasks.position))
    .limit(1)
    .get();
  return last ? last.position + 1 : 1;
}
