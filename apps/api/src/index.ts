import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { runMigrations } from './db/migrate.js';
import { seed } from './db/seed.js';
import { env } from './env.js';
import { logger } from './logger.js';

runMigrations();
await seed();

const app = createApp();

serve({ fetch: app.fetch, port: env.PORT, hostname: '0.0.0.0' }, (info) => {
  logger.info({ port: info.port, hostname: '0.0.0.0' }, 'api listening');
});
