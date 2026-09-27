'use client';

import { useCallback, useState } from 'react';

/**
 * A version-agnostic stand-in for React 19's `useActionState`, built on
 * plain `useState` (stable in React 18). Works with any Next.js Server
 * Action of the shape `(prevState, formData) => Promise<State>`.
 *
 * Call from a plain onSubmit handler:
 *   const [state, dispatch, pending] = useActionState(myAction, initial);
 *   <form onSubmit={(e) => { e.preventDefault(); dispatch(new FormData(e.currentTarget)); }}>
 *
 * Always resolves the pending state and always reports a failure to the
 * caller — if the action throws, that's caught and merged into the
 * returned state as `error`, rather than being swallowed as an
 * unhandled promise rejection that leaves the UI stuck with no feedback.
 */
export function useActionState<State>(
  action: (state: State, formData: FormData) => Promise<State>,
  initialState: State
): [State, (formData: FormData) => void, boolean] {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);

  const dispatch = useCallback(
    (formData: FormData) => {
      setIsPending(true);
      action(state, formData)
        .then((result) => {
          setState(result);
        })
        .catch((err: unknown) => {
          // eslint-disable-next-line no-console
          console.error('Action failed:', err);
          const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
          setState((prev) => ({ ...(prev as object), error: message } as State));
        })
        .finally(() => {
          setIsPending(false);
        });
    },
    [action, state]
  );

  return [state, dispatch, isPending];
}
