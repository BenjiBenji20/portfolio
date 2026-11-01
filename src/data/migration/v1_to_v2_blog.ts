import { v1Client, v2Client } from './sanityClients';
import { markdownToPortableText } from './markdownToBlocks';

interface V1BlogPreview {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  description?: string;
  carousel?: Array<{
    _key: string;
    altText?: string;
    description?: string;
    imageFile?: {
      asset?: {
        _ref?: string;
      };
    };
  }>;
}

export async function migrateBlog({ dryRun = false } = {}) {
  console.log('\n====================================================');
  console.log(`Starting Blog Preview Migration (dryRun: ${dryRun})`);
  console.log('Target: "blog" singleton in Sanity v2');
  console.log('====================================================\n');

  // 1. Fetch v1 blogPreview (Strict Read-Only)
  console.log('Fetching blogPreview from Portfolio v1...');
  const v1Blog: V1BlogPreview | null = await v1Client.fetch('*[_type == "blogPreview"][0]');

  if (!v1Blog) {
    console.warn('No blogPreview document found in Portfolio v1.');
    return null;
  }

  console.log(`Found blogPreview in v1 (Updated at: ${v1Blog._updatedAt})`);

  // 2. Convert markdown description into Portable Text blocks
  const content = v1Blog.description ? markdownToPortableText(v1Blog.description) : [];

  // Estimate read time based on word count (~200 words per minute)
  const wordCount = (v1Blog.description || '').trim().split(/\s+/).length;
  const estimatedMins = Math.max(1, Math.round(wordCount / 200));
  const readTime = `${estimatedMins} min read`;

  // 3. Assemble target v2 document
  const targetDoc = {
    _id: 'blog',
    _type: 'blog',
    title: 'Software Engineering Background & Works',
    publishedAt: v1Blog._createdAt,
    lastUpdated: v1Blog._updatedAt,
    readTime,
    content,
  };

  if (dryRun) {
    console.log('[DRY-RUN] Target Blog Document Prepared:');
    console.log(`  - Title: ${targetDoc.title}`);
    console.log(`  - PublishedAt: ${targetDoc.publishedAt}`);
    console.log(`  - LastUpdated: ${targetDoc.lastUpdated}`);
    console.log(`  - ReadTime: ${targetDoc.readTime}`);
    console.log(`  - Content Blocks Count: ${targetDoc.content.length}`);
    return targetDoc;
  }

  console.log('Writing blog document to Sanity v2...');
  const result = await v2Client.createOrReplace(targetDoc);
  console.log(`✓ Blog document updated successfully (_id: ${result._id})`);
  return result;
}

if (process.argv[1]?.endsWith('v1_to_v2_blog.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateBlog({ dryRun: isDryRun }).catch((err) => {
    console.error('Blog migration failed:', err);
    process.exit(1);
  });
}

