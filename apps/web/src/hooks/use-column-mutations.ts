import type { BoardResponse, Column, ReorderColumnInput } from '@ravenna/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { boardQueryKey } from './use-board.js';

function reorderColumnInBoard(
  board: BoardResponse,
  columnId: string,
  beforeColumnId: string | null | undefined,
  afterColumnId: string | null | undefined,
): BoardResponse {
  const columns = [...board.columns];
  const fromIdx = columns.findIndex((c) => c.id === columnId);
  if (fromIdx === -1) return board;
  const [moved] = columns.splice(fromIdx, 1);
  if (!moved) return board;

  let insertIdx = columns.length;
  if (beforeColumnId) {
    const i = columns.findIndex((c) => c.id === beforeColumnId);
    if (i >= 0) insertIdx = i + 1;
  } else if (afterColumnId) {
    const i = columns.findIndex((c) => c.id === afterColumnId);
    if (i >= 0) insertIdx = i;
  }
  columns.splice(insertIdx, 0, moved);
  return { ...board, columns };
}

export function useReorderColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReorderColumnInput }) =>
      api<Column>(`/columns/${id}/reorder`, { method: 'POST', body: JSON.stringify(input) }),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: boardQueryKey });
      const previous = qc.getQueryData<BoardResponse>(boardQueryKey);
      if (previous) {
        qc.setQueryData<BoardResponse>(
          boardQueryKey,
          reorderColumnInBoard(previous, id, input.beforeColumnId, input.afterColumnId),
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
