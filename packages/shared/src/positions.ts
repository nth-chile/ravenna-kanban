/**
 * Compute a fractional position between two neighbors.
 *
 * - Both neighbors: midpoint (allows unbounded inserts between two items).
 * - Only `before`: append after it (before + 1).
 * - Only `after`: prepend before it (after - 1).
 * - Neither: first item in an empty collection -> 1.
 */
export function positionBetween(
  before: number | null | undefined,
  after: number | null | undefined,
): number {
  if (before != null && after != null) return (before + after) / 2;
  if (before != null) return before + 1;
  if (after != null) return after - 1;
  return 1;
}
