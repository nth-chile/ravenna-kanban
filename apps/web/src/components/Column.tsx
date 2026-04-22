import type { CardWithRelations, ColumnWithCards } from '@ravenna/shared';
import { AddCardInline } from './AddCardInline.js';
import { Card } from './Card.js';

type Props = {
  column: ColumnWithCards;
  onSelectCard: (card: CardWithRelations) => void;
};

export function Column({ column, onSelectCard }: Props) {
  const count = column.cards.length;

  return (
    <section
      className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-bg/60"
      aria-label={`Column ${column.name}`}
    >
      <header className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-fg">{column.name}</h2>
        <span
          className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full border border-border bg-surface px-1.5 py-0.5 text-xs font-medium text-fg-muted"
          aria-label={`${count} card${count === 1 ? '' : 's'}`}
        >
          {count}
        </span>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {count === 0
          ? null
          : column.cards.map((card) => (
              <Card key={card.id} card={card} onClick={() => onSelectCard(card)} />
            ))}
        <AddCardInline columnId={column.id} />
      </div>
    </section>
  );
}
