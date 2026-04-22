import { serveStatic } from '@hono/node-server/serve-static';
import type { MiddlewareHandler } from 'hono';

/**
 * Serves static files for the SPA from `root` (relative to process.cwd()).
 * - Skips anything under /api or /health so those stay with the JSON API.
 * - Falls back to index.html for unknown paths that accept text/html,
 *   so client-side routing works on deep-link refreshes.
 */
export const serveSpa = (root: string): MiddlewareHandler => {
  const fileServer = serveStatic({ root });
  const indexFallback = serveStatic({ root, path: 'index.html' });

  return async (c, next) => {
    const path = c.req.path;

    if (path.startsWith('/api') || path.startsWith('/health')) {
      return next();
    }

    // Try to serve a real file first. If serveStatic can't find one,
    // it calls next() without sending a response.
    let served = true;
    await fileServer(c, async () => {
      served = false;
    });
    if (served && c.res.status !== 404) {
      return;
    }

    // SPA fallback: serve index.html for HTML navigation requests.
    const accept = c.req.header('accept') ?? '';
    if (c.req.method === 'GET' && accept.includes('text/html')) {
      let fallbackServed = true;
      await indexFallback(c, async () => {
        fallbackServed = false;
      });
      if (fallbackServed) return;
    }

    await next();
  };
};
