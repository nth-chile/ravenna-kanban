import { schema } from '@ravenna/shared';
import { createApp } from '../app.js';
import { db } from '../db/index.js';
import { runMigrations } from '../db/migrate.js';

let migrated = false;

export function setupApp() {
  if (!migrated) {
    runMigrations();
    migrated = true;
  }
  return createApp({ rateLimitEnabled: false });
}

export function resetDb() {
  db.delete(schema.comments).run();
  db.delete(schema.subtasks).run();
  db.delete(schema.cardTags).run();
  db.delete(schema.cards).run();
  db.delete(schema.tags).run();
  db.delete(schema.columns).run();
  db.delete(schema.boards).run();
}

export type Fixture = {
  boardId: string;
  columnAId: string;
  columnBId: string;
  tagFeatureId: string;
  tagBugId: string;
  cardOneId: string;
  cardTwoId: string;
};

export function seedFixture(): Fixture {
  const [board] = db.insert(schema.boards).values({ name: 'Test Board' }).returning().all();
  if (!board) throw new Error('seed: board');

  const [colA, colB] = db
    .insert(schema.columns)
    .values([
      { boardId: board.id, name: 'A', position: 1 },
      { boardId: board.id, name: 'B', position: 2 },
    ])
    .returning()
    .all() as [typeof schema.columns.$inferSelect, typeof schema.columns.$inferSelect];

  const [tagFeature, tagBug] = db
    .insert(schema.tags)
    .values([
      { boardId: board.id, name: 'feature', color: '#3b82f6' },
      { boardId: board.id, name: 'bug', color: '#ef4444' },
    ])
    .returning()
    .all() as [typeof schema.tags.$inferSelect, typeof schema.tags.$inferSelect];

  const [cardOne, cardTwo] = db
    .insert(schema.cards)
    .values([
      { columnId: colA.id, title: 'First', description: '', position: 1 },
      { columnId: colA.id, title: 'Second', description: '', position: 2 },
    ])
    .returning()
    .all() as [typeof schema.cards.$inferSelect, typeof schema.cards.$inferSelect];

  return {
    boardId: board.id,
    columnAId: colA.id,
    columnBId: colB.id,
    tagFeatureId: tagFeature.id,
    tagBugId: tagBug.id,
    cardOneId: cardOne.id,
    cardTwoId: cardTwo.id,
  };
}

export async function json<T = unknown>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
