import { z } from 'zod';

export const PingSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});
export type Ping = z.infer<typeof PingSchema>;

export const ErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorBody = z.infer<typeof ErrorBodySchema>;
