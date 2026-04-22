import { PingSchema, type Ping } from '@ravenna/shared';
import { useEffect, useState } from 'react';

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: Ping }
  | { status: 'error'; message: string };

export function App() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/ping', { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = PingSchema.parse(await res.json());
        setState({ status: 'ready', data });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : 'unknown' });
      });
    return () => ctrl.abort();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Ravenna Kanban</h1>
        <p className="mt-1 text-sm text-slate-500">Slice 1: skeleton is wired end-to-end.</p>
        <div className="mt-4 rounded-lg bg-slate-100 p-3 font-mono text-sm">
          {state.status === 'loading' && 'pinging api...'}
          {state.status === 'ready' && `api says: ${state.data.message}`}
          {state.status === 'error' && `error: ${state.message}`}
        </div>
      </div>
    </main>
  );
}
