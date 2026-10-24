'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const MAX_QUEUE_CAPACITY = 30;
export const QUEUE_STORAGE_KEY = 'portfolio_history_queue';

export function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams?.toString();
    const fullRoute = query ? `${pathname}?${query}` : pathname;
    const cleanPath = pathname.split('?')[0].split('#')[0];

    try {
      let queue: string[] = [];
      const stored = sessionStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            queue = parsed;
          }
        } catch {
          queue = [];
        }
      }

      if (queue.length === 0) {
        queue.push(fullRoute);
      } else {
        const lastEntry = queue[queue.length - 1];
        const lastClean = lastEntry.split('?')[0].split('#')[0];

        // 1. Exact duplicate render: ignore
        if (lastEntry === fullRoute) {
          return;
        }

        // 2. Same page with tab/query update: update in place
        if (lastClean === cleanPath) {
          queue[queue.length - 1] = fullRoute;
        } else {
          // 3. Check if cleanPath already exists earlier in history (user navigated back to ancestor)
          let existingIndex = -1;
          for (let i = queue.length - 1; i >= 0; i--) {
            if (queue[i].split('?')[0].split('#')[0] === cleanPath) {
              existingIndex = i;
              break;
            }
          }

          if (existingIndex !== -1) {
            // Prune all forward descendant entries after existingIndex to break circular loops
            queue = queue.slice(0, existingIndex + 1);
            queue[existingIndex] = fullRoute;
          } else {
            // Forward navigation to a new route
            queue.push(fullRoute);
          }
        }
      }

      // Enforce FIFO capacity bound: drop oldest entries
      while (queue.length > MAX_QUEUE_CAPACITY) {
        queue.shift();
      }

      sessionStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // Ignore storage errors (e.g. storage disabled / sandbox restrictions)
    }
  }, [pathname, searchParams]);

  return null;
}

