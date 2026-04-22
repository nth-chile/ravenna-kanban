import type { BoardResponse } from '@ravenna/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export const boardQueryKey = ['board'] as const;

export function useBoard() {
  return useQuery({
    queryKey: boardQueryKey,
    queryFn: () => api<BoardResponse>('/board'),
  });
}
