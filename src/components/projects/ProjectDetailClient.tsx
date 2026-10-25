'use client';

import { useMemo, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { ProjectData, ProjectMediaItem } from '@/types/sanity';
import { ProjectPreview } from '@/components/ui/ProjectPreview';
import {
  PortableTextRenderer,
  extractTocFromBlocks,
  normalizeMermaidBlocks,
} from '@/components/ui/PortableTextRenderer';
import { TabNavRightSidebar, type TabNavItem } from '@/components/ui/TabNavRightSidebar';
import { MediaLightboxModal } from '@/components/ui/MediaLightboxModal';

interface ProjectDetailClientProps {
  project: ProjectData;
}

function ProjectDetailClientInternal({ project }: ProjectDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL progressive state: ?media=<key> and ?play=<key> directly derived
  const activeMediaKey = searchParams.get('media');
  const activePlayKey = searchParams.get('play');

  // Extract all media items from the project content for the Lightbox gallery
  const allMediaItems = useMemo<ProjectMediaItem[]>(() => {
    if (!project.content || !Array.isArray(project.content)) return [];
    const normalized = normalizeMermaidBlocks(project.content);
    return normalized.filter(
      (item) =>
        item._type === 'projectMediaImage' ||
        item._type === 'projectMediaSanityVideo' ||
        item._type === 'projectMediaYoutube' ||
        item._type === 'projectMediaVimeo' ||
        item._type === 'mermaid'
    ) as ProjectMediaItem[];
  }, [project.content]);

  // Extract headings (h2/h3) from Portable Text blocks for sticky Table of Contents
  const tocItems = useMemo<TabNavItem[]>(() => {
    if (!project.content || !Array.isArray(project.content)) return [];
    const extracted = extractTocFromBlocks(project.content);
    return extracted.map((item) => ({
      id: item.id,
      label: item.text,
      href: `#${item.id}`,
    }));
  }, [project.content]);

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

  const hasContent = Boolean(project.content && project.content.length > 0);

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-200">
      {/* 1. Top Project Preview (Carousel, Metadata, Links, Stacks) */}
      <ProjectPreview
        project={project}
        backHref="/projects"
        backLabel="Back to Projects"
      />

      {/* 2. Project Body Section: Portable Text narrative + Section-based Table of Contents */}
      {hasContent && (
        <div className="pt-8 border-t border-zinc-800/80">
          <div className="w-full flex flex-col md:flex-row items-start gap-8 lg:gap-10">
            {/* Main PortableText Body */}
            <article className="flex-1 min-w-0 space-y-6 text-zinc-100">
              <div className="border-b border-zinc-800/80 pb-3">
                <span className="font-mono text-xs uppercase tracking-widest text-sky-400">
                  Engineering Breakdown
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mt-1">
                  Architecture & Technical Details
                </h2>
              </div>

              <div className="space-y-4">
                <PortableTextRenderer
                  value={project.content!}
                  activePlayKey={activePlayKey}
                  onPlayVideo={handlePlayVideo}
                  onOpenLightbox={handleOpenLightbox}
                />
              </div>
            </article>

            {/* Right Sidebar: Table of Contents */}
            {tocItems.length > 0 && (
              <TabNavRightSidebar
                title="Table of Contents"
                items={tocItems}
                emptyText="No sections found"
              />
            )}
          </div>
        </div>
      )}

      {/* 3. Modal Lightbox for Project Media and Diagrams */}
      <MediaLightboxModal
        mediaItems={allMediaItems}
        activeKey={activeMediaKey}
        onClose={handleCloseLightbox}
        onSelectMedia={handleSelectMedia}
      />
    </div>
  );
}

export function ProjectDetailClient(props: ProjectDetailClientProps) {
  return (
    <Suspense fallback={null}>
      <ProjectDetailClientInternal {...props} />
    </Suspense>
  );
}
