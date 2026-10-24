'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams?.toString();
    const fullRoute = query ? `${pathname}?${query}` : pathname;

    try {
      const current = sessionStorage.getItem('portfolio_current_route');
      if (current) {
        const currentClean = current.split('?')[0].split('#')[0];
        const newClean = pathname.split('?')[0].split('#')[0];

        // Only update previous route if we moved to a completely different page
        if (currentClean !== newClean) {
          sessionStorage.setItem('portfolio_previous_route', current);
        }
      }
      sessionStorage.setItem('portfolio_current_route', fullRoute);
    } catch {
      // Ignore storage errors (e.g. storage disabled / sandbox restrictions)
    }
  }, [pathname, searchParams]);

  return null;
}

