import Link from 'next/link';
import Image from 'next/image';
import { FiCalendar, FiClock, FiArrowRight } from 'react-icons/fi';

export interface BlogItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt?: string;
  readTime?: string;
  imageUrl?: string;
}

export function BlogItemCard({
  item,
  projectSlug,
}: {
  item: BlogItem;
  projectSlug: string;
}) {
  const articleHref = `/blog/${projectSlug}/article`;

  return (
    <article className="group relative flex flex-col justify-between w-full bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-all overflow-hidden shadow-sm">
      {item.imageUrl && (
        <div className="relative w-full aspect-[16/10] bg-zinc-950 border-b border-zinc-800/60 overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />
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

          {/* Excerpt */}
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
            {item.excerpt}
          </p>
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
