import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export const imageBuilder = projectId
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export function urlForImage(source: SanityImageSource | undefined): string | null {
  if (!source) return null;

  // Direct URL fallback if already resolved by GROQ dereference (asset->{ url })
  const directUrl =
    (source as { asset?: { url?: string }; url?: string })?.asset?.url ||
    (source as { url?: string })?.url;

  if (!imageBuilder) return directUrl || null;

  try {
    return imageBuilder.image(source).auto('format').fit('max').url();
  } catch {
    return directUrl || null;
  }
}
