'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiX, FiFolder } from 'react-icons/fi';
import type { ProjectData } from '@/types/sanity';

export interface TabNavItem {
  id?: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface TabNavRightSidebarProps {
  title?: string;
  route?: string;
  items?: TabNavItem[];
  projects?: ProjectData[];
  emptyText?: string;
}

export function TabNavRightSidebar({
  title = 'Projects',
  route = '/project',
  items,
  projects,
  emptyText = 'No content found',
}: TabNavRightSidebarProps) {
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const resolvedItems: TabNavItem[] = items
    ? items
    : projects
      ? projects.map((project) => {
          const slug =
            typeof project.slug === 'string'
              ? project.slug
              : project.slug?.current || project._id;
          return {
            id: project._id,
            label: project.title,
            href: `${route}/${slug}`,
            icon: (
              <FiFolder className="w-3.5 h-3.5 shrink-0 text-zinc-500 group-hover:text-sky-400 transition-colors" />
            ),
          };
        })
      : [];

  const renderNavList = (onItemClick?: () => void) => {
    if (resolvedItems.length === 0) {
      return (
        <p className="font-mono text-xs text-zinc-500 py-2">{emptyText}</p>
      );
    }

    return (
      <ul className="space-y-1.5 font-mono text-xs">
        {resolvedItems.map((item, idx) => {
          const key = item.id || item.href || idx;
          const isSectionAnchor = item.href.startsWith('#');

          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (isSectionAnchor) {
              const targetId = item.href.slice(1);
              const targetElement = document.getElementById(targetId);
              if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.pushState(null, '', item.href);
              }
            }
            if (onItemClick) {
              onItemClick();
            }
          };

          return (
            <li key={key}>
              <Link
                href={item.href}
                onClick={handleClick}
                className="w-full text-left py-1.5 px-2 rounded-none transition-colors flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 group"
              >
                {item.icon ?? (
                  <FiFolder className="w-3.5 h-3.5 shrink-0 text-zinc-500 group-hover:text-sky-400 transition-colors" />
                )}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP & TABLET/IPAD: Sticky Floating Right Column       */}
      {/* ========================================================= */}
      <aside className="hidden md:block w-56 lg:w-64 shrink-0 sticky top-24 self-start">
        <div className="max-h-[calc(100vh-8rem)] flex flex-col rounded-none bg-zinc-950/60 backdrop-blur-sm p-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 mb-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-200 font-bold flex items-center gap-2">
              {title}
            </h3>
          </div>

          {/* Scrollable List */}
          <div className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 flex-1">
            {renderNavList()}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE ONLY: Floating Action Hamburger Button (Top Right) */}
      {/* ========================================================= */}
      <div className="block md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileModalOpen(true)}
          aria-label={`Open ${title}`}
          className="fixed top-16 right-4 z-50 w-11 h-11 bg-zinc-900/95 text-sky-400 border border-zinc-700/90 shadow-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-95 backdrop-blur-md"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        {/* Mobile Compact Modal (Does NOT cover the whole screen) */}
        {isMobileModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setIsMobileModalOpen(false)}
          >
            <div
              className="relative w-full max-w-xs max-h-[70vh] flex flex-col bg-zinc-950 border border-zinc-800 p-4 shadow-2xl animate-in slide-in-from-top duration-200 mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-200 font-bold flex items-center gap-2">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={`Close ${title} Menu`}
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Items */}
              <div className="overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {renderNavList(() => setIsMobileModalOpen(false))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
