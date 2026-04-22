import type { CardWithRelations } from '@ravenna/shared';
import { useState } from 'react';
import { useBoard } from '../hooks/use-board.js';
import { ApiError } from '../lib/api.js';
import { CardModal } from './CardModal.js';
import { Column } from './Column.js';
import { ThemeToggle } from './ThemeToggle.js';

export function Board() {
  const { data, isPending, isError, error, refetch, isFetching } = useBoard();
  const [selected, setSelected] = useState<CardWithRelations | null>(null);

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <p className="text-sm text-fg-muted">Loading board…</p>
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown error';
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="max-w-sm rounded-lg border border-danger/40 bg-surface p-4 text-center">
          <p className="text-sm font-medium text-danger">Couldn’t load board</p>
          <p className="mt-1 text-xs text-fg-muted">{message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center rounded-md border border-danger/40 bg-surface px-3 py-1.5 text-xs font-medium text-danger shadow-sm transition hover:bg-danger/10"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const columns = data.columns;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div>
          <h1 className="text-base font-semibold text-fg">{data.name}</h1>
          <p className="text-xs text-fg-muted">
            {columns.length} column{columns.length === 1 ? '' : 's'}
            {isFetching ? ' · refreshing…' : ''}
          </p>
        </div>
        <ThemeToggle />
      </header>

      {columns.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-12">
          <p className="text-sm text-fg-muted">This board has no columns yet.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full min-w-max items-start gap-4 p-6">
            {columns.map((column) => (
              <Column key={column.id} column={column} onSelectCard={setSelected} />
            ))}
          </div>
        </div>
      )}

      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
