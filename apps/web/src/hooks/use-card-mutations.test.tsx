import type { BoardResponse } from '@ravenna/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boardQueryKey } from './use-board.js';
import { useMoveCard } from './use-card-mutations.js';

function makeBoard(): BoardResponse {
  const now = new Date();
  return {
    id: 'b1',
    name: 'b',
    createdAt: now,
    tags: [],
    columns: [
      {
        id: 'col-a',
        boardId: 'b1',
        name: 'A',
        position: 1,
        createdAt: now,
        cards: [
          {
            id: 'card-1',
            columnId: 'col-a',
            title: 't',
            description: '',
            position: 1,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            tags: [],
            subtasks: [],
            comments: [],
          },
        ],
      },
      {
        id: 'col-b',
        boardId: 'b1',
        name: 'B',
        position: 2,
        createdAt: now,
        cards: [],
      },
    ],
  };
}

function findCardColumn(board: BoardResponse | undefined, cardId: string): string | undefined {
  if (!board) return undefined;
  for (const col of board.columns) {
    if (col.cards.some((c) => c.id === cardId)) return col.id;
  }
  return undefined;
}

describe('useMoveCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('optimistically moves the card, then rolls back on server error', async () => {
    // Use a non-zero gcTime so the board data we seed isn't garbage-collected
    // before the mutation runs (there's no active observer for the query here).
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 5 * 60_000, staleTime: Number.POSITIVE_INFINITY },
        mutations: { retry: false },
      },
    });
    const initial = makeBoard();
    qc.setQueryData<BoardResponse>(boardQueryKey, initial);

    // Respond with 500 to trigger onError; block resolution until we release it
    // so we can observe the optimistic state before the error path runs.
    let resolveFetch: (value: Response) => void = () => {};
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const mockFetch = vi.fn(() => fetchPromise);
    vi.stubGlobal('fetch', mockFetch);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useMoveCard(), { wrapper });

    result.current.mutate({
      id: 'card-1',
      input: { toColumnId: 'col-b' },
    });

    // Optimistic update: card-1 should be in col-b while the fetch is still pending.
    await waitFor(() => {
      const state = qc.getQueryData<BoardResponse>(boardQueryKey);
      expect(findCardColumn(state, 'card-1')).toBe('col-b');
    });

    // Release the mocked fetch with a 500 response.
    resolveFetch(
      new Response(JSON.stringify({ error: { code: 'server_error', message: 'boom' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    // onError should restore the previous board state.
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    await waitFor(() => {
      const state = qc.getQueryData<BoardResponse>(boardQueryKey);
      expect(findCardColumn(state, 'card-1')).toBe('col-a');
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/cards/card-1/move');
    expect(init.method).toBe('POST');
  });
});
