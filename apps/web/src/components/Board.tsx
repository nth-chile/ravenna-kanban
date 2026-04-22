import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { BoardResponse } from '@ravenna/shared';
import { useState } from 'react';
import { useBoard } from '../hooks/use-board.js';
import { useMoveCard, useReorderCard } from '../hooks/use-card-mutations.js';
import { ApiError } from '../lib/api.js';
import { CardModal } from './CardModal.js';
import { Column } from './Column.js';
import { ThemeToggle } from './ThemeToggle.js';

export function Board() {
  const { data, isPending, isError, error, refetch, isFetching } = useBoard();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reorderCard = useReorderCard();
  const moveCard = useMoveCard();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
  const selected = selectedId
    ? (columns.flatMap((c) => c.cards).find((c) => c.id === selectedId) ?? null)
    : null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as { type?: string; columnId?: string } | undefined;
    const overData = over.data.current as { type?: string; columnId?: string } | undefined;
    if (activeData?.type !== 'card') return;

    const activeCardId = String(active.id);
    const activeColumnId = activeData.columnId;
    if (!activeColumnId) return;

    const board = data as BoardResponse;

    if (overData?.type === 'card') {
      const overCardId = String(over.id);
      const overColumnId = overData.columnId;
      if (!overColumnId) return;

      if (overColumnId === activeColumnId) {
        const col = board.columns.find((c) => c.id === activeColumnId);
        if (!col) return;
        const oldIdx = col.cards.findIndex((c) => c.id === activeCardId);
        const newIdx = col.cards.findIndex((c) => c.id === overCardId);
        if (oldIdx === -1 || newIdx === -1) return;

        reorderCard.mutate({
          id: activeCardId,
          input: oldIdx < newIdx ? { beforeCardId: overCardId } : { afterCardId: overCardId },
        });
      } else {
        moveCard.mutate({
          id: activeCardId,
          input: { toColumnId: overColumnId, afterCardId: overCardId },
        });
      }
    } else if (overData?.type === 'column') {
      const targetColumnId = overData.columnId;
      if (!targetColumnId || targetColumnId === activeColumnId) return;
      const col = board.columns.find((c) => c.id === targetColumnId);
      const lastCard = col?.cards[col.cards.length - 1];
      moveCard.mutate({
        id: activeCardId,
        input: { toColumnId: targetColumnId, beforeCardId: lastCard?.id ?? null },
      });
    }
  }

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
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto">
            <div className="flex h-full min-w-max items-start gap-4 p-6">
              {columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onSelectCard={(card) => setSelectedId(card.id)}
                />
              ))}
            </div>
          </div>
        </DndContext>
      )}

      {selected && (
        <CardModal card={selected} allTags={data.tags} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
