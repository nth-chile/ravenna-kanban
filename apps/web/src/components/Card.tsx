import type { CardWithRelations } from '@ravenna/shared';

type Props = {
  card: CardWithRelations;
  onClick: () => void;
};

function snippet(text: string, max = 140): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function Card({ card, onClick }: Props) {
  const doneSubtasks = card.subtasks.filter((s) => s.done).length;
  const totalSubtasks = card.subtasks.length;
  const commentCount = card.comments.length;
  const description = card.description.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full cursor-pointer rounded-lg border border-border bg-surface p-3 text-left shadow-sm transition hover:border-fg-muted/50 hover:shadow focus:outline-none focus:ring-2 focus:ring-accent"
    >
      <h3 className="text-sm font-medium leading-snug text-fg">{card.title}</h3>

      {description.length > 0 && (
        <p className="mt-1 text-xs leading-relaxed text-fg-muted">{snippet(description)}</p>
      )}

      {card.tags.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <li
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-bg/60 px-2 py-0.5 text-[11px] font-medium text-fg"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </li>
          ))}
        </ul>
      )}

      {(totalSubtasks > 0 || commentCount > 0) && (
        <div className="mt-3 flex items-center gap-3 text-xs text-fg-muted">
          {totalSubtasks > 0 && (
            <span
              className="inline-flex items-center gap-1"
              aria-label={`${doneSubtasks} of ${totalSubtasks} subtasks done`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <path d="M5 8.5l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {doneSubtasks}/{totalSubtasks}
            </span>
          )}
          {commentCount > 0 && (
            <span
              className="inline-flex items-center gap-1"
              aria-label={`${commentCount} comment${commentCount === 1 ? '' : 's'}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M3 4.5A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5v5A1.5 1.5 0 0 1 11.5 11H7l-3 2.5V11h-.5A.5.5 0 0 1 3 10.5z"
                  strokeLinejoin="round"
                />
              </svg>
              {commentCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
