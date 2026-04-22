import type { ColumnWithCards } from '@ravenna/shared';
import { Card } from './Card.js';

type Props = {
  column: ColumnWithCards;
};

export function Column({ column }: Props) {
  const count = column.cards.length;

  return (
    <section
      className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50/80"
      aria-label={`Column ${column.name}`}
    >
      <header className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-slate-800">{column.name}</h2>
        <span
          className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600"
          aria-label={`${count} card${count === 1 ? '' : 's'}`}
        >
          {count}
        </span>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {count === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No cards</p>
        ) : (
          column.cards.map((card) => <Card key={card.id} card={card} />)
        )}
      </div>
    </section>
  );
}
