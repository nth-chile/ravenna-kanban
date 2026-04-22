import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardWithRelations, ColumnWithCards, Tag } from '@ravenna/shared';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type RefObject, useRef } from 'react';
import { AddCardInline } from './AddCardInline.js';
import { Card } from './Card.js';
import { Badge } from './ui/badge.js';

const VIRTUALIZE_THRESHOLD = 100;

type Props = {
  column: ColumnWithCards;
  onSelectCard: (card: CardWithRelations) => void;
  readOnly?: boolean;
  groupByTag?: Tag[];
};

export function Column({ column, onSelectCard, readOnly = false, groupByTag }: Props) {
  const count = column.cards.length;

  if (readOnly) {
    return (
      <section
        className="flex h-full w-[85vw] max-w-[22rem] shrink-0 snap-start flex-col rounded-md border border-border bg-bg/60 sm:w-72 sm:max-w-none"
        aria-label={`Column ${column.name}`}
      >
        <header className="flex items-center justify-between px-3 pt-3 pb-2">
          <h2 className="text-sm font-semibold text-fg">{column.name}</h2>
          <Badge
            variant="outline"
            className="min-w-[1.5rem] justify-center"
            aria-label={`${count} card${count === 1 ? '' : 's'}`}
          >
            {count}
          </Badge>
        </header>
        <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
          {count === 0 ? (
            <p className="py-6 text-center text-xs text-fg-muted">No cards</p>
          ) : (
            column.cards.map((card) => (
              <Card key={card.id} card={card} onClick={() => onSelectCard(card)} readOnly />
            ))
          )}
        </div>
      </section>
    );
  }

  return <SortableColumn column={column} onSelectCard={onSelectCard} groupByTag={groupByTag} />;
}

function CardsByTag({
  cards,
  tags,
  onSelectCard,
}: {
  cards: CardWithRelations[];
  tags: Tag[];
  onSelectCard: (card: CardWithRelations) => void;
}) {
  const sections = tags
    .map((tag) => ({
      tag,
      cards: cards.filter((c) => c.tags.some((t) => t.id === tag.id)),
    }))
    .filter((s) => s.cards.length > 0);

  const untagged = cards.filter((c) => c.tags.length === 0);

  return (
    <>
      {sections.map(({ tag, cards: tagCards }) => (
        <section key={tag.id} aria-label={`${tag.name} cards`} className="space-y-2">
          <h3 className="sticky top-0 z-[1] -mx-3 flex items-center gap-1.5 bg-bg/80 px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
          </h3>
          {tagCards.map((card) => (
            <Card
              key={`${tag.id}-${card.id}`}
              card={card}
              onClick={() => onSelectCard(card)}
              readOnly
            />
          ))}
        </section>
      ))}
      {untagged.length > 0 && (
        <section aria-label="Untagged cards" className="space-y-2">
          <h3 className="sticky top-0 z-[1] -mx-3 bg-bg/80 px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur">
            Untagged
          </h3>
          {untagged.map((card) => (
            <Card
              key={`untagged-${card.id}`}
              card={card}
              onClick={() => onSelectCard(card)}
              readOnly
            />
          ))}
        </section>
      )}
    </>
  );
}

function SortableColumn({
  column,
  onSelectCard,
  groupByTag,
}: {
  column: ColumnWithCards;
  onSelectCard: (c: CardWithRelations) => void;
  groupByTag?: Tag[];
}) {
  const count = column.cards.length;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: column.id,
      data: { type: 'column', columnId: column.id },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualize = !groupByTag && count > VIRTUALIZE_THRESHOLD;

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`flex h-full w-[85vw] max-w-[22rem] shrink-0 snap-start flex-col rounded-md border bg-bg/60 transition-colors sm:w-72 sm:max-w-none ${
        isOver ? 'border-accent/50' : 'border-border'
      }`}
      aria-label={`Column ${column.name}`}
    >
      <header
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center justify-between rounded-t-md px-3 pt-3 pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent active:cursor-grabbing"
      >
        <h2 className="text-sm font-semibold text-fg">{column.name}</h2>
        <Badge
          variant="outline"
          className="min-w-[1.5rem] justify-center"
          aria-label={`${count} card${count === 1 ? '' : 's'}`}
        >
          {count}
        </Badge>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {groupByTag ? (
          count > 0 && (
            <CardsByTag cards={column.cards} tags={groupByTag} onSelectCard={onSelectCard} />
          )
        ) : virtualize ? (
          <VirtualCards cards={column.cards} scrollRef={scrollRef} onSelectCard={onSelectCard} />
        ) : (
          <SortableContext
            items={column.cards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {column.cards.map((card) => (
              <Card key={card.id} card={card} onClick={() => onSelectCard(card)} />
            ))}
          </SortableContext>
        )}
        <AddCardInline columnId={column.id} />
      </div>
    </section>
  );
}

function VirtualCards({
  cards,
  scrollRef,
  onSelectCard,
}: {
  cards: CardWithRelations[];
  scrollRef: RefObject<HTMLDivElement | null>;
  onSelectCard: (card: CardWithRelations) => void;
}) {
  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 96,
    overscan: 20,
    getItemKey: (index) => cards[index]!.id,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {items.map((vi) => {
          const card = cards[vi.index]!;
          return (
            <div
              key={card.id}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vi.start}px)`,
                paddingBottom: 8,
              }}
            >
              <Card card={card} onClick={() => onSelectCard(card)} />
            </div>
          );
        })}
      </div>
    </SortableContext>
  );
}
