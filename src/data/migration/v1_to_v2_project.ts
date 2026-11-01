import crypto from 'node:crypto';
import { v1Client, v2Client } from './sanityClients';
import { markdownToPortableText, type PortableTextBlock } from './markdownToBlocks';

interface V1Project {
  _id: string;
  title: string;
  slug: { current: string };
  shortDescription?: string;
  datetime?: string;
  priorityLevel?: number;
  repositoryLink?: string;
  liveSiteLink?: string;
  thumbnail?: {
    altText?: string;
    description?: string;
    imageFile?: {
      asset?: {
        _ref?: string;
      };
    };
  };
}

interface V1ProjectTechnology {
  _id: string;
  title?: string;
  description?: string;
  techStacks?: Array<{
    description?: string;
    type?: string;
    assets?: Array<{
      altText?: string | null;
      description?: string | null;
    }>;
  }>;
}

interface V1ProjectDeepDive {
  _id: string;
  title?: string;
  description?: string;
  repoLink?: string;
}

function genKey(): string {
  return crypto.randomBytes(6).toString('hex');
}

/**
 * Ensures shortDescription satisfies the Sanity v2 validation rule of max 280 characters.
 */
function sanitizeShortDescription(desc?: string): string {
  if (!desc) return 'Engineering project implementation and technical architecture.';
  const trimmed = desc.trim();
  if (trimmed.length <= 280) return trimmed;

  // Try breaking at the last sentence under 280
  const sub = trimmed.slice(0, 276);
  const lastPeriod = sub.lastIndexOf('.');
  if (lastPeriod > 180) {
    return sub.slice(0, lastPeriod + 1);
  }

  // Break at last word boundary
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 0 ? sub.slice(0, lastSpace) : sub) + '...';
}

/**
 * Infer domain projectType from title, slug, and tech
 */
function inferProjectType(slug: string, title: string): string {
  const s = `${slug} ${title}`.toLowerCase();
  if (s.includes('rag') || s.includes('intellichat')) return 'RAG';
  if (s.includes('traffic') || s.includes('raspberry') || s.includes('yolo')) return 'Edge AI';
  if (s.includes('automation') || s.includes('n8n') || s.includes('agent')) return 'Automation';
  if (s.includes('dental') || s.includes('oravista')) return 'Machine Learning';
  if (s.includes('scheduler') || s.includes('health') || s.includes('catmon')) return 'Full Stack';
  if (s.includes('portfolio') || s.includes('blog')) return 'Public Site';
  return 'Full Stack';
}

/**
 * Clean technology name string
 */
function cleanTechName(name: string): string {
  return name
    .replace(/\s+(icon|programming|for\s+.*|framework|library)$/i, '')
    .replace(/JavaSctipt/i, 'JavaScript')
    .trim();
}

/**
 * Extracts distinct technology strings from joined v1 projectTechnology document
 */
function extractTechStacks(techDoc: V1ProjectTechnology | null, slug: string): string[] {
  const result = new Set<string>();

  if (techDoc?.techStacks && Array.isArray(techDoc.techStacks)) {
    for (const stack of techDoc.techStacks) {
      if (stack.assets && Array.isArray(stack.assets)) {
        for (const asset of stack.assets) {
          if (asset.altText) {
            const cleaned = cleanTechName(asset.altText);
            if (cleaned.length > 1) result.add(cleaned);
          }
          if (asset.description) {
            const cleaned = cleanTechName(asset.description);
            if (cleaned.length > 1 && !cleaned.toLowerCase().includes('icon')) {
              result.add(cleaned);
            }
          }
        }
      }
    }
  }

  // Fallbacks if no tech doc or few items
  if (result.size === 0) {
    const s = slug.toLowerCase();
    if (s.includes('document-agent')) {
      ['Python', 'FastAPI', 'Gemini AI', 'Document OCR', 'Docker'].forEach((t) => result.add(t));
    } else if (s.includes('traffic')) {
      ['Python', 'YOLOv8', 'Raspberry Pi', 'Edge AI', 'OpenCV'].forEach((t) => result.add(t));
    } else if (s.includes('n8n')) {
      ['n8n', 'Telegram API', 'Automation', 'OCR'].forEach((t) => result.add(t));
    } else if (s.includes('oravista')) {
      ['Python', 'Machine Learning', 'Computer Vision', 'FastAPI'].forEach((t) => result.add(t));
    } else {
      ['TypeScript', 'React', 'Next.js'].forEach((t) => result.add(t));
    }
  }

  return Array.from(result);
}

/**
 * Downloads image asset from v1 CDN and uploads to v2 dataset.
 */
async function migrateImageAsset(assetRef: string, dryRun: boolean): Promise<string | null> {
  const match = assetRef.match(/^image-([a-f0-9]+)-(\d+x\d+)-([a-z0-9]+)$/);
  if (!match) return null;

  const [, id, dimensions, format] = match;
  const cdnUrl = `https://cdn.sanity.io/images/se9bi4c1/production/${id}-${dimensions}.${format}`;

  if (dryRun) {
    console.log(`  [DRY-RUN] Would download asset from ${cdnUrl}`);
    return `image-${id}-v2-mock`;
  }

  try {
    const response = await fetch(cdnUrl);
    if (!response.ok) {
      console.warn(`  Failed to fetch asset from ${cdnUrl} (Status: ${response.status})`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await v2Client.assets.upload('image', buffer, {
      filename: `${id}.${format}`,
    });

    return uploaded._id;
  } catch (error) {
    console.warn(`  Asset upload failed for ${cdnUrl}:`, error);
    return null;
  }
}

export async function migrateProjects({ dryRun = false } = {}) {
  console.log('====================================================');
  console.log(`Starting Projects Migration (dryRun: ${dryRun})`);
  console.log('ONLY mutating v2 "project" documents. Home page schemas untouched.');
  console.log('====================================================\n');

  // 1. Fetch all 8 projects from v1 (Strict Read-Only)
  console.log('Fetching all projects from Portfolio v1...');
  const v1Projects: V1Project[] = await v1Client.fetch(
    '*[_type == "project"] | order(priorityLevel desc)'
  );
  console.log(`Found ${v1Projects.length} projects in v1.\n`);

  const results = [];

  for (let i = 0; i < v1Projects.length; i++) {
    const p = v1Projects[i];
    const slug = p.slug?.current || `project-${i + 1}`;
    console.log(`Processing [${i + 1}/${v1Projects.length}]: "${p.title}" (${slug})...`);

    // 2. Fetch joined v1 projectTechnology
    const techDoc: V1ProjectTechnology | null = await v1Client.fetch(
      '*[_type == "projectTechnology" && project._ref == $projId][0]',
      { projId: p._id }
    );

    // 3. Fetch joined v1 projectDeepDive
    const deepDiveDoc: V1ProjectDeepDive | null = await v1Client.fetch(
      '*[_type == "projectDeepDive" && project._ref == $projId][0]',
      { projId: p._id }
    );

    // 4. Transform techStacks
    const techStacks = extractTechStacks(techDoc, slug);

    // 5. Transform project body content
    let content: PortableTextBlock[] = [];
    if (deepDiveDoc?.description) {
      content = markdownToPortableText(deepDiveDoc.description);
    } else if (p.shortDescription) {
      content = markdownToPortableText(p.shortDescription);
    }

    // 6. Migrate thumbnail media
    const media: Array<{
      _key: string;
      _type: string;
      alt?: string;
      caption?: string;
      asset?: { _type: 'reference'; _ref: string };
    }> = [];

    const assetRef = p.thumbnail?.imageFile?.asset?._ref;
    if (assetRef) {
      const v2AssetId = await migrateImageAsset(assetRef, dryRun);
      if (v2AssetId) {
        media.push({
          _key: genKey(),
          _type: 'projectMediaImage',
          alt: p.thumbnail?.altText || p.title,
          caption: p.thumbnail?.description || undefined,
          asset: {
            _type: 'reference',
            _ref: v2AssetId,
          },
        });
      }
    }

    // 7. Determine featured status (top 4 projects for Home Carousel)
    const isFeatured = (p.priorityLevel ?? 0) >= 9;

    // 8. Assemble target v2 document
    const targetDoc = {
      _id: `project-${slug}`,
      _type: 'project',
      title: p.title.trim(),
      slug: { _type: 'slug', current: slug },
      projectType: inferProjectType(slug, p.title),
      shortDescription: sanitizeShortDescription(p.shortDescription),
      repository: p.repositoryLink || deepDiveDoc?.repoLink || undefined,
      website: p.liveSiteLink || undefined,
      priorityValue: p.priorityLevel ?? 0,
      status: 'production',
      author: 'Human',
      featured: isFeatured,
      hidden: false,
      dateStarted: p.datetime ? p.datetime.split('T')[0] : undefined,
      techStacks,
      media,
      content,
    };

    if (dryRun) {
      console.log(`  [DRY-RUN] Target Doc Prepared for "${slug}":`);
      console.log(`    - Title: ${targetDoc.title}`);
      console.log(`    - Featured on Home: ${targetDoc.featured}`);
      console.log(`    - Priority: ${targetDoc.priorityValue}`);
      console.log(`    - Tech Stacks: ${targetDoc.techStacks.join(', ')}`);
      console.log(`    - Content Blocks Count: ${targetDoc.content.length}`);
      console.log(`    - Media Count: ${targetDoc.media.length}`);
      console.log(`    - Short Description (${targetDoc.shortDescription.length} chars): "${targetDoc.shortDescription}"`);
      results.push(targetDoc);
    } else {
      console.log(`  Writing project to Sanity v2 (_id: ${targetDoc._id})...`);
      const res = await v2Client.createOrReplace(targetDoc);
      console.log(`  ✓ Successfully saved "${targetDoc.title}"`);
      results.push(res);
    }

    console.log('');
  }

  console.log('====================================================');
  console.log(`Project Migration Completed: ${results.length} projects processed.`);
  console.log('====================================================\n');
  return results;
}

if (process.argv[1]?.endsWith('v1_to_v2_project.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateProjects({ dryRun: isDryRun }).catch((err) => {
    console.error('Projects migration failed:', err);
    process.exit(1);
  });
}

