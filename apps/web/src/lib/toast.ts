import { useSyncExternalStore } from 'react';

export type Toast = {
  id: string;
  message: string;
  undo?: () => unknown;
};

const DEFAULT_TTL_MS = 6000;

let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function toast(message: string, undo?: Toast['undo']): string {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, message, undo }];
  emit();
  setTimeout(() => dismiss(id), DEFAULT_TTL_MS);
  return id;
}

export function dismiss(id: string): void {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    subscribe,
    () => toasts,
    () => toasts,
  );
}
