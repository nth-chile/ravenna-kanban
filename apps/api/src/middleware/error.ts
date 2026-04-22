import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { logger } from '../logger.js';

export const errorHandler: ErrorHandler = (err, c) => {
  const reqId = c.get('requestId');

  if (err instanceof ZodError) {
    logger.warn({ reqId, err: err.flatten() }, 'validation error');
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request failed validation',
          details: err.flatten(),
        },
      },
      400,
    );
  }

  if (err instanceof HTTPException) {
    logger.warn({ reqId, status: err.status, msg: err.message }, 'http exception');
    return c.json(
      {
        error: {
          code: err.status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR',
          message: err.message,
        },
      },
      err.status,
    );
  }

  logger.error({ reqId, err }, 'unhandled error');
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
      },
    },
    500,
  );
};
