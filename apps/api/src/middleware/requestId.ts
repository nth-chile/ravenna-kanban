import { randomUUID } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';

export const requestId = (): MiddlewareHandler => async (c, next) => {
  const incoming = c.req.header('x-request-id');
  const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
  c.set('requestId', id);
  c.header('x-request-id', id);
  await next();
};

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
  }
}
