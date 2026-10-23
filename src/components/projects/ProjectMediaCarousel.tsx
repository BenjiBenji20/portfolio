'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlay,
  FiImage,
} from 'react-icons/fi';
import type { ProjectMediaItem } from '@/types/sanity';
import { urlForImage } from '@/sanity/lib/image';

interface ProjectMediaCarouselProps {
  media?: ProjectMediaItem[];
  title: string;
  className?: string;
  aspectClass?: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&mute=1` : null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1` : null;
}

export function ProjectMediaCarousel({
  media = [],
  title,
  className = '',
  aspectClass = 'aspect-[16/10]',
}: ProjectMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingEmbedKey, setPlayingEmbedKey] = useState<string | null>(null);

  const hasMedia = media && media.length > 0;
  const currentItem = hasMedia ? media[currentIndex] : null;

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMedia) return;
    setPlayingEmbedKey(null);
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMedia) return;
    setPlayingEmbedKey(null);
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  if (!hasMedia || !currentItem) {
    // Stylized technical placeholder with zero radius
    return (
      <div
        className={`relative w-full ${aspectClass} rounded-none bg-zinc-950 overflow-hidden flex items-center justify-center border-b border-zinc-800/60 ${className}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-850 via-zinc-950 to-zinc-950 opacity-80" />
        <div className="relative z-10 flex flex-col items-center gap-2 text-zinc-600">
          <FiImage className="w-8 h-8 stroke-1" />
          <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-500">
            {title}
          </span>
        </div>
      </div>
    );
  }

  const renderMediaContent = () => {
    switch (currentItem._type) {
      case 'projectMediaImage': {
        const imageUrl =
          currentItem.asset?.url ||
          (currentItem as unknown as { asset?: { _ref?: string } }).asset?._ref
            ? urlForImage(currentItem as unknown as Parameters<typeof urlForImage>[0])
            : null;

        if (!imageUrl) {
          return (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500 text-xs font-mono">
              Image unavailable
            </div>
          );
        }

        return (
          <Image
            src={imageUrl}
            alt={currentItem.alt || `${title} preview`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 600px"
            className="object-cover"
            unoptimized
          />
        );
      }

      case 'projectMediaSanityVideo': {
        const videoUrl = currentItem.asset?.url;
        const posterUrl = currentItem.poster
          ? urlForImage(currentItem.poster) ?? undefined
          : undefined;

        if (!videoUrl) {
          return (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500 text-xs font-mono">
              Video source missing
            </div>
          );
        }

        return (
          <video
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        );
      }

      case 'projectMediaYoutube': {
        const isPlaying = playingEmbedKey === currentItem._key;
        const embedUrl = getYouTubeEmbedUrl(currentItem.url);
        const posterUrl = currentItem.poster ? urlForImage(currentItem.poster) : null;

        if (isPlaying && embedUrl) {
          return (
            <iframe
              src={embedUrl}
              title={currentItem.title || `${title} YouTube video`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          );
        }

        // Lazy Facade
        return (
          <div className="relative w-full h-full bg-zinc-900 flex items-center justify-center group/yt">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={currentItem.title || 'YouTube thumbnail'}
                fill
                sizes="(max-width: 768px) 50vw, 600px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-zinc-900" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPlayingEmbedKey(currentItem._key);
              }}
              className="relative z-10 w-11 h-11 bg-zinc-950/80 hover:bg-sky-500 text-white rounded-none border border-zinc-700/80 flex items-center justify-center transition-colors shadow-lg"
              title="Play YouTube Video"
            >
              <FiPlay className="w-5 h-5 ml-0.5 fill-current" />
            </button>
          </div>
        );
      }

      case 'projectMediaVimeo': {
        const isPlaying = playingEmbedKey === currentItem._key;
        const embedUrl = getVimeoEmbedUrl(currentItem.url);
        const posterUrl = currentItem.poster ? urlForImage(currentItem.poster) : null;

        if (isPlaying && embedUrl) {
          return (
            <iframe
              src={embedUrl}
              title={currentItem.title || `${title} Vimeo video`}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          );
        }

        // Lazy Facade
        return (
          <div className="relative w-full h-full bg-zinc-900 flex items-center justify-center group/vim">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={currentItem.title || 'Vimeo thumbnail'}
                fill
                sizes="(max-width: 768px) 50vw, 600px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-zinc-900" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPlayingEmbedKey(currentItem._key);
              }}
              className="relative z-10 w-11 h-11 bg-zinc-950/80 hover:bg-sky-500 text-white rounded-none border border-zinc-700/80 flex items-center justify-center transition-colors shadow-lg"
              title="Play Vimeo Video"
            >
              <FiPlay className="w-5 h-5 ml-0.5 fill-current" />
            </button>
          </div>
        );
      }

      default:
        return (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500 text-xs font-mono">
            Unsupported media format
          </div>
        );
    }
  };

  return (
    <div
      className={`relative w-full ${aspectClass} rounded-none overflow-hidden bg-zinc-950 select-none group/carousel ${className}`}
    >
      {/* Media Element */}
      <div className="absolute inset-0">{renderMediaContent()}</div>

      {/* Subtle Bottom Gradient for seamless visual integration */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent pointer-events-none" />

      {/* Carousel Navigation Overlay (Only when multiple items exist) */}
      {media.length > 1 && (
        <>
          {/* Top-Right Index Pill */}
          <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
            <span className="font-mono text-[10px] tracking-widest text-zinc-300 bg-zinc-950/85 px-2 py-0.5 border border-zinc-800/80 rounded-none backdrop-blur-sm shadow-sm">
              {currentIndex + 1} / {media.length}
            </span>
          </div>

          {/* Left Arrow */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 bg-zinc-950/80 hover:bg-sky-500 text-zinc-300 hover:text-white rounded-none border border-zinc-800/80 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-200"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 bg-zinc-950/80 hover:bg-sky-500 text-zinc-300 hover:text-white rounded-none border border-zinc-800/80 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-200"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1">
            {media.map((item, idx) => (
              <span
                key={item._key || idx}
                className={`h-1 transition-all rounded-none ${
                  idx === currentIndex ? 'w-4 bg-sky-400' : 'w-1.5 bg-zinc-600/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
