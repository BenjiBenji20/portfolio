'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FiCalendar, FiClock, FiUser, FiUsers } from 'react-icons/fi';
import type { ArticleData, ProjectData, ProjectMediaItem } from '@/types/sanity';
import { PortableTextRenderer, extractTocFromBlocks } from '@/components/ui/PortableTextRenderer';
import { BackButton } from '@/components/ui/BackButton';
import { TabNavRightSidebar, type TabNavItem } from '@/components/ui/TabNavRightSidebar';
import { MediaLightboxModal } from '@/components/ui/MediaLightboxModal';
import { AmbientImage } from '@/components/ui/AmbientImage';
import { urlForImage } from '@/sanity/lib/image';

interface ArticleContentClientProps {
  article: ArticleData;
  project: ProjectData;
  projectSlug: string;
}

export function ArticleContentClient({
  article,
  project,
  projectSlug,
}: ArticleContentClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL progressive state: ?media=<key> and ?play=<key> directly derived
  const activeMediaKey = searchParams.get('media');
  const activePlayKey = searchParams.get('play');

  // Extract all media items from the content for the Lightbox gallery (reused from /blog)
  const allMediaItems = useMemo<ProjectMediaItem[]>(() => {
    if (!article.content || !Array.isArray(article.content)) return [];
    return article.content.filter(
      (item) =>
        item._type === 'projectMediaImage' ||
        item._type === 'projectMediaSanityVideo' ||
        item._type === 'projectMediaYoutube' ||
        item._type === 'projectMediaVimeo'
    ) as ProjectMediaItem[];
  }, [article.content]);

  // Extract headings (h2/h3) from Portable Text blocks for sticky Table of Contents
  const tocItems = useMemo<TabNavItem[]>(() => {
    if (!article.content || !Array.isArray(article.content)) return [];
    const extracted = extractTocFromBlocks(article.content);
    return extracted.map((item) => ({
      id: item.id,
      label: item.text,
      href: `#${item.id}`,
    }));
  }, [article.content]);

  // Handle Lightbox Open (sets ?media=<key> in URL)
  const handleOpenLightbox = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('media', key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Handle Lightbox Close (removes ?media from URL)
  const handleCloseLightbox = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('media');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Handle Lightbox Slide Change
  const handleSelectMedia = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('media', key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Handle Video Play (sets ?play=<key> in URL)
  const handlePlayVideo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('play', key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const formattedDate = article.publishedAt
    ? article.publishedAt.includes('T')
      ? new Date(article.publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      : article.publishedAt
    : undefined;

  let coverImageUrl: string | undefined = article.imageUrl;
  if (!coverImageUrl && article.coverImage) {
    coverImageUrl =
      (article.coverImage.asset as { url?: string } | undefined)?.url ||
      urlForImage(article.coverImage) ||
      undefined;
  }

  return (
    <div className="w-full flex flex-col md:flex-row items-start gap-8 lg:gap-10">
      {/* ========================================================= */}
      {/* MAIN ARTICLE BODY (Reusing PortableText system from /blog) */}
      {/* ========================================================= */}
      <article className="flex-1 min-w-0 space-y-8 animate-in fade-in duration-200 text-zinc-100">
        {/* Top back navigation */}
        <div className="border-b border-zinc-800/80 pb-4">
          <BackButton
            fallbackHref={`/blog/${projectSlug}`}
            fallbackLabel={`Back to ${project.title} Blog`}
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 flex-wrap">
          {/* Article Header */}
          {formattedDate && (
            <span className="flex items-center gap-1.5">
              <FiCalendar className="w-3.5 h-3.5 text-zinc-500" />
              {formattedDate}
            </span>
          )}
          {article.readTime && (
            <span className="flex items-center gap-1.5">
              <FiClock className="w-3.5 h-3.5 text-zinc-500" />
              {article.readTime}
            </span>
          )}
          {/* Cover Image Banner */}
          {coverImageUrl && (
            <div className="relative w-full aspect-[16/9] border border-zinc-800/80 bg-zinc-950/60 overflow-hidden shadow-xl">
              <AmbientImage
                src={coverImageUrl}
                alt={article.coverImage?.alt || article.title}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px"
                priority
              />
            </div>
          )}
        </div>

        <header className="space-y-4 pb-6 border-b border-zinc-800/80">
          <h1 className="text-2xl sm:text-3xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 flex-wrap">
            {article.developers && article.developers.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">
                <FiUsers className="w-3 h-3 text-zinc-500" />
                <span>By: {article.developers.join(', ')}</span>
              </span>
            )}
          </div>

          {article.excerpt && (
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
              {article.excerpt}
            </p>
          )}
        </header>
        {/* PortableText Narrative Body */}
        {article.content && article.content.length > 0 ? (
          <div className="space-y-4">
            <PortableTextRenderer
              value={article.content}
              activePlayKey={activePlayKey}
              onPlayVideo={handlePlayVideo}
              onOpenLightbox={handleOpenLightbox}
            />
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-zinc-800 text-zinc-500 text-sm font-mono">
            Article content is being drafted.
          </div>
        )}
      </article>

      {/* ========================================================= */}
      {/* RIGHT SIDEBAR: Table of Contents (Section Navigation)     */}
      {/* ========================================================= */}
      <TabNavRightSidebar
        title="Table of Contents"
        items={tocItems}
        emptyText="No sections found"
      />

      {/* ========================================================= */}
      {/* MODAL LIGHTBOX: Progressive Media Viewer                  */}
      {/* ========================================================= */}
      <MediaLightboxModal
        mediaItems={allMediaItems}
        activeKey={activeMediaKey}
        onClose={handleCloseLightbox}
        onSelectMedia={handleSelectMedia}
      />
    </div>
  );
}
