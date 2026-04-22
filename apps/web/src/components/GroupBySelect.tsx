import { cn } from '../lib/utils.js';
import { badgeVariants } from './ui/badge.js';

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
      <span className="text-xs text-fg-muted">Group by</span>
      <div className="inline-flex overflow-hidden rounded-full border border-border">
        {OPTIONS.map((opt) => {
          const on = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(opt.value)}
              className={cn(
                badgeVariants({ variant: on ? 'accent' : 'outline', interactive: true }),
                'rounded-none border-0',
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
