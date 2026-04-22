import { randomUUID } from 'node:crypto';
import { relations } from 'drizzle-orm';
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID());

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date());

export const boards = sqliteTable('boards', {
  id: id(),
  name: text('name').notNull(),
  createdAt: createdAt(),
});

export const columns = sqliteTable('columns', {
  id: id(),
  boardId: text('board_id')
    .notNull()
    .references(() => boards.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: real('position').notNull(),
  createdAt: createdAt(),
});

export const cards = sqliteTable('cards', {
  id: id(),
  columnId: text('column_id')
    .notNull()
    .references(() => columns.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  position: real('position').notNull(),
  createdAt: createdAt(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
});

export const tags = sqliteTable('tags', {
  id: id(),
  boardId: text('board_id')
    .notNull()
    .references(() => boards.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: createdAt(),
});

export const cardTags = sqliteTable(
  'card_tags',
  {
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.cardId, t.tagId] }) }),
);

export const subtasks = sqliteTable('subtasks', {
  id: id(),
  cardId: text('card_id')
    .notNull()
    .references(() => cards.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  position: real('position').notNull(),
  createdAt: createdAt(),
});

export const comments = sqliteTable('comments', {
  id: id(),
  cardId: text('card_id')
    .notNull()
    .references(() => cards.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: createdAt(),
});

export const boardsRelations = relations(boards, ({ many }) => ({
  columns: many(columns),
  tags: many(tags),
}));

export const columnsRelations = relations(columns, ({ one, many }) => ({
  board: one(boards, { fields: [columns.boardId], references: [boards.id] }),
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  column: one(columns, { fields: [cards.columnId], references: [columns.id] }),
  cardTags: many(cardTags),
  subtasks: many(subtasks),
  comments: many(comments),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  board: one(boards, { fields: [tags.boardId], references: [boards.id] }),
  cardTags: many(cardTags),
}));

export const cardTagsRelations = relations(cardTags, ({ one }) => ({
  card: one(cards, { fields: [cardTags.cardId], references: [cards.id] }),
  tag: one(tags, { fields: [cardTags.tagId], references: [tags.id] }),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  card: one(cards, { fields: [subtasks.cardId], references: [cards.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  card: one(cards, { fields: [comments.cardId], references: [cards.id] }),
}));
