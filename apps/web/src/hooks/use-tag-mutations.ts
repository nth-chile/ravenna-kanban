import type { CreateTagInput, Tag } from '@ravenna/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { boardQueryKey } from './use-board.js';

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTagInput) =>
      api<Tag>('/tags', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ ok: true }>(`/tags/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}

export function useAttachTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: string; tagId: string }) =>
      api<{ ok: true }>(`/cards/${cardId}/tags/${tagId}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}

export function useDetachTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: string; tagId: string }) =>
      api<{ ok: true }>(`/cards/${cardId}/tags/${tagId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardQueryKey }),
  });
}
