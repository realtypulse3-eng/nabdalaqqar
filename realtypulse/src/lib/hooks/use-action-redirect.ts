'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Watches an ActionState-shaped object for a `redirectTo` field and
 * navigates there client-side as soon as it appears.
 */
export function useActionRedirect(redirectTo: string | undefined) {
  const router = useRouter();

  useEffect(() => {
    if (!redirectTo) return;
    router.push(redirectTo);
    router.refresh();
  }, [redirectTo, router]);
}
