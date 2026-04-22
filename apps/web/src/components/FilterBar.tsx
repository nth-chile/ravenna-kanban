import type { Tag } from '@ravenna/shared';

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
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-6 py-2">
      <div className="relative">
        <input
          type="search"
          value={filter.q}
          onChange={(e) => onChange({ ...filter, q: e.target.value })}
          placeholder="Search cards…"
          aria-label="Search cards"
          className="w-56 rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:border-fg-muted focus:outline-none"
        />
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
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                    on
                      ? 'border-accent bg-accent/10 text-fg'
                      : 'border-border bg-bg/60 text-fg-muted hover:text-fg'
                  }`}
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

      {active && (
        <button
          type="button"
          onClick={() => onChange(emptyFilter)}
          className="ml-auto rounded px-2 py-1 text-xs text-fg-muted hover:text-fg"
        >
          Clear
        </button>
      )}
    </div>
  );
}
