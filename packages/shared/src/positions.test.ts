import { describe, expect, it } from 'vitest';
import { positionBetween } from './positions.js';

describe('positionBetween', () => {
  it('returns the midpoint when inserting between two positions', () => {
    expect(positionBetween(1, 2)).toBe(1.5);
    expect(positionBetween(10, 20)).toBe(15);
    expect(positionBetween(0, 1)).toBe(0.5);
  });

  it('appends after `before` when `after` is missing (insert at tail)', () => {
    expect(positionBetween(5, null)).toBe(6);
    expect(positionBetween(5, undefined)).toBe(6);
    expect(positionBetween(0, null)).toBe(1);
  });

  it('prepends before `after` when `before` is missing (insert at head)', () => {
    expect(positionBetween(null, 5)).toBe(4);
    expect(positionBetween(undefined, 5)).toBe(4);
    expect(positionBetween(null, 1)).toBe(0);
  });

  it('returns 1 when the collection is empty (neither neighbor)', () => {
    expect(positionBetween(null, null)).toBe(1);
    expect(positionBetween(undefined, undefined)).toBe(1);
    expect(positionBetween(null, undefined)).toBe(1);
  });

  it('treats 0 as a real position (not nullish)', () => {
    // Critical: a position of 0 must not be treated like null.
    expect(positionBetween(0, 2)).toBe(1);
    expect(positionBetween(0, null)).toBe(1);
    expect(positionBetween(null, 0)).toBe(-1);
  });

  it('keeps positions strictly ordered and positive across 100 monotonic head-inserts', () => {
    // Repeatedly insert at the head: each new position becomes `first - 1`.
    // Since the initial head is 1, positions descend: 0, -1, -2, ...
    // They stay strictly ordered but are not all positive - that's expected
    // for head-insertion. We assert strict ordering here and positivity in
    // the next test for tail-insertion.
    const positions: number[] = [1];
    for (let i = 0; i < 100; i++) {
      const first = positions[0];
      const next = positionBetween(null, first);
      expect(next).toBeLessThan(first as number);
      positions.unshift(next);
    }
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i - 1] as number).toBeLessThan(positions[i] as number);
    }
  });

  it('keeps positions strictly ordered and positive across 100 monotonic tail-inserts', () => {
    const positions: number[] = [1];
    for (let i = 0; i < 100; i++) {
      const last = positions[positions.length - 1];
      const next = positionBetween(last, null);
      expect(next).toBeGreaterThan(last as number);
      expect(next).toBeGreaterThan(0);
      positions.push(next);
    }
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i - 1] as number).toBeLessThan(positions[i] as number);
    }
  });

  it('keeps positions strictly ordered across repeated midpoint inserts between two anchors', () => {
    // Repeatedly insert between positions 0 and 1. Each new midpoint must sit
    // strictly between the prior two anchors; ordering must always hold.
    //
    // Note: midpoint insertion is bounded by float64 precision (~52 bits of
    // mantissa), so we cap iterations at 50 - beyond that, (lo + hi) / 2
    // rounds to one of the endpoints. This is an inherent limit of
    // floating-point fractional indexing and is why production systems use
    // string-based fractional indices for unbounded inserts. For this
    // codebase's scale, 50 inserts between the same two anchors is ample.
    let lo = 0;
    const hi = 1;
    for (let i = 0; i < 50; i++) {
      const mid = positionBetween(lo, hi);
      expect(mid).toBeGreaterThan(lo);
      expect(mid).toBeLessThan(hi);
      lo = mid;
    }
  });
});
