'use client';

import Image from 'next/image';

interface AmbientImageProps {
  src: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  className?: string;
  imageClassName?: string;
  blurClassName?: string;
}

/**
 * AmbientImage - Modular utility component that renders a sharp, uncropped
 * foreground image (object-fit: contain) backed by an ambient blurred duplicate
 * (object-fit: cover) with darkened contrast to eliminate awkward empty borders.
 */
export function AmbientImage({
  src,
  alt = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px',
  priority = false,
  unoptimized = false,
  className = '',
  imageClassName = '',
  blurClassName = '',
}: AmbientImageProps) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-zinc-950 flex items-center justify-center select-none ${className}`}
    >
      {/* 1. Ambient Blurred Duplicate (Cover + Blur + Darkened) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <Image
          src={src}
          alt=""
          fill
          aria-hidden="true"
          sizes="20vw"
          unoptimized={unoptimized}
          className={`object-cover scale-110 filter blur-2xl brightness-50 contrast-125 opacity-70 ${blurClassName}`}
        />
      </div>

      {/* 2. Ambient Soft Vignette / Gradient Overlay */}
      <div className="absolute inset-0 bg-zinc-950/25 pointer-events-none" />

      {/* 3. Sharp Foreground Image (Contain - Zero cropping or distortion) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          unoptimized={unoptimized}
          className={`object-contain ${imageClassName}`}
        />
      </div>
    </div>
  );
}
