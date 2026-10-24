'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

export interface BackButtonProps {
  fallbackHref?: string;
  fallbackLabel?: string;
  className?: string;
}

function resolveNavInfo(
  path: string | null,
  fallbackHref: string,
  fallbackLabel: string
): { href: string; label: string } {
  if (!path) {
    return { href: fallbackHref, label: fallbackLabel };
  }

  const cleanPath = path.split('?')[0].split('#')[0];

  if (cleanPath === '/' || cleanPath === '') {
    return { href: '/', label: 'Back to Home' };
  }

  if (cleanPath === '/blog' || cleanPath.startsWith('/blog/')) {
    const label =
      fallbackLabel && fallbackLabel !== 'Back to Projects'
        ? fallbackLabel
        : 'Back to Blog';
    return { href: path, label };
  }

  if (cleanPath === '/projects' || cleanPath.startsWith('/projects/')) {
    const label =
      fallbackLabel && fallbackLabel !== 'Back to Blog'
        ? fallbackLabel
        : 'Back to Projects';
    return { href: path, label };
  }

  if (cleanPath.startsWith('/project/')) {
    return { href: path, label: fallbackLabel || 'Back to Projects' };
  }

  const segments = cleanPath.split('/').filter(Boolean);
  if (segments.length > 0) {
    const rawName = segments[0];
    const formatted = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return { href: path, label: `Back to ${formatted}` };
  }

  return { href: fallbackHref, label: fallbackLabel };
}

export function BackButton({
  fallbackHref = '/projects',
  fallbackLabel = 'Back to Projects',
  className = '',
}: BackButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [navInfo, setNavInfo] = useState<{ href: string; label: string }>({
    href: fallbackHref,
    label: fallbackLabel,
  });

  useEffect(() => {
    try {
      let sourcePath: string | null = null;
      const currentPathname = window.location.pathname;
      const getCleanPath = (p: string | null) => (p ? p.split('?')[0].split('#')[0] : null);

      const storedCurrent = sessionStorage.getItem('portfolio_current_route');
      const cleanCurrent = getCleanPath(storedCurrent);

      const storedPrev = sessionStorage.getItem('portfolio_previous_route');
      const cleanPrev = getCleanPath(storedPrev);

      if (storedCurrent && cleanCurrent !== currentPathname) {
        sourcePath = storedCurrent;
      } else if (storedPrev && cleanPrev !== currentPathname) {
        sourcePath = storedPrev;
      }

      if (!sourcePath && typeof document !== 'undefined' && document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          if (
            refUrl.origin === window.location.origin &&
            refUrl.pathname !== currentPathname
          ) {
            sourcePath = refUrl.pathname + refUrl.search;
          }
        } catch {
          // Ignore invalid URL
        }
      }

      if (sourcePath) {
        const resolved = resolveNavInfo(sourcePath, fallbackHref, fallbackLabel);
        setNavInfo(resolved);
      }
    } catch {
      // Ignore if sessionStorage is not accessible
    }
  }, [fallbackHref, fallbackLabel]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If not a plain left click or modifier keys are pressed, let the browser handle it
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    e.preventDefault();

    // Ensure the viewport is scrolled to top on navigation
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    startTransition(() => {
      router.push(navInfo.href, { scroll: true });
    });
  };

  return (
    <Link
      href={navInfo.href}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-sky-400 transition-colors ${className}`.trim()}
    >
      <FiArrowLeft className="w-3.5 h-3.5" />
      <span>{navInfo.label}</span>
    </Link>
  );
}

