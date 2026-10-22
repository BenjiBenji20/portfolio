import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export const imageBuilder = projectId
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export function urlForImage(source: SanityImageSource | undefined): string | null {
  if (!source || !imageBuilder) return null;
  try {
    return imageBuilder.image(source).auto('format').fit('max').url();
  } catch {
    return null;
  }
}
