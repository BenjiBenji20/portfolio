'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiCalendar, FiClock, FiArrowRight } from 'react-icons/fi';
import { AmbientImage } from '@/components/ui/AmbientImage';

export interface BlogItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt?: string;
  readTime?: string;
  imageUrl?: string;
}

const DESCRIPTION_THRESHOLD = 110;

export function BlogItemCard({
  item,
  projectSlug,
}: {
  item: BlogItem;
  projectSlug: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const articleHref = `/blog/${projectSlug}/article`;
  const description = item.excerpt || '';
  const isLongDescription = description.length > DESCRIPTION_THRESHOLD;

  return (
    <article className="group relative flex flex-col justify-between w-full bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-all overflow-hidden shadow-sm">
      {item.imageUrl && (
        <div className="relative w-full aspect-[16/10] border-b border-zinc-800/60 overflow-hidden">
          <AmbientImage
            src={item.imageUrl}
            alt={item.title}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            imageClassName="group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3">
        <div className="space-y-2">
          {/* Metadata: Date and Read time */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 flex-wrap">
            {item.publishedAt && (
              <span className="flex items-center gap-1">
                <FiCalendar className="w-3 h-3 text-zinc-500" />
                {item.publishedAt}
              </span>
            )}
            {item.readTime && (
              <span className="flex items-center gap-1">
                <FiClock className="w-3 h-3 text-zinc-500" />
                {item.readTime}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-zinc-100 group-hover:text-sky-400 transition-colors line-clamp-2">
            <Link href={articleHref}>{item.title}</Link>
          </h3>

          {/* Excerpt with Strictly Locked Height & Read more (No card resize) */}
          {description && (
            <div
              className={`mt-2 h-16 text-xs leading-relaxed ${
                isExpanded
                  ? 'overflow-y-auto pr-1 text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-700'
                  : 'overflow-hidden text-zinc-400'
              }`}
            >
              {!isLongDescription ? (
                <p>{description}</p>
              ) : !isExpanded ? (
                <p>
                  <span>{description.slice(0, DESCRIPTION_THRESHOLD)}... </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsExpanded(true);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-medium cursor-pointer transition-colors inline"
                  >
                    Read more...
                  </button>
                </p>
              ) : (
                <div>
                  <span>{description} </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsExpanded(false);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 text-[11px] font-medium cursor-pointer inline transition-colors"
                  >
                    (less)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Tags and Link */}
        <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
          <Link
            href={articleHref}
            className="inline-flex items-center gap-1 text-xs font-mono text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap"
          >
            <span>Read</span>
            <FiArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}

