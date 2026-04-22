import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { boards, cardTags, cards, columns, comments, subtasks, tags } from './db/schema.js';

export const BoardSchema = createSelectSchema(boards);
export const ColumnSchema = createSelectSchema(columns);
export const CardSchema = createSelectSchema(cards);
export const TagSchema = createSelectSchema(tags);
export const CardTagSchema = createSelectSchema(cardTags);
export const SubtaskSchema = createSelectSchema(subtasks);
export const CommentSchema = createSelectSchema(comments);

export type Board = z.infer<typeof BoardSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type Card = z.infer<typeof CardSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type Comment = z.infer<typeof CommentSchema>;

export const CardWithRelationsSchema = CardSchema.extend({
  tags: z.array(TagSchema),
  subtasks: z.array(SubtaskSchema),
  comments: z.array(CommentSchema),
});
export type CardWithRelations = z.infer<typeof CardWithRelationsSchema>;

export const ColumnWithCardsSchema = ColumnSchema.extend({
  cards: z.array(CardWithRelationsSchema),
});
export type ColumnWithCards = z.infer<typeof ColumnWithCardsSchema>;

export const BoardResponseSchema = BoardSchema.extend({
  columns: z.array(ColumnWithCardsSchema),
  tags: z.array(TagSchema),
});
export type BoardResponse = z.infer<typeof BoardResponseSchema>;

const title = z.string().trim().min(1).max(200);
const description = z.string().max(10_000);
const position = z.number().finite();

export const CreateCardInputSchema = z.object({
  columnId: z.string().uuid(),
  title,
  description: description.optional(),
});
export type CreateCardInput = z.infer<typeof CreateCardInputSchema>;

export const UpdateCardInputSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
  })
  .refine((v) => v.title !== undefined || v.description !== undefined, {
    message: 'provide at least one field',
  });
export type UpdateCardInput = z.infer<typeof UpdateCardInputSchema>;

export const MoveCardInputSchema = z.object({
  toColumnId: z.string().uuid(),
  beforeCardId: z.string().uuid().nullish(),
  afterCardId: z.string().uuid().nullish(),
});
export type MoveCardInput = z.infer<typeof MoveCardInputSchema>;

export const ReorderCardInputSchema = z.object({
  beforeCardId: z.string().uuid().nullish(),
  afterCardId: z.string().uuid().nullish(),
});
export type ReorderCardInput = z.infer<typeof ReorderCardInputSchema>;

export const CreateColumnInputSchema = z.object({
  boardId: z.string().uuid(),
  name: title,
});
export type CreateColumnInput = z.infer<typeof CreateColumnInputSchema>;

export const UpdateColumnInputSchema = z.object({ name: title });
export type UpdateColumnInput = z.infer<typeof UpdateColumnInputSchema>;

export const ReorderColumnInputSchema = z.object({
  beforeColumnId: z.string().uuid().nullish(),
  afterColumnId: z.string().uuid().nullish(),
});
export type ReorderColumnInput = z.infer<typeof ReorderColumnInputSchema>;

export const CreateTagInputSchema = createInsertSchema(tags, {
  name: title,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
}).pick({ boardId: true, name: true, color: true });
export type CreateTagInput = z.infer<typeof CreateTagInputSchema>;

export const CreateSubtaskInputSchema = z.object({
  cardId: z.string().uuid(),
  title,
  position,
});
export type CreateSubtaskInput = z.infer<typeof CreateSubtaskInputSchema>;

export const UpdateSubtaskInputSchema = z
  .object({
    title: title.optional(),
    done: z.boolean().optional(),
  })
  .refine((v) => v.title !== undefined || v.done !== undefined, {
    message: 'provide at least one field',
  });
export type UpdateSubtaskInput = z.infer<typeof UpdateSubtaskInputSchema>;

export const CreateCommentInputSchema = z.object({
  cardId: z.string().uuid(),
  body: z.string().trim().min(1).max(10_000),
});
export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;

export const ListCardsQuerySchema = z.object({
  boardId: z.string().uuid().optional(),
  columnId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  q: z.string().trim().min(1).optional(),
});
export type ListCardsQuery = z.infer<typeof ListCardsQuerySchema>;
