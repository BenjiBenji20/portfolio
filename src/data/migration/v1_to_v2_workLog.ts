import crypto from 'node:crypto';
import { v1Client, v2Client } from './sanityClients';
import { markdownToPortableText, type PortableTextBlock } from './markdownToBlocks';
import { migrateImageAsset } from './assetUploader';

interface V1ProjectBlogEntry {
  _id: string;
  _createdAt: string;
  title: string;
  datetime?: string;
  commitLink?: string;
  description?: string;
  project?: {
    _id: string;
    title?: string;
    slug?: { current: string };
  };
  assets?: Array<{
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

function genKey(): string {
  return crypto.randomBytes(6).toString('hex');
}

/**
 * Determine badge category based on keywords
 */
function inferBadge(title: string, desc?: string): 'Production Release' | 'Architecture' | 'Optimization' | 'Security' | 'Feature' | 'Refactor' {
  const combined = `${title} ${desc || ''}`.toLowerCase();
  if (combined.includes('security') || combined.includes('vulnerability') || combined.includes('audit')) {
    return 'Security';
  }
  if (combined.includes('release') || combined.includes('launch') || combined.includes('end-to-end') || combined.includes('deployment')) {
    return 'Production Release';
  }
  if (combined.includes('optimize') || combined.includes('cache') || combined.includes('speed') || combined.includes('token') || combined.includes('performance')) {
    return 'Optimization';
  }
  if (combined.includes('refactor') || combined.includes('tuning') || combined.includes('clean') || combined.includes('scaffolding')) {
    return 'Refactor';
  }
  if (combined.includes('architecture') || combined.includes('design') || combined.includes('pipeline') || combined.includes('database') || combined.includes('schema')) {
    return 'Architecture';
  }
  return 'Feature';
}

/**
 * Extracts commit SHA from a GitHub commit or tree URL
 */
function extractCommitSha(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/(?:commit|tree)\/([a-f0-9]{7,40})/i);
  return match ? match[1] : undefined;
}

export async function migrateWorkLogs({ dryRun = false } = {}) {
  console.log('\n====================================================');
  console.log(`Starting Work Logs Migration (dryRun: ${dryRun})`);
  console.log('Target: "workLog" collection in Sanity v2');
  console.log('Source: v1 projectBlogEntry / Daily Blog (26 docs)');
  console.log('====================================================\n');

  console.log('Fetching all projectBlogEntry from Portfolio v1...');
  const v1Entries: V1ProjectBlogEntry[] = await v1Client.fetch(`*[_type == "projectBlogEntry"]{
    _id,
    _createdAt,
    title,
    datetime,
    commitLink,
    description,
    project->{_id, title, slug},
    assets
  } | order(datetime asc)`);

  console.log(`Found ${v1Entries.length} projectBlogEntry documents in v1.\n`);

  const results = [];

  for (let i = 0; i < v1Entries.length; i++) {
    const entry = v1Entries[i];
    const projectSlug = entry.project?.slug?.current || 'general';
    const docId = `worklog-${entry._id}`;
    const badge = inferBadge(entry.title, entry.description);
    const commitSha = extractCommitSha(entry.commitLink);
    const date = entry.datetime ? entry.datetime.split('T')[0] : entry._createdAt.split('T')[0];

    console.log(`[${i + 1}/${v1Entries.length}] Processing Log: "${entry.title}" [${badge}] for [${projectSlug}] (${date})...`);

    // 1. Convert description into Portable Text blocks
    const contentBlocks: PortableTextBlock[] = entry.description
      ? markdownToPortableText(entry.description)
      : [];

    // 2. Upload any attached screenshot assets and append to content
    if (entry.assets && Array.isArray(entry.assets)) {
      for (const asset of entry.assets) {
        const assetRef = asset.imageFile?.asset?._ref;
        if (assetRef) {
          const v2AssetId = await migrateImageAsset(assetRef, dryRun);
          if (v2AssetId) {
            contentBlocks.push({
              _key: genKey(),
              _type: 'projectMediaImage' as unknown as 'block',
              // @ts-expect-error projectMediaImage member in content array
              alt: asset.altText || entry.title,
              caption: asset.description || undefined,
              asset: {
                _type: 'reference',
                _ref: v2AssetId,
              },
            });
          }
        }
      }
    }

    // 3. Assemble backlinks
    const backlinks = entry.commitLink
      ? [
          {
            _key: genKey(),
            _type: 'backlinkItem',
            label: commitSha ? `Commit ${commitSha.slice(0, 7)}` : 'GitHub Commit',
            url: entry.commitLink,
          },
        ]
      : [];

    const targetLog = {
      _id: docId,
      _type: 'workLog',
      title: entry.title.trim(),
      project: {
        _type: 'reference',
        _ref: `project-${projectSlug}`,
      },
      projectSlug,
      badge,
      date,
      description: entry.description || 'Engineering work log.',
      content: contentBlocks,
      commitSha,
      backlinks,
      author: 'Human',
      developers: ['Benji Cañones'],
    };

    if (dryRun) {
      console.log(`  [DRY-RUN] WorkLog: ${targetLog._id} [${targetLog.badge}]`);
      console.log(`    - Project Ref: ${targetLog.project._ref}`);
      console.log(`    - Commit SHA: ${targetLog.commitSha || 'none'}`);
      console.log(`    - Content Blocks: ${targetLog.content.length}`);
      results.push(targetLog);
    } else {
      console.log(`  Writing work log "${targetLog.title}" to Sanity v2...`);
      const res = await v2Client.createOrReplace(targetLog);
      console.log(`  ✓ Successfully saved work log (_id: ${res._id})`);
      results.push(res);
    }
  }

  console.log('\n====================================================');
  console.log(`Work Logs Migration Completed: ${results.length} logs processed.`);
  console.log('====================================================\n');
  return results;
}

if (process.argv[1]?.endsWith('v1_to_v2_workLog.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateWorkLogs({ dryRun: isDryRun }).catch((err) => {
    console.error('Work logs migration failed:', err);
    process.exit(1);
  });
}

