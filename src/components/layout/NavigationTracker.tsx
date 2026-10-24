'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    try {
      const current = sessionStorage.getItem('portfolio_current_route');
      if (current && current !== pathname) {
        sessionStorage.setItem('portfolio_previous_route', current);
      }
      sessionStorage.setItem('portfolio_current_route', pathname);
    } catch {
      // Ignore storage errors (e.g. storage disabled / sandbox restrictions)
    }
  }, [pathname]);

  return null;
}
