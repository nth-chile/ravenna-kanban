import { schema } from '@ravenna/shared';
import { and, eq, isNull } from 'drizzle-orm';
import type { DB } from '../db/index.js';

const { cards } = schema;

type Tx = DB | Parameters<Parameters<DB['transaction']>[0]>[0];

/**
 * Compute a fractional position for a card being inserted into `columnId`.
 * Pass the ids of the card that will end up directly before/after the drop slot.
 * Pass neither for an empty column.
 */
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

  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + 1;
  if (after) return after.position - 1;
  return 1;
}
