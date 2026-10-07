'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root layout render error:', error);
  }, [error]);

  return (
    <html>
      <body style={{ background: '#0b0b14', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: 'sans-serif', textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ maxWidth: '28rem', fontSize: '0.875rem', opacity: 0.7 }}>{error.message || 'An unexpected error occurred.'}</p>
        {error.digest && <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Error ID: {error.digest}</p>}
        <button
          onClick={() => reset()}
          style={{ borderRadius: '0.375rem', background: '#6d5efc', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
