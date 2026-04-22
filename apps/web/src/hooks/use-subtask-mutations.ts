import type { CreateSubtaskInput, Subtask, UpdateSubtaskInput } from '@ravenna/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { boardQueryKey } from './use-board.js';

export function useCreateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubtaskInput) =>
      api<Subtask>('/subtasks', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}

export function useUpdateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubtaskInput }) =>
      api<Subtask>(`/subtasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}

export function useDeleteSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ ok: true }>(`/subtasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}
