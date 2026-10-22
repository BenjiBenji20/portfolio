'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGithub } from 'react-icons/fi';
import type { NavRoute } from '@/types/sanity';

const NAV_ROUTES: NavRoute[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Blogs', href: '/blogs' },
];

export function HeaderNav() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 md:px-8">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-100 hover:text-white transition-colors"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
            B
          </span>
          <span>Benjineer</span>
        </Link>

        {/* Canonical Navigation Links: Home, Projects, Blogs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ROUTES.map((route) => {
            const active = isActive(route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`relative px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                  active
                    ? 'text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {route.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-[13px] h-0.5 bg-emerald-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* External Quick Action: GitHub Link */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/BenjiBenji20"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
            className="flex items-center justify-center w-8 h-8 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <FiGithub className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
