import { schema } from '@ravenna/shared';
import { count } from 'drizzle-orm';
import { db } from './index.js';

const { boards, cardTags, cards, columns, comments, subtasks, tags } = schema;

type Board = typeof boards.$inferSelect;
type Column = typeof columns.$inferSelect;
type Card = typeof cards.$inferSelect;
type Tag = typeof tags.$inferSelect;

export async function seed() {
  const [row] = await db.select({ c: count() }).from(boards);
  if ((row?.c ?? 0) > 0) return;

  db.transaction((tx) => {
    const [board] = tx.insert(boards).values({ name: 'Product Roadmap' }).returning().all() as [
      Board,
    ];

    const [backlog, inProgress, inReview, done] = tx
      .insert(columns)
      .values([
        { boardId: board.id, name: 'Backlog', position: 1 },
        { boardId: board.id, name: 'In Progress', position: 2 },
        { boardId: board.id, name: 'In Review', position: 3 },
        { boardId: board.id, name: 'Done', position: 4 },
      ])
      .returning()
      .all() as [Column, Column, Column, Column];

    const [tagBug, tagFeature, tagChore, tagUx] = tx
      .insert(tags)
      .values([
        { boardId: board.id, name: 'bug', color: '#ef4444' },
        { boardId: board.id, name: 'feature', color: '#3b82f6' },
        { boardId: board.id, name: 'chore', color: '#6b7280' },
        { boardId: board.id, name: 'ux', color: '#a855f7' },
      ])
      .returning()
      .all() as [Tag, Tag, Tag, Tag];

    const [onboarding, darkMode, fixDrag, rateLimit, search, auditLogs, writeDocs, closedBeta] = tx
      .insert(cards)
      .values([
        {
          columnId: backlog.id,
          title: 'Revamp onboarding flow',
          description: 'New users drop off on step 3. Shorten to two steps.',
          position: 1,
        },
        {
          columnId: backlog.id,
          title: 'Dark mode support',
          description: 'System preference + manual toggle. Use CSS vars.',
          position: 2,
        },
        {
          columnId: inProgress.id,
          title: 'Fix drag flicker on Safari',
          description: 'Cards jump one slot up after drop in Safari 17.',
          position: 1,
        },
        {
          columnId: inProgress.id,
          title: 'Rate limit the public API',
          description: '100 req/min per IP for now.',
          position: 2,
        },
        {
          columnId: inReview.id,
          title: 'Full-text search across cards',
          description: 'Title + description + comment bodies.',
          position: 1,
        },
        {
          columnId: inReview.id,
          title: 'Audit logs for card edits',
          description: 'Who changed what, when. Keep 90 days.',
          position: 2,
        },
        { columnId: done.id, title: 'Write public docs', description: '', position: 1 },
        { columnId: done.id, title: 'Closed beta launch', description: '', position: 2 },
      ])
      .returning()
      .all() as [Card, Card, Card, Card, Card, Card, Card, Card];

    tx.insert(cardTags)
      .values([
        { cardId: onboarding.id, tagId: tagUx.id },
        { cardId: onboarding.id, tagId: tagFeature.id },
        { cardId: darkMode.id, tagId: tagFeature.id },
        { cardId: fixDrag.id, tagId: tagBug.id },
        { cardId: rateLimit.id, tagId: tagChore.id },
        { cardId: search.id, tagId: tagFeature.id },
        { cardId: auditLogs.id, tagId: tagFeature.id },
        { cardId: writeDocs.id, tagId: tagChore.id },
        { cardId: closedBeta.id, tagId: tagFeature.id },
      ])
      .run();

    tx.insert(subtasks)
      .values([
        { cardId: onboarding.id, title: 'Audit current flow', done: true, position: 1 },
        { cardId: onboarding.id, title: 'Draft two-step design', done: false, position: 2 },
        { cardId: onboarding.id, title: 'Ship A/B test', done: false, position: 3 },
        { cardId: darkMode.id, title: 'Extract color tokens', done: true, position: 1 },
        { cardId: darkMode.id, title: 'Add toggle in header', done: false, position: 2 },
        { cardId: search.id, title: 'Decide FTS5 vs LIKE', done: true, position: 1 },
        { cardId: search.id, title: 'Wire endpoint', done: false, position: 2 },
      ])
      .run();

    tx.insert(comments)
      .values([
        { cardId: onboarding.id, body: 'Let me know if we want to A/B this or just ship it.' },
        { cardId: fixDrag.id, body: 'Reproduced — dnd-kit’s modifier math is off on iOS.' },
        { cardId: fixDrag.id, body: 'Trying a fix now, will push a branch tonight.' },
        { cardId: search.id, body: 'FTS5 is worth it. LIKE is too slow once the board grows.' },
      ])
      .run();

    const bulk = Number(process.env.SEED_LARGE_COLUMN ?? 0);
    if (bulk > 0) {
      tx.insert(cards)
        .values(
          Array.from({ length: bulk }, (_, i) => ({
            columnId: backlog.id,
            title: `Load test card ${i + 1}`,
            description: i % 5 === 0 ? `Synthetic card #${i + 1} for virtualization testing.` : '',
            position: 100 + i,
          })),
        )
        .run();
    }
  });
}
