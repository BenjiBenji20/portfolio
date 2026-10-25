'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  FiBookOpen,
  FiActivity,
  FiClock,
  FiGitCommit,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp,
  FiUsers,
  FiUser,
} from 'react-icons/fi';
import type { ArticleData, WorkLogData, ProjectMediaItem } from '@/types/sanity';
import { urlForImage } from '@/sanity/lib/image';
import { BlogItemCard, type BlogItem } from './BlogItemCard';
import { PortableTextRenderer } from '@/components/ui/PortableTextRenderer';
import { MediaLightboxModal } from '@/components/ui/MediaLightboxModal';

interface ProjectBlogTabsProps {
  projectSlug: string;
  projectTitle: string;
  articles?: ArticleData[];
  workLogs?: WorkLogData[];
  repositoryUrl?: string;
}

function WorkLogRow({
  log,
  repositoryUrl,
  activePlayKey,
  onPlayVideo,
  onOpenLightbox,
}: {
  log: WorkLogData;
  repositoryUrl?: string;
  activePlayKey?: string | null;
  onPlayVideo?: (key: string) => void;
  onOpenLightbox?: (key: string) => void;
}) {
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);

  const hasFooterContent = Boolean(
    log.commitSha ||
    (log.backlinks && log.backlinks.length > 0) ||
    (log.developers && log.developers.length > 0) ||
    log.author
  );

  const commitLink =
    log.commitSha && repositoryUrl
      ? `${repositoryUrl.replace(/\/$/, '')}/commit/${log.commitSha}`
      : undefined;

  const formattedDate = log.date
    ? log.date.includes('T')
      ? new Date(log.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      : log.date
    : '';

  return (
    <div className="relative group border-b border-zinc-800/40 pb-6 last:border-b-0 space-y-3">
      {/* Header: Title, Badge, Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 flex-wrap">
          <span>{log.title}</span>
          <span className="text-[10px] font-mono text-sky-400 bg-sky-950/40 px-2 py-0.5 border border-sky-800/40">
            {log.badge}
          </span>
        </h4>
        <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 shrink-0">
          <FiClock className="w-3 h-3 text-zinc-500" />
          {formattedDate}
        </span>
      </div>

      {/* Body: Portable Text (Rich text, screenshots, videos, Mermaid diagrams) or legacy description */}
      <div className="text-xs text-zinc-300">
        {log.content && log.content.length > 0 ? (
          <PortableTextRenderer
            value={log.content}
            activePlayKey={activePlayKey}
            onPlayVideo={onPlayVideo}
            onOpenLightbox={onOpenLightbox}
          />
        ) : log.description ? (
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl whitespace-pre-line">
            {log.description}
          </p>
        ) : null}
      </div>

      {/* Collapsible Footer Trigger */}
      {hasFooterContent && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsFooterExpanded(!isFooterExpanded)}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-sky-400 cursor-pointer transition-colors"
          >
            {isFooterExpanded ? (
              <FiChevronUp className="w-3 h-3" />
            ) : (
              <FiChevronDown className="w-3 h-3" />
            )}
            <span>
              {isFooterExpanded ? 'Hide Details' : 'Details (Commit, Links, Authors)'}
            </span>
          </button>

          {/* Collapsible Footer Content */}
          {isFooterExpanded && (
            <div className="mt-2.5 p-3 bg-zinc-900/60 border border-zinc-800/80 space-y-2.5 animate-in fade-in duration-150 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                {/* Author Badge */}
                {log.author && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-300">
                    {log.author === 'Agentic Writer' ? (
                      <span className="text-sky-400">🤖 Agentic Writer</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-zinc-300">
                        <FiUser className="w-3 h-3 text-zinc-400" />
                        <span>Human Author</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Commit SHA */}
                {log.commitSha && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-300">
                    <FiGitCommit className="w-3 h-3 text-sky-400" />
                    {commitLink ? (
                      <a
                        href={commitLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white underline decoration-zinc-600 underline-offset-2 flex items-center gap-1"
                      >
                        <span>{log.commitSha.slice(0, 7)}</span>
                        <FiExternalLink className="w-2.5 h-2.5 text-zinc-500" />
                      </a>
                    ) : (
                      <span>{log.commitSha.slice(0, 7)}</span>
                    )}
                  </div>
                )}

                {/* Contributing Developers */}
                {log.developers && log.developers.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1 text-zinc-500">
                      <FiUsers className="w-3 h-3" />
                      <span>Contributors:</span>
                    </span>
                    {log.developers.map((dev, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-200"
                      >
                        {dev}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Reference Backlinks */}
              {log.backlinks && log.backlinks.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    References:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {log.backlinks.map((link, idx) => (
                      <a
                        key={link._key || idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-sky-400 hover:border-zinc-700 transition-colors"
                      >
                        <span>{link.platform}</span>
                        <FiExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectBlogTabsContent({
  projectSlug,
  projectTitle,
  articles = [],
  workLogs = [],
  repositoryUrl,
}: ProjectBlogTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL progressive state: ?tab=articles (default) vs ?tab=worklog
  const tabParam = searchParams.get('tab');
  const activeTab: 'articles' | 'worklog' =
    tabParam === 'worklog' || tabParam === 'work-log' ? 'worklog' : 'articles';

  // URL progressive state for worklog media: ?media=<key> and ?play=<key>
  const activeMediaKey = searchParams.get('media');
  const activePlayKey = searchParams.get('play');

  // Extract all media items from workLogs for Lightbox support
  const allWorkLogMediaItems = useMemo<ProjectMediaItem[]>(() => {
    const items: ProjectMediaItem[] = [];
    workLogs.forEach((log) => {
      if (log.content && Array.isArray(log.content)) {
        log.content.forEach((block) => {
          if (
            block._type === 'projectMediaImage' ||
            block._type === 'projectMediaSanityVideo' ||
            block._type === 'projectMediaYoutube' ||
            block._type === 'projectMediaVimeo'
          ) {
            items.push(block as ProjectMediaItem);
          }
        });
      }
    });
    return items;
  }, [workLogs]);

  const handleOpenLightbox = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('media', key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCloseLightbox = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('media');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleSelectMedia = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('media', key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePlayVideo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('play', key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (newTab: 'articles' | 'worklog') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Filter visible articles (hidden !== true) and adapt to BlogItem interface
  const displayArticles: BlogItem[] = articles
    .filter((art) => !art.hidden)
    .map((art, idx) => {
      const slugVal =
        typeof art.slug === 'string' ? art.slug : art.slug?.current || `article-${idx}`;
      const formattedDate = art.publishedAt
        ? art.publishedAt.includes('T')
          ? new Date(art.publishedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
          : art.publishedAt
        : undefined;

      let resolvedImageUrl: string | undefined = art.imageUrl;
      if (!resolvedImageUrl && art.coverImage) {
        resolvedImageUrl =
          urlForImage(art.coverImage) ||
          (art.coverImage.asset as { url?: string } | undefined)?.url;
      }

      return {
        id: art._id || `art-${idx}`,
        slug: slugVal,
        title: art.title,
        excerpt: art.excerpt,
        publishedAt: formattedDate,
        readTime: art.readTime,
        imageUrl: resolvedImageUrl,
      };
    });

  return (
    <div className="space-y-6">
      {/* Top Tab Bar: Articles (Default) & Work Log (Dev Log) */}
      <div className="flex items-center justify-between border-b border-zinc-800/80">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('articles')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'articles'
              ? 'text-sky-400 font-bold border-b-2 border-sky-400 bg-sky-950/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
          >
            <FiBookOpen className="w-3.5 h-3.5" />
            <span>Articles</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('worklog')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'worklog'
              ? 'text-sky-400 font-bold border-b-2 border-sky-400 bg-sky-950/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
          >
            <FiActivity className="w-3.5 h-3.5" />
            <span>Work Log</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline-block">
          {activeTab === 'articles' ? 'Curated Technical Articles' : 'Engineering Milestones'}
        </span>
      </div>

      {/* Main Body */}
      {activeTab === 'articles' ? (
        /* 2x2 Grid on Desktop & Tablet, 1x1 on Mobile - Layout & UI stay identical */
        displayArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            {displayArticles.map((item) => (
              <BlogItemCard
                key={item.id}
                item={item}
                projectSlug={projectSlug}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-zinc-800 text-zinc-500 text-sm font-mono">
            No published articles available for this project yet.
          </div>
        )
      ) : (
        /* Work Log / Dev Log Timeline with Collapsible Footer */
        workLogs.length > 0 ? (
          <div className="space-y-6">
            {workLogs.map((log) => (
              <WorkLogRow
                key={log._id || log.title}
                log={log}
                repositoryUrl={repositoryUrl}
                activePlayKey={activePlayKey}
                onPlayVideo={handlePlayVideo}
                onOpenLightbox={handleOpenLightbox}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-zinc-800 text-zinc-500 text-sm font-mono">
            No work logs recorded for this project yet.
          </div>
        )
      )}

      {/* Lightbox Modal for Work Log Media */}
      {allWorkLogMediaItems.length > 0 && (
        <MediaLightboxModal
          mediaItems={allWorkLogMediaItems}
          activeKey={activeMediaKey}
          onClose={handleCloseLightbox}
          onSelectMedia={handleSelectMedia}
        />
      )}
    </div>
  );
}

export function ProjectBlogTabs(props: ProjectBlogTabsProps) {
  return (
    <Suspense fallback={null}>
      <ProjectBlogTabsContent {...props} />
    </Suspense>
  );
}
