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
    return { href: path, label: 'Back to Blog' };
  }

  if (cleanPath === '/projects' || cleanPath.startsWith('/projects/')) {
    return { href: path, label: 'Back to Projects' };
  }

  if (cleanPath.startsWith('/project/')) {
    return { href: path, label: 'Back to Projects' };
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
  const [hasHistory, setHasHistory] = useState<boolean>(false);

  useEffect(() => {
    try {
      let sourcePath: string | null = null;
      const currentPathname = window.location.pathname;

      const storedCurrent = sessionStorage.getItem('portfolio_current_route');
      if (storedCurrent && storedCurrent !== currentPathname) {
        sourcePath = storedCurrent;
      } else {
        const storedPrev = sessionStorage.getItem('portfolio_previous_route');
        if (storedPrev && storedPrev !== currentPathname) {
          sourcePath = storedPrev;
        }
      }

      if (!sourcePath && typeof document !== 'undefined' && document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          if (
            refUrl.origin === window.location.origin &&
            refUrl.pathname !== currentPathname
          ) {
            sourcePath = refUrl.pathname + refUrl.search + refUrl.hash;
          }
        } catch {
          // Ignore invalid URL
        }
      }

      if (sourcePath) {
        const resolved = resolveNavInfo(sourcePath, fallbackHref, fallbackLabel);
        setNavInfo(resolved);
        setHasHistory(true);
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

    if (hasHistory) {
      e.preventDefault();
      startTransition(() => {
        router.back();
      });
    }
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
