'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1` : null;
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
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const getMediaSource = () => {
    switch (currentItem._type) {
      case 'projectMediaImage': {
        const url =
          currentItem.asset?.url ||
          (currentItem as unknown as { asset?: { _ref?: string } }).asset?._ref
            ? urlForImage(currentItem as unknown as Parameters<typeof urlForImage>[0])
            : null;
        return { type: 'image', url };
      }
      case 'projectMediaSanityVideo': {
        const posterUrl = currentItem.poster ? urlForImage(currentItem.poster) : null;
        return {
          type: 'sanityVideo',
          url: currentItem.asset?.url,
          poster: posterUrl,
        };
      }
      case 'projectMediaYoutube': {
        const posterUrl = currentItem.poster ? urlForImage(currentItem.poster) : null;
        return {
          type: 'youtube',
          embedUrl: getYouTubeEmbedUrl(currentItem.url),
          poster: posterUrl,
        };
      }
      case 'projectMediaVimeo': {
        const posterUrl = currentItem.poster ? urlForImage(currentItem.poster) : null;
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

  const getCategoryLabel = () => {
    switch (currentItem._type) {
      case 'projectMediaImage':
        return 'Image Asset';
      case 'projectMediaSanityVideo':
        return 'Native Video';
      case 'projectMediaYoutube':
        return 'YouTube Embed';
      case 'projectMediaVimeo':
        return 'Vimeo Embed';
      default:
        return 'Media Asset';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none overflow-hidden animate-in fade-in duration-200"
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
        className="absolute top-4 right-4 z-40 w-10 h-10 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
      >
        <FiX className="w-5 h-5" />
      </button>

      {/* Split View Container */}
      <div className="w-full h-full flex flex-col md:flex-row">
        {/* ========================================================= */}
        {/* LEFT / CENTER: Active Media Viewport                      */}
        {/* ========================================================= */}
        <div className="relative flex-1 h-full flex items-center justify-center overflow-hidden p-2 sm:p-6 md:p-8">
          {/* Previous Arrow */}
          {totalItems > 1 && (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous Slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-zinc-950/80 hover:bg-sky-500 text-white border border-zinc-800 flex items-center justify-center transition-all cursor-pointer"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Next Arrow */}
          {totalItems > 1 && (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next Slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-zinc-950/80 hover:bg-sky-500 text-white border border-zinc-800 flex items-center justify-center transition-all cursor-pointer"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Media Rendering */}
          <div className="relative w-full h-full flex items-center justify-center">
            {mediaSource.type === 'image' && mediaSource.url && (
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-150"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <Image
                  src={mediaSource.url}
                  alt={currentItem.title || 'Enlarged media preview'}
                  fill
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
            )}

            {mediaSource.type === 'sanityVideo' && mediaSource.url && (
              <div className="relative w-full h-full flex items-center justify-center max-w-4xl">
                <video
                  src={mediaSource.url}
                  poster={mediaSource.poster ?? undefined}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[85vh] object-contain rounded-none shadow-2xl"
                />
              </div>
            )}

            {mediaSource.type === 'youtube' && mediaSource.embedUrl && (
              <div className="relative w-full h-full flex items-center justify-center max-w-4xl aspect-video">
                {!isPlayingVideo && mediaSource.poster ? (
                  <div
                    className="relative w-full h-full bg-zinc-950 flex items-center justify-center cursor-pointer group"
                    onClick={() => setIsPlayingVideo(true)}
                  >
                    <Image
                      src={mediaSource.poster}
                      alt="YouTube poster"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                    <button
                      type="button"
                      className="relative z-10 w-14 h-14 bg-zinc-950/90 group-hover:bg-sky-500 text-white border border-zinc-700 flex items-center justify-center transition-all shadow-2xl"
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
              <div className="relative w-full h-full flex items-center justify-center max-w-4xl aspect-video">
                <iframe
                  src={mediaSource.embedUrl}
                  title={currentItem.title || 'Vimeo video'}
                  className="w-full h-full border-0 shadow-2xl"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* MOBILE ONLY: Bottom Description OVERLAY (NO CARD)         */}
          {/* ========================================================= */}
          <div className="block md:hidden absolute inset-x-0 bottom-0 z-30 pointer-events-auto bg-gradient-to-t from-black/95 via-black/85 to-transparent px-4 pt-12 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5">
                  {getCategoryLabel()}
                </span>
                {currentItem.publishedAt && (
                  <span className="text-[10px] font-mono text-zinc-400">
                    {new Date(currentItem.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

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
        {/* DESKTOP & IPAD ONLY: Right-Side Details Panel (Fixed Sidebar) */}
        {/* ========================================================= */}
        <aside className="hidden md:flex w-80 lg:w-96 shrink-0 h-full flex-col justify-between border-l border-zinc-800 bg-zinc-950/95 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="space-y-5">
            {/* Category & Status Badges */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                {currentItem.readTime && (
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    {currentItem.readTime}
                  </span>
                )}
              </div>
            </div>

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
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}
          </div>

          {/* Filmstrip at the bottom of the sidebar */}
          {mediaItems.length > 1 && (
            <div className="pt-6 border-t border-zinc-800/80 mt-6 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Medias ({mediaItems.length})
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {mediaItems.map((item, idx) => {
                  const isActive = item._key === currentItem._key;
                  return (
                    <button
                      key={item._key || idx}
                      type="button"
                      onClick={() => onSelectMedia(item._key)}
                      className={`relative w-12 h-12 shrink-0 border rounded-none overflow-hidden transition-all cursor-pointer ${
                        isActive
                          ? 'border-sky-400 ring-1 ring-sky-400 scale-105'
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-zinc-400">
                        {idx + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
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
