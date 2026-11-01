import { v1Client, v2Client } from './sanityClients';
import { markdownToPortableText, type PortableTextBlock } from './markdownToBlocks';
import { migrateImageAsset } from './assetUploader';

interface V1ProjectImageDoc {
  _id: string;
  _createdAt: string;
  title: string;
  description?: string;
  project?: {
    _id: string;
    title?: string;
    slug?: { current: string };
  };
  images?: Array<{
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

interface V1ProjectTechDoc {
  _id: string;
  _createdAt: string;
  title?: string;
  description?: string;
  project?: {
    _id: string;
    title?: string;
    slug?: { current: string };
  };
  techStacks?: Array<{
    description?: string;
    type?: string;
    assets?: Array<{
      altText?: string | null;
      description?: string | null;
      imageFile?: {
        asset?: {
          _ref?: string;
        };
      };
    }>;
  }>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 90);
}

function sanitizeExcerpt(desc?: string): string {
  if (!desc) return 'Technical deep-dive and system implementation notes.';
  const clean = desc.replace(/[#*`>]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 280) return clean;

  const sub = clean.slice(0, 276);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 0 ? sub.slice(0, lastSpace) : sub) + '...';
}

function estimateReadTime(text?: string): string {
  if (!text) return '3 min read';
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

export async function migrateArticles({ dryRun = false } = {}) {
  console.log('\n====================================================');
  console.log(`Starting Articles Migration (dryRun: ${dryRun})`);
  console.log('Target: "article" collection in Sanity v2');
  console.log('Sources: v1 projectImages (9 docs) + v1 projectTechnology (4 docs)');
  console.log('====================================================\n');

  const results = [];

  // ==========================================
  // PART A: 1 Article per v1 ProjectImages item
  // ==========================================
  console.log('Fetching all projectImages from Portfolio v1...');
  const v1ImagesDocs: V1ProjectImageDoc[] = await v1Client.fetch(`*[_type == "projectImages"]{
    _id,
    _createdAt,
    title,
    description,
    project->{_id, title, slug},
    images
  }`);

  console.log(`Found ${v1ImagesDocs.length} projectImages documents in v1.\n`);

  for (let i = 0; i < v1ImagesDocs.length; i++) {
    const doc = v1ImagesDocs[i];
    const projectSlug = doc.project?.slug?.current || 'general';
    const articleSlug = `${projectSlug}-${slugify(doc.title)}`;
    const docId = `article-img-${slugify(doc.title)}`;

    console.log(`[A-${i + 1}/${v1ImagesDocs.length}] Processing Visual Article: "${doc.title}" for [${projectSlug}]...`);

    // 1. Upload Cover Image if available
    let coverImage = undefined;
    const firstAssetRef = doc.images?.[0]?.imageFile?.asset?._ref;
    if (firstAssetRef) {
      const v2AssetId = await migrateImageAsset(firstAssetRef, dryRun);
      if (v2AssetId) {
        coverImage = {
          _type: 'image',
          alt: doc.images?.[0]?.altText || doc.title,
          asset: {
            _type: 'reference',
            _ref: v2AssetId,
          },
        };
      }
    }

    // 2. Convert description to PortableText blocks
    const contentBlocks: PortableTextBlock[] = doc.description
      ? markdownToPortableText(doc.description)
      : [];

    const targetArticle = {
      _id: docId,
      _type: 'article',
      title: doc.title.trim(),
      slug: { _type: 'slug', current: articleSlug },
      project: {
        _type: 'reference',
        _ref: `project-${projectSlug}`,
      },
      projectSlug,
      excerpt: sanitizeExcerpt(doc.description),
      coverImage,
      publishedAt: doc._createdAt,
      readTime: estimateReadTime(doc.description),
      priorityValue: 0,
      developers: ['Benji Cañones'],
      author: 'Human',
      hidden: false,
      content: contentBlocks,
    };

    if (dryRun) {
      console.log(`  [DRY-RUN] Article Document: ${targetArticle._id} (Slug: ${targetArticle.slug.current})`);
      console.log(`    - Project Ref: ${targetArticle.project._ref}`);
      console.log(`    - Excerpt (${targetArticle.excerpt.length} chars): "${targetArticle.excerpt}"`);
      console.log(`    - Content Blocks: ${targetArticle.content.length}`);
      results.push(targetArticle);
    } else {
      console.log(`  Writing article "${targetArticle.title}" to Sanity v2...`);
      const res = await v2Client.createOrReplace(targetArticle);
      console.log(`  ✓ Successfully saved article (_id: ${res._id})`);
      results.push(res);
    }
  }

  // ==========================================
  // PART B: 1 Article per v1 ProjectTechnology per slug
  // ==========================================
  console.log('\nFetching all projectTechnology from Portfolio v1...');
  const v1TechDocs: V1ProjectTechDoc[] = await v1Client.fetch(`*[_type == "projectTechnology"]{
    _id,
    _createdAt,
    title,
    description,
    project->{_id, title, slug},
    techStacks
  }`);

  console.log(`Found ${v1TechDocs.length} projectTechnology documents in v1.\n`);

  for (let i = 0; i < v1TechDocs.length; i++) {
    const tech = v1TechDocs[i];
    const projectSlug = tech.project?.slug?.current || `project-${i + 1}`;
    const projectTitle = tech.project?.title || 'Project';
    const articleSlug = `${projectSlug}-tech-stack-architecture`;
    const docId = `article-tech-${projectSlug}`;

    console.log(`[B-${i + 1}/${v1TechDocs.length}] Processing Tech Article for [${projectSlug}]...`);

    // 1. Build composite markdown from description and techStacks breakdown
    const markdownParts: string[] = [];
    if (tech.title) {
      markdownParts.push(`# ${tech.title}\n`);
    }
    if (tech.description) {
      markdownParts.push(tech.description + '\n');
    }

    if (tech.techStacks && Array.isArray(tech.techStacks)) {
      markdownParts.push('## Technology Components & Architectural Rationale\n');
      for (const stack of tech.techStacks) {
        if (stack.type) {
          markdownParts.push(`### Layer: ${stack.type.toUpperCase()}`);
        }
        if (stack.description) {
          markdownParts.push(stack.description);
        }
      }
    }

    const fullMarkdown = markdownParts.join('\n\n');
    const contentBlocks = markdownToPortableText(fullMarkdown);

    // 2. Upload cover image from first tech stack asset if present
    let coverImage = undefined;
    const firstTechAssetRef = tech.techStacks?.[0]?.assets?.[0]?.imageFile?.asset?._ref;
    if (firstTechAssetRef) {
      const v2AssetId = await migrateImageAsset(firstTechAssetRef, dryRun);
      if (v2AssetId) {
        coverImage = {
          _type: 'image',
          alt: `${projectTitle} Architecture`,
          asset: {
            _type: 'reference',
            _ref: v2AssetId,
          },
        };
      }
    }

    const targetArticle = {
      _id: docId,
      _type: 'article',
      title: `${projectTitle}: Architecture & Tech Stack Decisions`,
      slug: { _type: 'slug', current: articleSlug },
      project: {
        _type: 'reference',
        _ref: `project-${projectSlug}`,
      },
      projectSlug,
      excerpt: sanitizeExcerpt(tech.description || `In-depth architectural analysis and stack decisions for ${projectTitle}.`),
      coverImage,
      publishedAt: tech._createdAt,
      readTime: estimateReadTime(fullMarkdown),
      priorityValue: 5,
      developers: ['Benji Cañones'],
      author: 'Human',
      hidden: false,
      content: contentBlocks,
    };

    if (dryRun) {
      console.log(`  [DRY-RUN] Tech Article Document: ${targetArticle._id} (Slug: ${targetArticle.slug.current})`);
      console.log(`    - Project Ref: ${targetArticle.project._ref}`);
      console.log(`    - Excerpt (${targetArticle.excerpt.length} chars): "${targetArticle.excerpt}"`);
      console.log(`    - Content Blocks: ${targetArticle.content.length}`);
      results.push(targetArticle);
    } else {
      console.log(`  Writing tech article "${targetArticle.title}" to Sanity v2...`);
      const res = await v2Client.createOrReplace(targetArticle);
      console.log(`  ✓ Successfully saved tech article (_id: ${res._id})`);
      results.push(res);
    }
  }

  console.log('\n====================================================');
  console.log(`Articles Migration Completed: ${results.length} total articles processed.`);
  console.log('====================================================\n');
  return results;
}

if (process.argv[1]?.endsWith('v1_to_v2_article.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateArticles({ dryRun: isDryRun }).catch((err) => {
    console.error('Articles migration failed:', err);
    process.exit(1);
  });
}

