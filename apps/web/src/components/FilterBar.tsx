import type { Tag } from '@ravenna/shared';
import { badgeVariants } from './ui/badge.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';

export type Filter = {
  q: string;
  tagIds: string[];
};

export const emptyFilter: Filter = { q: '', tagIds: [] };

export function isFilterActive(f: Filter): boolean {
  return f.q.trim().length > 0 || f.tagIds.length > 0;
}

type Props = {
  tags: Tag[];
  filter: Filter;
  onChange: (f: Filter) => void;
};

export function FilterBar({ tags, filter, onChange }: Props) {
  const toggleTag = (id: string) => {
    const set = new Set(filter.tagIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...filter, tagIds: [...set] });
  };

  const active = isFilterActive(filter);

  return (
    <div className="flex flex-col gap-2 border-b border-border bg-surface px-6 py-2">
      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-56">
          <Input
            type="search"
            value={filter.q}
            onChange={(e) => onChange({ ...filter, q: e.target.value })}
            placeholder="Search cards…"
            aria-label="Search cards"
          />
        </div>

        {active && (
          <Button variant="ghost" onClick={() => onChange(emptyFilter)} className="ml-auto">
            Clear
          </Button>
        )}
      </div>

      {tags.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1">
          {tags.map((tag) => {
            const on = filter.tagIds.includes(tag.id);
            return (
              <li key={tag.id}>
                <button
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  aria-pressed={on}
                  className={badgeVariants({
                    variant: on ? 'accent' : 'outline',
                    interactive: true,
                  })}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
