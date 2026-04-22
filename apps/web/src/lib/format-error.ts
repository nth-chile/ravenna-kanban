import { ApiError } from './api.js';

export function formatApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
    const details = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
    if (details?.fieldErrors) {
      for (const messages of Object.values(details.fieldErrors)) {
        if (messages?.[0]) return messages[0];
      }
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
