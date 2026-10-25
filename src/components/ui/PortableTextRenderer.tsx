'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PortableText, type PortableTextComponents } from 'next-sanity';
import { FiPlay, FiMaximize2 } from 'react-icons/fi';
import type {
  ProjectMediaImageItem,
  ProjectMediaSanityVideoItem,
  ProjectMediaYouTubeItem,
  ProjectMediaVimeoItem,
} from '@/types/sanity';
import { urlForImage } from '@/sanity/lib/image';
import { AmbientImage } from '@/components/ui/AmbientImage';
import { MermaidRenderer } from '@/components/ui/MermaidRenderer';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractTocFromBlocks(blocks: any[] = []): TocItem[] {
  const items: TocItem[] = [];

  blocks.forEach((block) => {
    if (block._type === 'block' && (block.style === 'h2' || block.style === 'h3')) {
      // @ts-expect-error extracting block text
      const text = block.children?.map((c) => c.text).join('') || '';
      if (text.trim()) {
        const id = slugify(text);
        items.push({
          id,
          text,
          level: block.style === 'h2' ? 2 : 3,
        });
      }
    }
  });

  return items;
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

export interface PortableTextRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any[];
  activePlayKey?: string | null;
  onPlayVideo?: (key: string) => void;
  onOpenLightbox?: (key: string) => void;
  className?: string;
}

export function PortableTextRenderer({
  value,
  activePlayKey,
  onPlayVideo,
  onOpenLightbox,
  className = '',
}: PortableTextRendererProps) {
  const [localPlayingKey, setLocalPlayingKey] = useState<string | null>(null);

  const isVideoPlaying = (key: string) => {
    return activePlayKey === key || localPlayingKey === key;
  };

  const handlePlay = (key: string) => {
    setLocalPlayingKey(key);
    if (onPlayVideo) onPlayVideo(key);
  };

  const components: PortableTextComponents = {
    block: {
      normal: ({ children }) => {
        // Handle inline markdown fenced mermaid block if author typed ```mermaid in a standard block
        const textContent = Array.isArray(children)
          ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
          : typeof children === 'string'
          ? children
          : '';

        const mermaidMatch = textContent.trim().match(/^```mermaid\s*([\s\S]*?)\s*```$/i);
        if (mermaidMatch && mermaidMatch[1]) {
          return <MermaidRenderer chart={mermaidMatch[1].trim()} />;
        }

        return (
          <p className="text-sm sm:text-base leading-relaxed text-zinc-300 font-normal my-3">
            {children}
          </p>
        );
      },
      h1: ({ children }) => {
        const text = Array.isArray(children) ? children.join('') : String(children ?? '');
        const id = slugify(text);
        return (
          <h1
            id={id}
            className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 mt-8 mb-4 pt-4 border-t border-zinc-800/80"
          >
            {children}
          </h1>
        );
      },
      h2: ({ children }) => {
        const text = Array.isArray(children) ? children.join('') : String(children ?? '');
        const id = slugify(text);
        return (
          <h2
            id={id}
            className="scroll-mt-24 text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-zinc-100 mt-6 mb-3 flex items-center gap-2"
          >
            <span>{children}</span>
          </h2>
        );
      },
      h3: ({ children }) => {
        const text = Array.isArray(children) ? children.join('') : String(children ?? '');
        const id = slugify(text);
        return (
          <h3
            id={id}
            className="scroll-mt-24 text-base sm:text-lg font-semibold tracking-tight text-zinc-200 mt-5 mb-2"
          >
            {children}
          </h3>
        );
      },
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-sky-400 pl-4 py-1 my-3 italic text-zinc-400 text-sm sm:text-base bg-zinc-900/30">
          {children}
        </blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul className="list-disc list-outside ml-6 space-y-1.5 my-3 text-sm sm:text-base text-zinc-300">
          {children}
        </ul>
      ),
      number: ({ children }) => (
        <ol className="list-decimal list-outside ml-6 space-y-1.5 my-3 text-sm sm:text-base text-zinc-300">
          {children}
        </ol>
      ),
    },
    marks: {
      strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
      em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
      code: ({ children }) => (
        <code className="px-1.5 py-0.5 rounded-none bg-zinc-900 text-sky-300 font-mono text-xs border border-zinc-800">
          {children}
        </code>
      ),
      link: ({ value, children }) => (
        <Link
          href={value?.href || '#'}
          target={value?.href?.startsWith('http') ? '_blank' : undefined}
          rel={value?.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-sky-400 hover:text-sky-300 underline underline-offset-4 decoration-sky-400/40 hover:decoration-sky-300 transition-colors"
        >
          {children}
        </Link>
      ),
    },
    types: {
      // 1. Image Block with Ambient Backdrop and Lightbox Trigger
      projectMediaImage: ({ value }: { value: ProjectMediaImageItem }) => {
        const itemKey = value._key;
        const imageUrl =
          value.asset?.url ||
          (value as unknown as { asset?: { _ref?: string } }).asset?._ref
            ? urlForImage(value as unknown as Parameters<typeof urlForImage>[0])
            : null;

        if (!imageUrl) return null;

        return (
          <figure className="my-5 border border-zinc-800/80 bg-zinc-950/60 overflow-hidden group">
            <div
              className="relative w-full aspect-[16/10] overflow-hidden cursor-pointer bg-zinc-950"
              onClick={() => onOpenLightbox && onOpenLightbox(itemKey)}
            >
              <AmbientImage
                src={imageUrl}
                alt={value.alt || value.title || 'Blog media preview'}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px"
                unoptimized
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenLightbox) onOpenLightbox(itemKey);
                }}
                className="absolute top-3 right-3 z-20 w-8 h-8 bg-zinc-950/80 hover:bg-sky-500 text-white border border-zinc-700/80 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Enlarge Image"
              >
                <FiMaximize2 className="w-4 h-4" />
              </button>
            </div>

          </figure>
        );
      },

      // 2. Native Sanity Video Block (Lazy Facade)
      projectMediaSanityVideo: ({ value }: { value: ProjectMediaSanityVideoItem }) => {
        const itemKey = value._key;
        const isPlaying = isVideoPlaying(itemKey);
        const videoUrl = value.asset?.url;
        const posterUrl =
          value.poster?.asset?.url ||
          (value.poster ? urlForImage(value.poster) : null);

        if (!videoUrl) return null;

        return (
          <div className="my-5 border border-zinc-800/80 bg-zinc-950/60 overflow-hidden">
            <div className="relative w-full aspect-[16/9] bg-zinc-950 flex items-center justify-center">
              {isPlaying ? (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <div
                  className="relative w-full h-full bg-zinc-950 flex items-center justify-center cursor-pointer group"
                  onClick={() => handlePlay(itemKey)}
                >
                  {posterUrl && (
                    <div className="absolute inset-0 pointer-events-none">
                      <AmbientImage
                        src={posterUrl}
                        alt={value.title || 'Video poster preview'}
                        sizes="(max-width: 768px) 100vw, 900px"
                        unoptimized
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(itemKey);
                    }}
                    className="relative z-20 w-12 h-12 bg-zinc-950/85 hover:bg-sky-500 text-white border border-zinc-700/80 flex items-center justify-center transition-all shadow-xl hover:scale-105 cursor-pointer"
                    title="Play Video"
                  >
                    <FiPlay className="w-5 h-5 ml-0.5 fill-current" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      },

      // 3. YouTube Embed Video Block (Lazy Facade)
      projectMediaYoutube: ({ value }: { value: ProjectMediaYouTubeItem }) => {
        const itemKey = value._key;
        const isPlaying = isVideoPlaying(itemKey);
        const embedUrl = getYouTubeEmbedUrl(value.url);
        const posterUrl =
          value.poster?.asset?.url ||
          (value.poster ? urlForImage(value.poster) : null) ||
          getYouTubeThumbnailUrl(value.url);

        if (!embedUrl) return null;

        return (
          <div className="my-5 border border-zinc-800/80 bg-zinc-950/60 overflow-hidden">
            <div className="relative w-full aspect-[16/9] bg-zinc-950 flex items-center justify-center">
              {isPlaying ? (
                <iframe
                  src={embedUrl}
                  title={value.title || 'YouTube video'}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div
                  className="relative w-full h-full bg-zinc-950 flex items-center justify-center cursor-pointer group"
                  onClick={() => handlePlay(itemKey)}
                >
                  {posterUrl && (
                    <div className="absolute inset-0 pointer-events-none">
                      <AmbientImage
                        src={posterUrl}
                        alt={value.title || 'YouTube video thumbnail'}
                        sizes="(max-width: 768px) 100vw, 900px"
                        unoptimized
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(itemKey);
                    }}
                    className="relative z-20 w-12 h-12 bg-zinc-950/85 hover:bg-sky-500 text-white border border-zinc-700/80 flex items-center justify-center transition-all shadow-xl hover:scale-105 cursor-pointer"
                    title="Play YouTube Video"
                  >
                    <FiPlay className="w-5 h-5 ml-0.5 fill-current" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      },

      // 4. Vimeo Embed Video Block (Lazy Facade)
      projectMediaVimeo: ({ value }: { value: ProjectMediaVimeoItem }) => {
        const itemKey = value._key;
        const isPlaying = isVideoPlaying(itemKey);
        const embedUrl = getVimeoEmbedUrl(value.url);
        const posterUrl =
          value.poster?.asset?.url ||
          (value.poster ? urlForImage(value.poster) : null);

        if (!embedUrl) return null;

        return (
          <div className="my-5 border border-zinc-800/80 bg-zinc-950/60 overflow-hidden">
            <div className="relative w-full aspect-[16/9] bg-zinc-950 flex items-center justify-center">
              {isPlaying ? (
                <iframe
                  src={embedUrl}
                  title={value.title || 'Vimeo video'}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div
                  className="relative w-full h-full bg-zinc-950 flex items-center justify-center cursor-pointer group"
                  onClick={() => handlePlay(itemKey)}
                >
                  {posterUrl ? (
                    <div className="absolute inset-0 pointer-events-none">
                      <AmbientImage
                        src={posterUrl}
                        alt={value.title || 'Vimeo video thumbnail'}
                        sizes="(max-width: 768px) 100vw, 900px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center text-zinc-600">
                      <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-500">
                        {value.title || 'Vimeo Video'}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(itemKey);
                    }}
                    className="relative z-20 w-12 h-12 bg-zinc-950/85 hover:bg-sky-500 text-white border border-zinc-700/80 flex items-center justify-center transition-all shadow-xl hover:scale-105 cursor-pointer"
                    title="Play Vimeo Video"
                  >
                    <FiPlay className="w-5 h-5 ml-0.5 fill-current" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      },

      // 5. Code Block with Mermaid Diagram Detection
      code: ({ value }: { value: { code?: string; language?: string; filename?: string } }) => {
        const rawCode = value.code || '';
        const language = (value.language || 'text').toLowerCase();

        if (language === 'mermaid') {
          return <MermaidRenderer chart={rawCode} />;
        }

        return (
          <div className="my-5 overflow-hidden border border-zinc-800/80 bg-zinc-950">
            {value.filename && (
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-800/80 bg-zinc-900/40 text-[11px] font-mono text-zinc-400">
                <span>{value.filename}</span>
                <span className="uppercase text-zinc-500">{language}</span>
              </div>
            )}
            <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700">
              <code>{rawCode}</code>
            </pre>
          </div>
        );
      },

      // 6. Direct Mermaid Block Support (if authored as mermaidDiagram or mermaid block)
      mermaid: ({ value }: { value: { chart?: string; code?: string } }) => {
        return <MermaidRenderer chart={value.chart || value.code || ''} />;
      },
      mermaidDiagram: ({ value }: { value: { chart?: string; code?: string } }) => {
        return <MermaidRenderer chart={value.chart || value.code || ''} />;
      },
    },
  };

  return (
    <div className={`portable-text-container ${className}`}>
      <PortableText value={value} components={components} />
    </div>
  );
}
