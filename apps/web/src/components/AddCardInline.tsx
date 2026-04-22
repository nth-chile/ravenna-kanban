import { useEffect, useRef, useState } from 'react';
import { useCreateCard } from '../hooks/use-card-mutations.js';

export function AddCardInline({ columnId }: { columnId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreateCard();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await create.mutateAsync({ columnId, title: trimmed });
    setTitle('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded border border-dashed border-border px-3 py-2 text-sm text-fg-muted hover:border-fg-muted hover:text-fg"
      >
        + Add card
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setTitle('');
          }
        }}
        placeholder="Card title"
        className="rounded border border-border bg-surface px-2 py-1 text-sm text-fg focus:border-fg-muted focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={create.isPending || !title.trim()}
          className="rounded bg-accent px-3 py-1 text-sm text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          {create.isPending ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle('');
          }}
          className="rounded px-3 py-1 text-sm text-fg-muted hover:text-fg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
