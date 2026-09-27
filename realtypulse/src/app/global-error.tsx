'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the browser console and, since this runs server-side
    // too on the initial render, in Vercel's Runtime Logs.
    console.error('App segment render error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-8 text-center text-ink">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-ink-muted">{error.message || 'An unexpected error occurred.'}</p>
      {error.digest && (
        <p className="text-xs text-ink-muted">Error ID: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
