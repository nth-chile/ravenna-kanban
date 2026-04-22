import { ApiError } from '../lib/api.js';
import { useBoard } from '../hooks/use-board.js';
import { Column } from './Column.js';

export function Board() {
  const { data, isPending, isError, error, refetch, isFetching } = useBoard();

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <p className="text-sm text-slate-500">Loading board…</p>
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown error';
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="max-w-sm rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm font-medium text-red-800">
            Couldn’t load board
          </p>
          <p className="mt-1 text-xs text-red-700">{message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 shadow-sm transition hover:bg-red-50"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const columns = data.columns;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">{data.name}</h1>
          <p className="text-xs text-slate-500">
            {columns.length} column{columns.length === 1 ? '' : 's'}
            {isFetching ? ' · refreshing…' : ''}
          </p>
        </div>
      </header>

      {columns.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-12">
          <p className="text-sm text-slate-500">This board has no columns yet.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full min-w-max items-start gap-4 p-6">
            {columns.map((column) => (
              <Column key={column.id} column={column} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
