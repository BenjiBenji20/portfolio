import { createClient } from 'next-sanity';
import type { ValidatedPortfolioConfig, DevLogSynthesisResult } from '../types';

/**
 * Service to upload assets and persist DevLogs to Sanity Content Lake
 */
export async function persistDevLogToSanity(
  config: ValidatedPortfolioConfig,
  commitSha: string,
  synthesis: DevLogSynthesisResult,
  screenshotBuffer: Buffer | null,
  sender = 'Developer',
  targetRepo = ''
): Promise<{ docId: string; assetId?: string }> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (!projectId || !token) {
    throw new Error('[SanityService] Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN.');
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  });

  console.log(`[SanityService] Connecting to Sanity (${dataset})...`);

  // 1. Find parent project _id by slug
  let projectIdRef: string | null = null;
  try {
    const parent = await client.fetch<{ _id: string } | null>(
      `*[_type == "project" && slug.current == $slug][0]{_id}`,
      { slug: config.projectSlug }
    );
    if (parent?._id) {
      projectIdRef = parent._id;
      console.log(`[SanityService] Found parent project ID: ${projectIdRef}`);
    } else {
      console.warn(`[SanityService] No project found matching slug '${config.projectSlug}'. Checking fallback.`);
      const fallback = await client.fetch<{ _id: string } | null>(`*[_type == "project"][0]{_id}`);
      projectIdRef = fallback?._id || null;
    }
  } catch (err) {
    console.warn(`[SanityService] Project reference query error:`, err);
  }

  // 2. Upload Playwright screenshot if present
  let uploadedAssetId: string | undefined;
  if (screenshotBuffer) {
    try {
      console.log(`[SanityService] Uploading Playwright screenshot to Sanity Asset Lake...`);
      const asset = await client.assets.upload('image', screenshotBuffer, {
        filename: `${config.projectSlug}-${commitSha.slice(0, 7)}.png`,
      });
      uploadedAssetId = asset._id;
      console.log(`[SanityService] Screenshot uploaded: ${uploadedAssetId}`);
    } catch (err) {
      console.warn(`[SanityService] Screenshot asset upload failed:`, err);
    }
  }

  // 3. Assemble Portable Text content array
  const contentBlocks: unknown[] = [
    {
      _key: 'summary-block',
      _type: 'block',
      style: 'normal',
      children: [
        {
          _key: 'summary-span',
          _type: 'span',
          text: synthesis.description,
          marks: [],
        },
      ],
    },
  ];

  // Add bulleted highlights
  synthesis.highlights.forEach((highlight, idx) => {
    contentBlocks.push({
      _key: `highlight-${idx}`,
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _key: `hl-span-${idx}`,
          _type: 'span',
          text: highlight,
          marks: [],
        },
      ],
    });
  });

  // Embed screenshot if available
  if (uploadedAssetId) {
    contentBlocks.push({
      _key: 'media-screenshot',
      _type: 'projectMediaImage',
      asset: {
        _type: 'reference',
        _ref: uploadedAssetId,
      },
      alt: `${config.projectTitle} - Live Snapshot`,
    });
  }

  // Embed Mermaid diagram if present
  if (synthesis.mermaidDiagram) {
    contentBlocks.push({
      _key: 'mermaid-diagram',
      _type: 'block',
      style: 'normal',
      children: [
        {
          _key: 'mm-lead',
          _type: 'span',
          text: 'Architectural Data Flow & State Transition:',
          marks: ['strong'],
        },
      ],
    });
    contentBlocks.push({
      _key: 'mermaid-code',
      _type: 'code',
      language: 'mermaid',
      code: synthesis.mermaidDiagram,
    });
  }

  // 4. Construct idempotent document ID
  const cleanSha = commitSha.slice(0, 10);
  const isDraft = Boolean(config.requireHumanApproval);
  const docId = isDraft
    ? `drafts.devlog-${config.projectSlug}-${cleanSha}`
    : `devlog-${config.projectSlug}-${cleanSha}`;

  const today = new Date().toISOString().split('T')[0];

  const docPayload = {
    _id: docId,
    _type: 'workLog',
    title: synthesis.title,
    badge: synthesis.badge,
    date: today,
    description: synthesis.description,
    commitSha: commitSha,
    author: 'Agentic Writer',
    developers: [sender, 'Agentic Writer'],
    content: contentBlocks,
    ...(projectIdRef ? { project: { _type: 'reference', _ref: projectIdRef } } : {}),
    backlinks: targetRepo
      ? [
          {
            _key: 'bl-gh',
            platform: 'GitHub Commit',
            url: `https://github.com/${targetRepo}/commit/${commitSha}`,
          },
        ]
      : [],
  };

  console.log(`[SanityService] Persisting DevLog document [${docId}] (isDraft: ${isDraft})...`);
  const result = await client.createOrReplace(docPayload);
  console.log(`[SanityService] Successfully persisted document ${result._id}`);

  return { docId: result._id, assetId: uploadedAssetId };
}

