import type {
  BoardResponse,
  Card,
  CreateCardInput,
  MoveCardInput,
  ReorderCardInput,
  UpdateCardInput,
} from '@ravenna/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { boardQueryKey } from './use-board.js';

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardInput) =>
      api<Card>('/cards', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCardInput }) =>
      api<Card>(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ ok: true }>(`/cards/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}

function moveCardInBoard(
  board: BoardResponse,
  cardId: string,
  toColumnId: string | null,
  beforeCardId: string | null | undefined,
  afterCardId: string | null | undefined,
): BoardResponse {
  let card: BoardResponse['columns'][number]['cards'][number] | undefined;
  for (const col of board.columns) {
    const match = col.cards.find((c) => c.id === cardId);
    if (match) {
      card = match;
      break;
    }
  }
  if (!card) return board;

  const targetColumnId = toColumnId ?? card.columnId;

  return {
    ...board,
    columns: board.columns.map((col) => {
      const filtered = col.cards.filter((c) => c.id !== cardId);
      if (col.id !== targetColumnId) return { ...col, cards: filtered };

      let insertIdx = filtered.length;
      if (beforeCardId) {
        const i = filtered.findIndex((c) => c.id === beforeCardId);
        if (i >= 0) insertIdx = i + 1;
      } else if (afterCardId) {
        const i = filtered.findIndex((c) => c.id === afterCardId);
        if (i >= 0) insertIdx = i;
      }
      const moved = { ...card, columnId: targetColumnId };
      return {
        ...col,
        cards: [...filtered.slice(0, insertIdx), moved, ...filtered.slice(insertIdx)],
      };
    }),
  };
}

export function useMoveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MoveCardInput }) =>
      api<Card>(`/cards/${id}/move`, { method: 'POST', body: JSON.stringify(input) }),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: boardQueryKey });
      const previous = qc.getQueryData<BoardResponse>(boardQueryKey);
      if (previous) {
        qc.setQueryData<BoardResponse>(
          boardQueryKey,
          moveCardInBoard(previous, id, input.toColumnId, input.beforeCardId, input.afterCardId),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(boardQueryKey, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}

export function useReorderCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReorderCardInput }) =>
      api<Card>(`/cards/${id}/reorder`, { method: 'POST', body: JSON.stringify(input) }),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: boardQueryKey });
      const previous = qc.getQueryData<BoardResponse>(boardQueryKey);
      if (previous) {
        qc.setQueryData<BoardResponse>(
          boardQueryKey,
          moveCardInBoard(previous, id, null, input.beforeCardId, input.afterCardId),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(boardQueryKey, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}
