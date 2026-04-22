import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCreateCard } from '../hooks/use-card-mutations.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';

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
        className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-border px-3 py-2 text-sm text-fg-muted transition hover:border-fg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Plus className="h-3.5 w-3.5" /> Add card
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <Input
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
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={create.isPending || !title.trim()}>
          {create.isPending ? 'Adding…' : 'Add'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setTitle('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
