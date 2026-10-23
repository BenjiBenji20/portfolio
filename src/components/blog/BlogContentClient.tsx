'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FiCalendar, FiClock } from 'react-icons/fi';
import type { BlogData, ProjectData, ProjectMediaItem } from '@/types/sanity';
import { PortableTextRenderer } from './PortableTextRenderer';
import { BlogTableOfContents } from './BlogTableOfContents';
import { MediaLightboxModal } from './MediaLightboxModal';

interface BlogContentClientProps {
  blog: BlogData;
  projects?: ProjectData[];
}

export function BlogContentClient({ blog, projects = [] }: BlogContentClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL progressive state: ?media=<key> and ?play=<key> directly derived
  const activeMediaKey = searchParams.get('media');
  const activePlayKey = searchParams.get('play');

  // Extract all media items from the content for the Lightbox gallery
  const allMediaItems = useMemo<ProjectMediaItem[]>(() => {
    if (!blog.content || !Array.isArray(blog.content)) return [];
    return blog.content.filter(
      (item) =>
        item._type === 'projectMediaImage' ||
        item._type === 'projectMediaSanityVideo' ||
        item._type === 'projectMediaYoutube' ||
        item._type === 'projectMediaVimeo'
    ) as ProjectMediaItem[];
  }, [blog.content]);

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

  return (
    <div className="w-full flex flex-col md:flex-row items-start gap-8 lg:gap-10">
      {/* ========================================================= */}
      {/* CENTER / MAIN BODY: Sanity PortableText (No bg-color)     */}
      {/* ========================================================= */}
      <article className="flex-1 min-w-0 bg-transparent text-zinc-100">
        {/* Article Header */}
        <header className="border-b border-zinc-800/80 pb-6 mb-8">
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mb-3 flex-wrap">
            {blog.publishedAt && (
              <span className="flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5 text-zinc-500" />
                {new Date(blog.publishedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
            {blog.readTime && (
              <span className="flex items-center gap-1.5">
                <FiClock className="w-3.5 h-3.5 text-zinc-500" />
                {blog.readTime}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-100">
            {blog.title}
          </h1>
        </header>

        {/* PortableText Narrative Body */}
        {blog.content && (
          <div className="space-y-4">
            <PortableTextRenderer
              value={blog.content}
              activePlayKey={activePlayKey}
              onPlayVideo={handlePlayVideo}
              onOpenLightbox={handleOpenLightbox}
            />
          </div>
        )}
      </article>

      {/* ========================================================= */}
      {/* RIGHT SIDE: Floating Table of Contents ("Projects")       */}
      {/* ========================================================= */}
      <BlogTableOfContents projects={projects} />

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
