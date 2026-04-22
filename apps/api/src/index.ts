import { serve } from '@hono/node-server';
import { PingSchema } from '@ravenna/shared';
import { Hono } from 'hono';
import { runMigrations } from './db/migrate.js';
import { seed } from './db/seed.js';
import { env } from './env.js';
import { logger } from './logger.js';
import { errorHandler } from './middleware/error.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { boardRoute } from './routes/board.js';

runMigrations();
await seed();

const app = new Hono();

app.use('*', requestId());
app.use('*', requestLogger());

app.get('/api/ping', (c) => {
  const body = PingSchema.parse({ ok: true, message: 'pong' });
  return c.json(body);
});

app.get('/health', (c) => c.json({ ok: true }));

app.route('/api/board', boardRoute);

app.notFound((c) =>
  c.json({ error: { code: 'NOT_FOUND', message: `No route for ${c.req.method} ${c.req.path}` } }, 404),
);
app.onError(errorHandler);

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info({ port: info.port }, 'api listening');
});
