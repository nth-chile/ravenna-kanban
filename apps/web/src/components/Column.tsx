import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardWithRelations, ColumnWithCards } from '@ravenna/shared';
import { AddCardInline } from './AddCardInline.js';
import { Card } from './Card.js';

type Props = {
  column: ColumnWithCards;
  onSelectCard: (card: CardWithRelations) => void;
};

export function Column({ column, onSelectCard }: Props) {
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
      className={`flex h-full w-72 shrink-0 flex-col rounded-xl border bg-bg/60 transition-colors ${
        isOver ? 'border-accent/50' : 'border-border'
      }`}
      aria-label={`Column ${column.name}`}
    >
      <header
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center justify-between px-3 pt-3 pb-2 active:cursor-grabbing"
      >
        <h2 className="text-sm font-semibold text-fg">{column.name}</h2>
        <span
          className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full border border-border bg-surface px-1.5 py-0.5 text-xs font-medium text-fg-muted"
          aria-label={`${count} card${count === 1 ? '' : 's'}`}
        >
          {count}
        </span>
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
