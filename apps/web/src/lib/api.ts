import { ErrorBodySchema } from '@ravenna/shared';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers });
  } catch (err) {
    throw new ApiError({
      status: 0,
      code: 'network_error',
      message: err instanceof Error ? err.message : 'network request failed',
    });
  }

  if (!res.ok) {
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      throw new ApiError({
        status: res.status,
        code: 'http_error',
        message: `HTTP ${res.status}`,
      });
    }
    const result = ErrorBodySchema.safeParse(parsed);
    if (result.success) {
      throw new ApiError({
        status: res.status,
        code: result.data.error.code,
        message: result.data.error.message,
        details: result.data.error.details,
      });
    }
    throw new ApiError({
      status: res.status,
      code: 'http_error',
      message: `HTTP ${res.status}`,
      details: parsed,
    });
  }

  return (await res.json()) as T;
}
