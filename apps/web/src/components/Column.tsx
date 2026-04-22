import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardWithRelations, ColumnWithCards } from '@ravenna/shared';
import { AddCardInline } from './AddCardInline.js';
import { Card } from './Card.js';
import { Badge } from './ui/badge.js';

type Props = {
  column: ColumnWithCards;
  onSelectCard: (card: CardWithRelations) => void;
  readOnly?: boolean;
};

export function Column({ column, onSelectCard, readOnly = false }: Props) {
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

  return <SortableColumn column={column} onSelectCard={onSelectCard} />;
}

function SortableColumn({
  column,
  onSelectCard,
}: { column: ColumnWithCards; onSelectCard: (c: CardWithRelations) => void }) {
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

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <Card key={card.id} card={card} onClick={() => onSelectCard(card)} />
          ))}
        </SortableContext>
        <AddCardInline columnId={column.id} />
      </div>
    </section>
  );
}
