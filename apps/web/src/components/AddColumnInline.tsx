import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCreateColumn } from '../hooks/use-column-mutations.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';

type Props = { boardId: string };

export function AddColumnInline({ boardId }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreateColumn();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await create.mutateAsync({ boardId, name: trimmed });
    setName('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-[85vw] max-w-[22rem] shrink-0 snap-start items-center justify-center gap-1 rounded-md border border-dashed border-border bg-transparent px-3 text-sm text-fg-muted transition hover:border-fg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-72 sm:max-w-none"
      >
        <Plus className="h-3.5 w-3.5" /> Add column
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-[85vw] max-w-[22rem] shrink-0 snap-start flex-col gap-2 rounded-md border border-border bg-bg/60 p-3 sm:w-72 sm:max-w-none"
    >
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setName('');
          }
        }}
        placeholder="Column name"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={create.isPending || !name.trim()}>
          {create.isPending ? 'Adding…' : 'Add'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setName('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
