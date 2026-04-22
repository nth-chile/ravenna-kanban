import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { BoardResponse, CardWithRelations, ColumnWithCards } from '@ravenna/shared';
import { useMemo, useState } from 'react';
import { useBoard } from '../hooks/use-board.js';
import { useMoveCard, useReorderCard } from '../hooks/use-card-mutations.js';
import { useReorderColumn } from '../hooks/use-column-mutations.js';
import { ApiError } from '../lib/api.js';
import { Card } from './Card.js';
import { CardModal } from './CardModal.js';
import { Column } from './Column.js';
import { type Filter, FilterBar, emptyFilter } from './FilterBar.js';
import { type GroupBy, GroupBySelect } from './GroupBySelect.js';
import { ThemeToggle } from './ThemeToggle.js';

function applyFilter(board: BoardResponse, filter: Filter): BoardResponse {
  const q = filter.q.trim().toLowerCase();
  const activeTags = new Set(filter.tagIds);

  return {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      cards: col.cards.filter((card) => {
        if (activeTags.size > 0 && !card.tags.some((t) => activeTags.has(t.id))) return false;
        if (q) {
          const haystack = `${card.title} ${card.description}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      }),
    })),
  };
}

export function Board() {
  const { data, isPending, isError, error, refetch, isFetching } = useBoard();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(emptyFilter);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [activeCard, setActiveCard] = useState<CardWithRelations | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnWithCards | null>(null);
  const reorderCard = useReorderCard();
  const moveCard = useMoveCard();
  const reorderColumn = useReorderColumn();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: ['Space'],
        cancel: ['Escape'],
        end: ['Space', 'Enter'],
      },
    }),
  );

  const visible = useMemo(() => (data ? applyFilter(data, filter) : null), [data, filter]);

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
        <div className="max-w-sm rounded-md border border-danger/40 bg-surface p-4 text-center">
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

  const filtered = visible ?? data;
  const columns = filtered.columns;
  const selected = selectedId
    ? (data.columns.flatMap((c) => c.cards).find((c) => c.id === selectedId) ?? null)
    : null;

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const activeData = active.data.current as { type?: string } | undefined;
    setActiveCard(null);
    setActiveColumn(null);

    if (activeData?.type === 'card') {
      const card = data?.columns.flatMap((c) => c.cards).find((c) => c.id === String(active.id));
      setActiveCard(card ?? null);
    } else if (activeData?.type === 'column') {
      const column = data?.columns.find((c) => c.id === String(active.id));
      setActiveColumn(column ?? null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    setActiveColumn(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as { type?: string; columnId?: string } | undefined;
    const overData = over.data.current as { type?: string; columnId?: string } | undefined;

    const board = data as BoardResponse;

    if (activeData?.type === 'column') {
      const overType = overData?.type;
      if (overType !== 'column' && overType !== 'card') return;
      const overColumnId = overType === 'column' ? String(over.id) : (overData?.columnId ?? null);
      if (!overColumnId || overColumnId === String(active.id)) return;

      const activeId = String(active.id);
      const oldIdx = board.columns.findIndex((c) => c.id === activeId);
      const newIdx = board.columns.findIndex((c) => c.id === overColumnId);
      if (oldIdx === -1 || newIdx === -1) return;

      // Remove the dragged column and compute the gap we're inserting into
      const remaining = board.columns.filter((c) => c.id !== activeId);
      const targetIdx = remaining.findIndex((c) => c.id === overColumnId);
      const insertIdx = oldIdx < newIdx ? targetIdx + 1 : targetIdx;
      const beforeCol = remaining[insertIdx - 1];
      const afterCol = remaining[insertIdx];

      reorderColumn.mutate({
        id: activeId,
        input: {
          beforeColumnId: beforeCol?.id ?? null,
          afterColumnId: afterCol?.id ?? null,
        },
      });
      return;
    }

    if (activeData?.type !== 'card') return;
    const activeCardId = String(active.id);
    const activeColumnId = activeData.columnId;
    if (!activeColumnId) return;

    if (overData?.type === 'card') {
      const overCardId = String(over.id);
      const overColumnId = overData.columnId;
      if (!overColumnId) return;

      const targetCol = board.columns.find((c) => c.id === overColumnId);
      if (!targetCol) return;

      if (overColumnId === activeColumnId) {
        const oldIdx = targetCol.cards.findIndex((c) => c.id === activeCardId);
        const newIdx = targetCol.cards.findIndex((c) => c.id === overCardId);
        if (oldIdx === -1 || newIdx === -1) return;

        const remaining = targetCol.cards.filter((c) => c.id !== activeCardId);
        const targetIdx = remaining.findIndex((c) => c.id === overCardId);
        const insertIdx = oldIdx < newIdx ? targetIdx + 1 : targetIdx;
        const beforeCard = remaining[insertIdx - 1];
        const afterCard = remaining[insertIdx];

        reorderCard.mutate({
          id: activeCardId,
          input: {
            beforeCardId: beforeCard?.id ?? null,
            afterCardId: afterCard?.id ?? null,
          },
        });
      } else {
        const activeRect = active.rect.current.translated;
        const overRect = over.rect;
        const activeCenter = activeRect ? activeRect.top + activeRect.height / 2 : 0;
        const overCenter = overRect.top + overRect.height / 2;
        const dropBelow = activeCenter > overCenter;

        const targetIdx = targetCol.cards.findIndex((c) => c.id === overCardId);
        const insertIdx = dropBelow ? targetIdx + 1 : targetIdx;
        const beforeCard = targetCol.cards[insertIdx - 1];
        const afterCard = targetCol.cards[insertIdx];

        moveCard.mutate({
          id: activeCardId,
          input: {
            toColumnId: overColumnId,
            beforeCardId: beforeCard?.id ?? null,
            afterCardId: afterCard?.id ?? null,
          },
        });
      }
    } else if (overData?.type === 'column') {
      const targetColumnId = String(over.id);
      if (!targetColumnId || targetColumnId === activeColumnId) return;
      const col = board.columns.find((c) => c.id === targetColumnId);
      const lastCard = col?.cards[col.cards.length - 1];
      moveCard.mutate({
        id: activeCardId,
        input: {
          toColumnId: targetColumnId,
          beforeCardId: lastCard?.id ?? null,
          afterCardId: null,
        },
      });
    }
  }

  const grouped = groupBy !== 'none';

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-fg">{data.name}</h1>
          <p className="text-xs text-fg-muted">
            {columns.length} column{columns.length === 1 ? '' : 's'}
            {grouped ? ' · grouped by tag' : ''}
            {isFetching ? ' · refreshing…' : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <GroupBySelect value={groupBy} onChange={setGroupBy} />
          <ThemeToggle />
        </div>
      </header>

      <FilterBar tags={data.tags} filter={filter} onChange={setFilter} />

      {data.columns.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-12">
          <p className="text-sm text-fg-muted">This board has no columns yet.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveCard(null);
            setActiveColumn(null);
          }}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex-1 snap-x snap-mandatory overflow-x-auto scroll-pl-6 sm:snap-none sm:scroll-pl-0">
              <div className="flex h-full min-w-max items-start gap-4 p-6">
                {columns.map((column) => (
                  <Column
                    key={column.id}
                    column={column}
                    onSelectCard={(card) => setSelectedId(card.id)}
                    groupByTag={grouped ? data.tags : undefined}
                  />
                ))}
              </div>
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeCard ? (
              <div className="rotate-2">
                <Card card={activeCard} onClick={() => undefined} readOnly />
              </div>
            ) : activeColumn ? (
              <div className="rotate-1">
                <Column column={activeColumn} onSelectCard={() => undefined} readOnly />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {selected && (
        <CardModal
          card={selected}
          allTags={data.tags}
          onClose={() => {
            const id = selected.id;
            setSelectedId(null);
            requestAnimationFrame(() => {
              const btn = document.querySelector<HTMLButtonElement>(`[data-card-id="${id}"]`);
              btn?.focus();
            });
          }}
        />
      )}
    </div>
  );
}
