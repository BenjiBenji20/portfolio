'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ProjectData } from '@/types/sanity';
import { ProjectCard } from '@/components/projects/ProjectCard';

interface FeaturedProjectsCarouselProps {
  projects: ProjectData[];
}

export function FeaturedProjectsCarousel({ projects }: FeaturedProjectsCarouselProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktopOrTablet, setIsDesktopOrTablet] = useState(false);

  const startXRef = useRef<number>(0);
  const currentDragOffsetRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalProjects = projects.length;

  // Responsive items-per-page detection: 2 items on tablet/desktop (md+), 1 item on mobile (<md)
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsDesktopOrTablet(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsDesktopOrTablet(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 2 items per page on desktop & tablet/iPad, 1 item per page on mobile
  const itemsPerPage = mounted && isDesktopOrTablet ? 2 : 1;
  const totalPages = Math.max(1, Math.ceil(totalProjects / itemsPerPage));

  // Chunk projects into pages based on current viewport capacity
  const pages = useMemo<ProjectData[][]>(() => {
    if (!projects || projects.length === 0) return [];
    const chunks: ProjectData[][] = [];
    for (let i = 0; i < totalProjects; i += itemsPerPage) {
      chunks.push(projects.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [projects, itemsPerPage, totalProjects]);

  // Clamp active page index whenever totalPages changes
  useEffect(() => {
    if (pageIndex >= totalPages && totalPages > 0) {
      setPageIndex(totalPages - 1);
    }
  }, [totalPages, pageIndex]);

  const handleDragStart = (clientX: number) => {
    startXRef.current = clientX;
    currentDragOffsetRef.current = 0;
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!startXRef.current) return;
    const diff = clientX - startXRef.current;
    if (Math.abs(diff) > 5) {
      hasMovedRef.current = true;
    }

    // Apply soft resistance at boundaries
    if ((pageIndex === 0 && diff > 0) || (pageIndex === totalPages - 1 && diff < 0)) {
      setDragOffset(diff * 0.25);
      currentDragOffsetRef.current = diff * 0.25;
    } else {
      setDragOffset(diff);
      currentDragOffsetRef.current = diff;
    }
  }, [pageIndex, totalPages]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 40; // minimum pixels to advance/retreat page
    const diff = currentDragOffsetRef.current;

    if (diff < -threshold && pageIndex < totalPages - 1) {
      setPageIndex((prev) => prev + 1);
    } else if (diff > threshold && pageIndex > 0) {
      setPageIndex((prev) => prev - 1);
    }

    setDragOffset(0);
    currentDragOffsetRef.current = 0;
    startXRef.current = 0;
  }, [isDragging, pageIndex, totalPages]);

  // Touch event handlers for mobile / iPad touchscreens
  const onTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleDragMove(e.touches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse event handlers for desktop click-and-drag
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only drag with left mouse button
    handleDragStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleDragMove(e.clientX);
    }
  };

  const onMouseUp = () => {
    handleDragEnd();
  };

  const onMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  // Prevent accidental link opens when the user was dragging
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasMovedRef.current = false;
    }
  };

  if (!projects || projects.length === 0) {
    return null;
  }

  // Pagination dots: strictly hard-capped at a maximum of 4 dots
  const totalDots = Math.min(totalPages, 4);

  // Derive which dot is active
  const activeDotIndex =
    totalPages <= 4
      ? pageIndex
      : Math.min(3, Math.round((pageIndex / (totalPages - 1)) * 3));

  const handleDotClick = (dotIdx: number) => {
    if (totalPages <= 4) {
      setPageIndex(dotIdx);
    } else {
      const targetPage = Math.round((dotIdx / 3) * (totalPages - 1));
      setPageIndex(targetPage);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Swipeable Viewport across all screen sizes with Hand Pointer */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onClickCapture={handleClickCapture}
        className={`w-full overflow-hidden select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          className={`flex ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{
            transform: `translateX(calc(-${pageIndex * 100}% + ${dragOffset}px))`,
          }}
        >
          {pages.map((pageProjects, pageIdx) => (
            <div
              key={`page-${pageIdx}`}
              className="w-full shrink-0 min-w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 items-start"
            >
              {pageProjects.map((project, pIdx) => {
                const slug =
                  typeof project.slug === 'string'
                    ? project.slug
                    : project.slug?.current || project._id || pIdx;

                return (
                  <ProjectCard
                    key={project._id || slug}
                    project={project}
                    showMedia={true}
                    aspectClass="aspect-[16/10]"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots at footer (hard cap: max 4 dots) */}
      {totalDots > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalDots }).map((_, dotIdx) => {
            const isActive = dotIdx === activeDotIndex;
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={() => handleDotClick(dotIdx)}
                aria-label={`Go to page ${dotIdx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-6 h-1.5 bg-sky-400'
                    : 'w-2 h-1.5 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
