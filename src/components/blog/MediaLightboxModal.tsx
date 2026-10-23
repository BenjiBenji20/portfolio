'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiZoomIn,
  FiZoomOut,
  FiRotateCcw,
  FiCalendar,
  FiClock,
  FiPlay,
} from 'react-icons/fi';
import type { ProjectMediaItem } from '@/types/sanity';
import { urlForImage } from '@/sanity/lib/image';

interface MediaLightboxModalProps {
  mediaItems: ProjectMediaItem[];
  activeKey: string | null;
  onClose: () => void;
  onSelectMedia: (key: string) => void;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1` : null;
}

function getYouTubeThumbnailUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1` : null;
}

function resolveMediaImageUrl(source: unknown): string | null {
  if (!source) return null;
  const directUrl =
    (source as { asset?: { url?: string }; url?: string })?.asset?.url ||
    (source as { url?: string })?.url;
  if (directUrl) return directUrl;
  return urlForImage(source as Parameters<typeof urlForImage>[0]);
}

function getItemThumbnail(item: ProjectMediaItem): string | null {
  switch (item._type) {
    case 'projectMediaImage': {
      return resolveMediaImageUrl(item);
    }
    case 'projectMediaSanityVideo': {
      return resolveMediaImageUrl(item.poster);
    }
    case 'projectMediaYoutube': {
      const poster = resolveMediaImageUrl(item.poster);
      if (poster) return poster;
      return getYouTubeThumbnailUrl(item.url);
    }
    case 'projectMediaVimeo': {
      return resolveMediaImageUrl(item.poster);
    }
    default:
      return null;
  }
}

interface LightboxContentProps {
  currentItem: ProjectMediaItem;
  activeIndex: number;
  totalItems: number;
  mediaItems: ProjectMediaItem[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectMedia: (key: string) => void;
}

function LightboxContent({
  currentItem,
  activeIndex,
  totalItems,
  mediaItems,
  onClose,
  onPrev,
  onNext,
  onSelectMedia,
}: LightboxContentProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Smooth mobile touch swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchDeltaX(0);
      setIsSwiping(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX;
    setTouchDeltaX(delta);
  };

  const handleTouchEnd = () => {
    if (!isSwiping || touchStartX === null) return;
    const SWIPE_THRESHOLD = 45;
    if (touchDeltaX < -SWIPE_THRESHOLD) {
      onNext();
    } else if (touchDeltaX > SWIPE_THRESHOLD) {
      onPrev();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
    setIsSwiping(false);
  };

  const getMediaSource = () => {
    switch (currentItem._type) {
      case 'projectMediaImage': {
        const url = resolveMediaImageUrl(currentItem);
        return { type: 'image', url };
      }
      case 'projectMediaSanityVideo': {
        const posterUrl = resolveMediaImageUrl(currentItem.poster);
        return {
          type: 'sanityVideo',
          url: currentItem.asset?.url,
          poster: posterUrl,
        };
      }
      case 'projectMediaYoutube': {
        const posterUrl =
          resolveMediaImageUrl(currentItem.poster) ||
          getYouTubeThumbnailUrl(currentItem.url);
        return {
          type: 'youtube',
          embedUrl: getYouTubeEmbedUrl(currentItem.url),
          poster: posterUrl,
        };
      }
      case 'projectMediaVimeo': {
        const posterUrl = resolveMediaImageUrl(currentItem.poster);
        return {
          type: 'vimeo',
          embedUrl: getVimeoEmbedUrl(currentItem.url),
          poster: posterUrl,
        };
      }
      default:
        return { type: 'unknown' };
    }
  };

  const mediaSource = getMediaSource();
  const description =
    currentItem.description || ('caption' in currentItem ? currentItem.caption : '') || '';
  const isLongDescription = description.length > 110;
  const DESKTOP_DESC_THRESHOLD = 200;
  const isDesktopLongDesc = description.length > DESKTOP_DESC_THRESHOLD;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none overflow-hidden p-0 sm:p-4 md:p-6 lg:p-10 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Pop-up Modal Container: does not cover the whole screen on desktop & ipad */}
      <div
        className="relative w-full h-full sm:h-[85vh] md:h-[88vh] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl bg-zinc-950 border-0 sm:border sm:border-zinc-800 shadow-2xl flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Controls */}
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-300 bg-zinc-900/90 px-3 py-1 border border-zinc-800 rounded-none shadow">
            {activeIndex + 1} / {totalItems}
          </span>
          {mediaSource.type === 'image' && (
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-none">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <FiZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <FiZoomOut className="w-4 h-4" />
              </button>
              {zoomLevel !== 1 && (
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Lightbox"
          className="absolute top-4 right-4 z-40 w-6 h-6 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Split View Container */}
        <div className="w-full h-full flex flex-col md:flex-row min-h-0">
          {/* ========================================================= */}
          {/* LEFT / CENTER: Active Media Viewport                      */}
          {/* ========================================================= */}
          <div
            className="relative flex-1 h-full min-h-0 flex items-center justify-center overflow-hidden p-2 sm:p-6 md:p-8 touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Previous Arrow - Desktop & iPad ONLY (hidden on mobile) */}
            {totalItems > 1 && (
              <button
                type="button"
                onClick={onPrev}
                aria-label="Previous Slide"
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-zinc-950/80 hover:bg-sky-500 text-white border border-zinc-800 items-center justify-center transition-all cursor-pointer"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next Arrow - Desktop & iPad ONLY (hidden on mobile) */}
            {totalItems > 1 && (
              <button
                type="button"
                onClick={onNext}
                aria-label="Next Slide"
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-zinc-950/80 hover:bg-sky-500 text-white border border-zinc-800 items-center justify-center transition-all cursor-pointer"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Media Rendering with smooth mobile touch swipe transform */}
            <div
              className="relative w-full h-full flex items-center justify-center"
              style={{
                transform: isSwiping ? `translateX(${touchDeltaX}px)` : undefined,
                transition: isSwiping ? 'none' : 'transform 0.25s ease-out',
              }}
            >
              {mediaSource.type === 'image' && mediaSource.url && (
                <div
                  className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaSource.url}
                    alt={currentItem.title || 'Enlarged media preview'}
                    className="max-w-full max-h-full object-contain pointer-events-none select-none"
                  />
                </div>
              )}

              {mediaSource.type === 'sanityVideo' && mediaSource.url && (
                <div className="relative w-full h-full flex items-center justify-center max-w-4xl p-2">
                  <video
                    src={mediaSource.url}
                    poster={mediaSource.poster ?? undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-none shadow-2xl"
                  />
                </div>
              )}

              {mediaSource.type === 'youtube' && mediaSource.embedUrl && (
                <div className="relative w-full h-full flex items-center justify-center max-w-4xl aspect-video p-2">
                  {!isPlayingVideo && mediaSource.poster ? (
                    <div
                      className="relative w-full h-full bg-zinc-950 flex items-center justify-center cursor-pointer group"
                      onClick={() => setIsPlayingVideo(true)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaSource.poster}
                        alt={currentItem.title || 'YouTube thumbnail'}
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        aria-label="Play video"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-zinc-950/90 group-hover:bg-sky-500 text-white border border-zinc-700 flex items-center justify-center transition-all shadow-2xl cursor-pointer"
                      >
                        <FiPlay className="w-6 h-6 ml-0.5 fill-current" />
                      </button>
                    </div>
                  ) : (
                    <iframe
                      src={mediaSource.embedUrl}
                      title={currentItem.title || 'YouTube video'}
                      className="w-full h-full border-0 shadow-2xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              )}

              {mediaSource.type === 'vimeo' && mediaSource.embedUrl && (
                <div className="relative w-full h-full flex items-center justify-center max-w-4xl aspect-video p-2">
                  {!isPlayingVideo && mediaSource.poster ? (
                    <div
                      className="relative w-full h-full bg-zinc-950 flex items-center justify-center cursor-pointer group"
                      onClick={() => setIsPlayingVideo(true)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaSource.poster}
                        alt={currentItem.title || 'Vimeo thumbnail'}
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        aria-label="Play video"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-zinc-950/90 group-hover:bg-sky-500 text-white border border-zinc-700 flex items-center justify-center transition-all shadow-2xl cursor-pointer"
                      >
                        <FiPlay className="w-6 h-6 ml-0.5 fill-current" />
                      </button>
                    </div>
                  ) : (
                    <iframe
                      src={mediaSource.embedUrl}
                      title={currentItem.title || 'Vimeo video'}
                      className="w-full h-full border-0 shadow-2xl"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* MOBILE ONLY: Bottom Description OVERLAY (NO CARD)         */}
            {/* ========================================================= */}
            <div className="block md:hidden absolute inset-x-0 bottom-0 z-30 pointer-events-auto bg-gradient-to-t from-black/95 via-black/85 to-transparent px-4 pt-12 pb-6">
              <div className="space-y-2">
                {currentItem.publishedAt && (
                  <div className="text-[10px] font-mono text-zinc-400">
                    {new Date(currentItem.publishedAt).toLocaleDateString()}
                  </div>
                )}

                {currentItem.title && (
                  <h3 className="text-sm font-bold text-zinc-100">
                    {currentItem.title}
                  </h3>
                )}

                {/* Backlinks */}
                {currentItem.backlinks && currentItem.backlinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 py-1">
                    {currentItem.backlinks.map((link, idx) => (
                      <a
                        key={link._key || idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-sky-400"
                      >
                        <span>{link.platform}</span>
                        <FiExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Mobile Description with Read more... */}
                {description && (
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    {!isLongDescription ? (
                      <p>{description}</p>
                    ) : !isMobileExpanded ? (
                      <p>
                        <span>{description.slice(0, 110)}... </span>
                        <button
                          type="button"
                          onClick={() => setIsMobileExpanded(true)}
                          className="text-sky-400 hover:text-sky-300 font-medium inline underline ml-1 cursor-pointer"
                        >
                          Read more...
                        </button>
                      </p>
                    ) : (
                      <div className="max-h-36 overflow-y-auto pr-1 text-zinc-200 scrollbar-thin scrollbar-thumb-zinc-700">
                        <p>{description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* DESKTOP & IPAD ONLY: Right-Side Details Panel (Fixed)      */}
          {/* ========================================================= */}
          <aside className="hidden md:flex w-80 lg:w-96 shrink-0 h-full flex-col justify-between border-l border-zinc-800 bg-zinc-950/95 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <div className="space-y-5">
              {/* Read Time */}
              {currentItem.readTime && (
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {currentItem.readTime}
                    </span>
                  </div>
                </div>
              )}

              {/* Media Title */}
              <div>
                <h2 className="text-base lg:text-lg font-bold text-zinc-100 tracking-tight">
                  {currentItem.title || 'Media Details'}
                </h2>
                {currentItem.publishedAt && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                    <FiCalendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{new Date(currentItem.publishedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Backlinks */}
              {currentItem.backlinks && currentItem.backlinks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Also read in
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentItem.backlinks.map((link, idx) => (
                      <a
                        key={link._key || idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 text-zinc-200 hover:text-sky-400 transition-colors"
                      >
                        <span>{link.platform}</span>
                        <FiExternalLink className="w-3 h-3 text-zinc-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Description */}
              {description && (
                <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                  {!isDesktopLongDesc ? (
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                  ) : !isDesktopExpanded ? (
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <span>{description.slice(0, DESKTOP_DESC_THRESHOLD)}... </span>
                      <button
                        type="button"
                        onClick={() => setIsDesktopExpanded(true)}
                        className="text-sky-400 hover:text-sky-300 font-medium inline underline ml-1 cursor-pointer"
                      >
                        Read more...
                      </button>
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <div className="max-h-48 overflow-y-auto pr-1 text-xs text-zinc-300 leading-relaxed whitespace-pre-line scrollbar-thin scrollbar-thumb-zinc-700">
                        <p>{description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDesktopExpanded(false)}
                        className="text-zinc-500 hover:text-zinc-300 text-[10px] font-mono underline cursor-pointer"
                      >
                        Show less
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filmstrip at the bottom of the sidebar displaying media thumbnails */}
            {mediaItems.length > 1 && (
              <div className="pt-6 border-t border-zinc-800/80 mt-6 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Medias ({mediaItems.length})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {mediaItems.map((item, idx) => {
                    const isActive = item._key === currentItem._key;
                    const thumbUrl = getItemThumbnail(item);
                    return (
                      <button
                        key={item._key || idx}
                        type="button"
                        onClick={() => onSelectMedia(item._key)}
                        aria-label={`Select media ${idx + 1}`}
                        className={`relative w-12 h-12 shrink-0 border rounded-none overflow-hidden transition-all cursor-pointer ${
                          isActive
                            ? 'border-sky-400 ring-1 ring-sky-400 scale-105'
                            : 'border-zinc-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {thumbUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={thumbUrl}
                            alt={item.title || `Media ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-zinc-400">
                            {item._type === 'projectMediaSanityVideo' ||
                            item._type === 'projectMediaYoutube' ||
                            item._type === 'projectMediaVimeo' ? (
                              <FiPlay className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export function MediaLightboxModal({
  mediaItems,
  activeKey,
  onClose,
  onSelectMedia,
}: MediaLightboxModalProps) {
  const activeIndex = mediaItems.findIndex((item) => item._key === activeKey);
  const currentItem = activeIndex !== -1 ? mediaItems[activeIndex] : null;

  // Disable outside scroll when lightbox is on
  useEffect(() => {
    if (!activeKey) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activeKey]);

  const handleNext = useCallback(() => {
    if (mediaItems.length <= 1) return;
    const nextIdx = (activeIndex + 1) % mediaItems.length;
    onSelectMedia(mediaItems[nextIdx]._key);
  }, [activeIndex, mediaItems, onSelectMedia]);

  const handlePrev = useCallback(() => {
    if (mediaItems.length <= 1) return;
    const prevIdx = (activeIndex - 1 + mediaItems.length) % mediaItems.length;
    onSelectMedia(mediaItems[prevIdx]._key);
  }, [activeIndex, mediaItems, onSelectMedia]);

  // Keyboard navigation: Escape to close, arrows for next/prev
  useEffect(() => {
    if (!activeKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeKey, onClose, handleNext, handlePrev]);

  if (!activeKey || !currentItem) return null;

  return (
    <LightboxContent
      key={activeKey}
      currentItem={currentItem}
      activeIndex={activeIndex}
      totalItems={mediaItems.length}
      mediaItems={mediaItems}
      onClose={onClose}
      onPrev={handlePrev}
      onNext={handleNext}
      onSelectMedia={onSelectMedia}
    />
  );
}
