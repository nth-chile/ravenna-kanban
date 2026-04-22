import { cn } from '../lib/utils.js';

export type GroupBy = 'none' | 'tag';

type Props = {
  value: GroupBy;
  onChange: (g: GroupBy) => void;
};

const OPTIONS: Array<{ value: GroupBy; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'tag', label: 'Tag' },
];

export function GroupBySelect({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="hidden text-xs text-fg-muted sm:inline">Group by</span>
      <div className="inline-flex h-8 items-center rounded-full border border-border bg-surface p-0.5">
        {OPTIONS.map((opt) => {
          const on = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(opt.value)}
              className={cn(
                'inline-flex h-full items-center rounded-full px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                on ? 'bg-accent/15 text-fg' : 'text-fg-muted hover:text-fg',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
