import { v2Client } from './sanityClients';

/**
 * Downloads an image asset from the v1 Sanity CDN and uploads it to the v2 dataset.
 * Returns the v2 asset _id (e.g. 'image-...'), or null if download/upload fails.
 */
export async function migrateImageAsset(assetRef: string, dryRun = false): Promise<string | null> {
  if (!assetRef) return null;
  const match = assetRef.match(/^image-([a-f0-9]+)-(\d+x\d+)-([a-z0-9]+)$/);
  if (!match) return null;

  const [, id, dimensions, format] = match;
  const cdnUrl = `https://cdn.sanity.io/images/se9bi4c1/production/${id}-${dimensions}.${format}`;

  if (dryRun) {
    console.log(`    [DRY-RUN] Would download asset from ${cdnUrl}`);
    return `image-${id}-v2-mock`;
  }

  try {
    const response = await fetch(cdnUrl);
    if (!response.ok) {
      console.warn(`    Failed to fetch asset from ${cdnUrl} (Status: ${response.status})`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await v2Client.assets.upload('image', buffer, {
      filename: `${id}.${format}`,
    });

    return uploaded._id;
  } catch (error) {
    console.warn(`    Asset upload failed for ${cdnUrl}:`, error);
    return null;
  }
}

