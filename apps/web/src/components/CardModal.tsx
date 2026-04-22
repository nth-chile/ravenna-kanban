import type { CardWithRelations, Tag } from '@ravenna/shared';
import { Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDeleteCard, useUpdateCard } from '../hooks/use-card-mutations.js';
import { useCreateComment, useDeleteComment } from '../hooks/use-comment-mutations.js';
import {
  useCreateSubtask,
  useDeleteSubtask,
  useUpdateSubtask,
} from '../hooks/use-subtask-mutations.js';
import { useAttachTag, useDetachTag } from '../hooks/use-tag-mutations.js';
import { Badge, badgeVariants } from './ui/badge.js';
import { Button } from './ui/button.js';
import { Checkbox } from './ui/checkbox.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Input } from './ui/input.js';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.js';
import { Textarea } from './ui/textarea.js';

type Props = {
  card: CardWithRelations;
  allTags: Tag[];
  onClose: () => void;
};

const RELATIVE_DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

function relativeTime(from: Date, now = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  let duration = (from.getTime() - now.getTime()) / 1000;
  for (const { amount, unit } of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < amount) return rtf.format(Math.round(duration), unit);
    duration /= amount;
  }
  return from.toISOString();
}

export function CardModal({ card, allTags, onClose }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');

  const update = useUpdateCard();
  const del = useDeleteCard();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const attachTag = useAttachTag();
  const detachTag = useDetachTag();

  const attachedTagIds = useMemo(() => new Set(card.tags.map((t) => t.id)), [card.tags]);
  const availableTags = useMemo(
    () => allTags.filter((t) => !attachedTagIds.has(t.id)),
    [allTags, attachedTagIds],
  );

  async function onSave() {
    const titleTrim = title.trim();
    if (!titleTrim) return;

    const input: { title?: string; description?: string } = {};
    if (titleTrim !== card.title) input.title = titleTrim;
    if (description !== card.description) input.description = description;

    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }

    await update.mutateAsync({ id: card.id, input });
    onClose();
  }

  async function onDelete() {
    if (!confirm(`Delete "${card.title}"?`)) return;
    await del.mutateAsync(card.id);
    onClose();
  }

  async function onAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    const t = newSubtask.trim();
    if (!t) return;
    await createSubtask.mutateAsync({ cardId: card.id, title: t });
    setNewSubtask('');
  }

  async function onAddComment(e: React.FormEvent) {
    e.preventDefault();
    const body = newComment.trim();
    if (!body) return;
    await createComment.mutateAsync({ cardId: card.id, body });
    setNewComment('');
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit card</DialogTitle>
          <DialogDescription className="sr-only">
            Edit the card title, description, subtasks, tags, and comments.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-3">
          <label
            htmlFor="card-modal-title-input"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-muted"
          >
            Title
          </label>
          <Input
            id="card-modal-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 text-base font-medium"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="card-modal-description-input"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-muted"
          >
            Description
          </label>
          <Textarea
            id="card-modal-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <section className="mb-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
            Subtasks
            {card.subtasks.length > 0 && (
              <span className="ml-2 font-normal normal-case tracking-normal">
                {card.subtasks.filter((s) => s.done).length}/{card.subtasks.length}
              </span>
            )}
          </h3>
          <ul className="space-y-1">
            {card.subtasks.map((sub) => (
              <li key={sub.id} className="group flex items-center gap-2">
                <Checkbox
                  checked={sub.done}
                  onCheckedChange={(checked) =>
                    updateSubtask.mutate({ id: sub.id, input: { done: checked === true } })
                  }
                  aria-label={sub.title}
                />
                <span
                  className={`flex-1 text-sm ${sub.done ? 'text-fg-muted line-through' : 'text-fg'}`}
                >
                  {sub.title}
                </span>
                <Button
                  variant="danger"
                  size="icon"
                  onClick={() => deleteSubtask.mutate(sub.id)}
                  aria-label={`Delete subtask ${sub.title}`}
                  className="h-6 w-6 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
          <form onSubmit={onAddSubtask} className="mt-2 flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add subtask"
              className="h-8"
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={!newSubtask.trim() || createSubtask.isPending}
            >
              Add
            </Button>
          </form>
        </section>

        <section className="mb-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Tags</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {card.tags.map((tag) => (
              <Badge key={tag.id} className="pr-1">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <button
                  type="button"
                  onClick={() => detachTag.mutate({ cardId: card.id, tagId: tag.id })}
                  className="ml-0.5 rounded-full px-1 text-fg-muted hover:bg-danger/10 hover:text-danger"
                  aria-label={`Remove tag ${tag.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {availableTags.length > 0 && (
              <Popover>
                <PopoverTrigger
                  className={`${badgeVariants({ variant: 'outline', interactive: true })} cursor-pointer border-dashed`}
                >
                  <Plus className="h-3 w-3" /> Add tag
                </PopoverTrigger>
                <PopoverContent align="start" className="p-1">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => attachTag.mutate({ cardId: card.id, tagId: tag.id })}
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-fg hover:bg-bg"
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}
            {card.tags.length === 0 && availableTags.length === 0 && (
              <span className="text-xs text-fg-muted">No tags available</span>
            )}
          </div>
        </section>

        <section className="mb-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
            Comments
          </h3>
          <ul className="space-y-2">
            {card.comments.map((comment) => (
              <li
                key={comment.id}
                className="group rounded border border-border bg-bg/40 p-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap break-words text-fg">{comment.body}</p>
                  <Button
                    variant="danger"
                    size="icon"
                    onClick={() => deleteComment.mutate(comment.id)}
                    aria-label="Delete comment"
                    className="h-6 w-6 shrink-0 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <time
                  dateTime={new Date(comment.createdAt).toISOString()}
                  className="mt-1 block text-[11px] text-fg-muted"
                >
                  {relativeTime(new Date(comment.createdAt))}
                </time>
              </li>
            ))}
          </ul>
          <form onSubmit={onAddComment} className="mt-2 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              placeholder="Add a comment"
              className="min-h-0"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={!newComment.trim() || createComment.isPending}
              >
                {createComment.isPending ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </form>
        </section>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="danger" onClick={onDelete} disabled={del.isPending}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={update.isPending || !title.trim()}>
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
