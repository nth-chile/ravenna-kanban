import { serveStatic } from '@hono/node-server/serve-static';
import type { MiddlewareHandler } from 'hono';

/**
 * Serves static files for the SPA from `root` (relative to process.cwd()).
 * - Skips /api/* and /health so those stay with the JSON API.
 * - Falls back to index.html for GET requests so deep links / refreshes
 *   land on the SPA shell.
 */
export const serveSpa = (root: string): MiddlewareHandler => {
  const assetServer = serveStatic({ root });
  const indexFallback = serveStatic({ root, path: 'index.html' });

  return async (c, next) => {
    const path = c.req.path;

    if (path.startsWith('/api') || path.startsWith('/health')) {
      return next();
    }

    // Let serveStatic try to match a real file. It will either return
    // a response or call its inner next() — we treat the latter as "no match".
    const assetResult = await assetServer(c, async () => undefined);
    if (assetResult instanceof Response) return assetResult;

    // SPA fallback: only for GET. Serve index.html so client-side routes work.
    if (c.req.method === 'GET') {
      const fallbackResult = await indexFallback(c, async () => undefined);
      if (fallbackResult instanceof Response) return fallbackResult;
    }

    return next();
  };
};
