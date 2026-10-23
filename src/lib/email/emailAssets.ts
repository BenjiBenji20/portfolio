import path from 'path';
import fs from 'fs';
import type { Attachment } from 'resend';
import { urlForImage } from '@/sanity/lib/image';
import type { SanityImageReference } from '@/types/sanity';

export interface ResolvedEmailIcon {
  src: string;
  attachment?: Attachment;
}

/**
 * Resolves an icon for outbound email templates.
 *
 * 1. If a custom Sanity image is uploaded in Studio, returns the public Sanity CDN URL.
 * 2. If using the fallback logo (portfolio-logo.png), bundles the image as an inline
 *    CID attachment (Content-ID) with Resend. This guarantees that external email
 *    clients (Gmail, Apple Mail, Outlook) render the image immediately, even during
 *    local development where localhost is unreachable by Google's image proxies.
 *
 * @param iconSource - Optional Sanity image reference
 * @param fallbackFilename - File located in public/ (defaults to 'portfolio-logo.png')
 * @param fallbackCid - Content-ID identifier (defaults to 'portfolio-logo')
 */
export function resolveEmailIcon(
  iconSource?: SanityImageReference,
  fallbackFilename: string = 'portfolio-logo.png',
  fallbackCid: string = 'portfolio-logo'
): ResolvedEmailIcon {
  // 1. If Sanity image is provided, use Sanity CDN URL
  if (iconSource) {
    const sanityUrl = urlForImage(iconSource);
    if (sanityUrl) {
      return { src: sanityUrl };
    }
  }

  // 2. Read local file for inline CID attachment
  try {
    const filePath = path.join(process.cwd(), 'public', fallbackFilename);
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return {
        src: `cid:${fallbackCid}`,
        attachment: {
          filename: fallbackFilename,
          content: fileBuffer,
          contentId: fallbackCid,
          contentType: 'image/png',
        },
      };
    }
  } catch (err) {
    console.warn('[resolveEmailIcon] Failed to read public asset for inline CID embedding:', err);
  }

  // 3. Fallback remote URL (safe for deployed production)
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_SITE_URL
      : 'https://benjineer.vercel.app';

  return {
    src: `${siteUrl.replace(/\/$/, '')}/${fallbackFilename}`,
  };
}
