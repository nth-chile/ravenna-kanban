import type { CardWithRelations, Tag } from '@ravenna/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDeleteCard, useUpdateCard } from '../hooks/use-card-mutations.js';
import { useCreateComment, useDeleteComment } from '../hooks/use-comment-mutations.js';
import {
  useCreateSubtask,
  useDeleteSubtask,
  useUpdateSubtask,
} from '../hooks/use-subtask-mutations.js';
import { useAttachTag, useDetachTag } from '../hooks/use-tag-mutations.js';

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
  const [showTagPicker, setShowTagPicker] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    titleRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape-to-close is wired on the document; click-outside is a mouse-only gesture.
    <dialog
      open
      aria-modal="true"
      aria-labelledby="card-modal-title"
      className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 p-4 text-fg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface p-6 shadow-xl">
        <h2 id="card-modal-title" className="sr-only">
          Edit card
        </h2>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-muted">
            Title
          </span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-base font-medium focus:border-fg-muted focus:outline-none"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-muted">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full resize-y rounded border border-border px-3 py-2 text-sm focus:border-fg-muted focus:outline-none"
          />
        </label>

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
                <input
                  type="checkbox"
                  checked={sub.done}
                  onChange={(e) =>
                    updateSubtask.mutate({
                      id: sub.id,
                      input: { done: e.target.checked },
                    })
                  }
                  className="h-4 w-4 shrink-0 rounded border-border accent-accent"
                />
                <span
                  className={`flex-1 text-sm ${sub.done ? 'text-fg-muted line-through' : 'text-fg'}`}
                >
                  {sub.title}
                </span>
                <button
                  type="button"
                  onClick={() => deleteSubtask.mutate(sub.id)}
                  className="rounded px-1.5 py-0.5 text-xs text-fg-muted opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Delete subtask ${sub.title}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={onAddSubtask} className="mt-2 flex gap-2">
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add subtask"
              className="flex-1 rounded border border-border bg-bg px-2 py-1 text-sm focus:border-fg-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newSubtask.trim() || createSubtask.isPending}
              className="rounded border border-border px-2 py-1 text-xs text-fg-muted hover:bg-bg disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </section>

        <section className="mb-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Tags</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {card.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-bg/60 py-0.5 pr-1 pl-2 text-[11px] font-medium text-fg"
              >
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
                  ×
                </button>
              </span>
            ))}
            {availableTags.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTagPicker((v) => !v)}
                  className="rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-fg-muted hover:bg-bg"
                >
                  + Add tag
                </button>
                {showTagPicker && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-md border border-border bg-surface p-1 shadow-lg">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          attachTag.mutate({ cardId: card.id, tagId: tag.id });
                          setShowTagPicker(false);
                        }}
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
                  </div>
                )}
              </div>
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
                  <button
                    type="button"
                    onClick={() => deleteComment.mutate(comment.id)}
                    className="shrink-0 rounded px-1.5 py-0.5 text-xs text-fg-muted opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete comment"
                  >
                    ×
                  </button>
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
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              placeholder="Add a comment"
              className="w-full resize-y rounded border border-border bg-bg px-2 py-1 text-sm focus:border-fg-muted focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim() || createComment.isPending}
                className="rounded border border-border px-2 py-1 text-xs text-fg-muted hover:bg-bg disabled:opacity-50"
              >
                {createComment.isPending ? 'Posting…' : 'Post'}
              </button>
            </div>
          </form>
        </section>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={onDelete}
            disabled={del.isPending}
            className="rounded px-3 py-1.5 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-sm text-fg-muted hover:bg-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={update.isPending || !title.trim()}
              className="rounded bg-accent px-3 py-1.5 text-sm text-accent-fg hover:opacity-90 disabled:opacity-50"
            >
              {update.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
