import type { Card } from '@ravenna/shared';
import { useEffect, useRef, useState } from 'react';
import { useDeleteCard, useUpdateCard } from '../hooks/use-card-mutations.js';

type Props = {
  card: Card;
  onClose: () => void;
};

export function CardModal({ card, onClose }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const titleRef = useRef<HTMLInputElement>(null);
  const update = useUpdateCard();
  const del = useDeleteCard();

  useEffect(() => {
    titleRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function onSave() {
    const titleTrim = title.trim();
    if (!titleTrim) return;

    const input: { title?: string; description?: string } = {};
    if (titleTrim !== card.title) input.title = titleTrim;
    if (description !== card.description) input.description = description;

    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }

    await update.mutateAsync({ id: card.id, input });
    onClose();
  }

  async function onDelete() {
    if (!confirm(`Delete "${card.title}"?`)) return;
    await del.mutateAsync(card.id);
    onClose();
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape-to-close is wired on the document; click-outside is a mouse-only gesture.
    <dialog
      open
      aria-modal="true"
      aria-labelledby="card-modal-title"
      className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 p-4 text-fg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-xl">
        <h2 id="card-modal-title" className="sr-only">
          Edit card
        </h2>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-muted">
            Title
          </span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-base font-medium focus:border-fg-muted focus:outline-none"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-muted">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full resize-y rounded border border-border px-3 py-2 text-sm focus:border-fg-muted focus:outline-none"
          />
        </label>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onDelete}
            disabled={del.isPending}
            className="rounded px-3 py-1.5 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-sm text-fg-muted hover:bg-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={update.isPending || !title.trim()}
              className="rounded bg-accent px-3 py-1.5 text-sm text-accent-fg hover:opacity-90 disabled:opacity-50"
            >
              {update.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
