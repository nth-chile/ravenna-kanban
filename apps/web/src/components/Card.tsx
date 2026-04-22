import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardWithRelations } from '@ravenna/shared';
import { CheckSquare, MessageSquare } from 'lucide-react';
import { Badge } from './ui/badge.js';

type Props = {
  card: CardWithRelations;
  onClick: () => void;
  readOnly?: boolean;
};

function snippet(text: string, max = 140): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function Card({ card, onClick, readOnly = false }: Props) {
  const doneSubtasks = card.subtasks.filter((s) => s.done).length;
  const totalSubtasks = card.subtasks.length;
  const commentCount = card.comments.length;
  const description = card.description.trim();

  if (readOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-card-id={card.id}
        className="block w-full rounded-md border border-border bg-surface p-3 text-left shadow-sm transition hover:border-fg-muted/50 hover:shadow focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent"
      >
        <CardBody
          card={card}
          description={description}
          doneSubtasks={doneSubtasks}
          totalSubtasks={totalSubtasks}
          commentCount={commentCount}
        />
      </button>
    );
  }

  return (
    <SortableCard
      card={card}
      onClick={onClick}
      description={description}
      doneSubtasks={doneSubtasks}
      totalSubtasks={totalSubtasks}
      commentCount={commentCount}
    />
  );
}

type CardBodyProps = {
  card: CardWithRelations;
  description: string;
  doneSubtasks: number;
  totalSubtasks: number;
  commentCount: number;
};

function SortableCard({
  card,
  onClick,
  description,
  doneSubtasks,
  totalSubtasks,
  commentCount,
}: CardBodyProps & { onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId: card.columnId },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      type="button"
      onClick={onClick}
      data-card-id={card.id}
      className="block w-full cursor-grab touch-none rounded-md border border-border bg-surface p-3 text-left shadow-sm transition hover:border-fg-muted/50 hover:shadow focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent active:cursor-grabbing"
    >
      <CardBody
        card={card}
        description={description}
        doneSubtasks={doneSubtasks}
        totalSubtasks={totalSubtasks}
        commentCount={commentCount}
      />
    </button>
  );
}

function CardBody({ card, description, doneSubtasks, totalSubtasks, commentCount }: CardBodyProps) {
  return (
    <>
      <h3 className="text-sm font-medium leading-snug text-fg">{card.title}</h3>

      {description.length > 0 && (
        <p className="mt-1 text-xs leading-relaxed text-fg-muted">{snippet(description)}</p>
      )}

      {card.tags.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <li key={tag.id}>
              <Badge>
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </Badge>
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
              <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {doneSubtasks}/{totalSubtasks}
            </span>
          )}
          {commentCount > 0 && (
            <span
              className="inline-flex items-center gap-1"
              aria-label={`${commentCount} comment${commentCount === 1 ? '' : 's'}`}
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {commentCount}
            </span>
          )}
        </div>
      )}
    </>
  );
}
