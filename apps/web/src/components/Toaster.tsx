import { X } from 'lucide-react';
import { dismiss, useToasts } from '../lib/toast.js';

export function Toaster() {
  const toasts = useToasts();

  return (
    <section
      aria-label="Notifications"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <output
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg shadow-md"
        >
          <span className="flex-1 truncate">{t.message}</span>
          {t.undo && (
            <button
              type="button"
              onClick={() => {
                const fn = t.undo;
                dismiss(t.id);
                fn?.();
              }}
              className="shrink-0 rounded-sm text-xs font-medium text-accent underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-sm text-fg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </output>
      ))}
    </section>
  );
}
