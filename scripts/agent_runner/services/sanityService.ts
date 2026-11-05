import { createClient } from 'next-sanity';
import type { ValidatedPortfolioConfig, DevLogSynthesisResult } from '../types';

/**
 * Service to upload assets and persist DevLogs to Sanity Content Lake
 * with strict schema grounding and human review escalation.
 */

// 1. Invariant Schema Access Control (Principle of Least Privilege)
export const FORBIDDEN_SCHEMAS = new Set([
  'contact',
  'emailContactInquiryTemplate',
  'profile',
  'summaryOverview',
  'focusPillar',
  'experience',
]);

export function assertSchemaAccess(targetSchema: string) {
  if (FORBIDDEN_SCHEMAS.has(targetSchema)) {
    throw new Error(
      `[Security Guard] SchemaAccessViolationError: The Agentic Writer is strictly forbidden from modifying or writing to restricted schema '${targetSchema}'.`
    );
  }
}

export async function persistDevLogToSanity(
  config: ValidatedPortfolioConfig,
  commitSha: string,
  synthesis: DevLogSynthesisResult,
  screenshotBuffer: Buffer | null,
  sender = 'Developer',
  targetRepo = ''
): Promise<{ docId: string; assetId?: string; reviewAlertRequired?: boolean }> {
  // Validate schema write access
  assertSchemaAccess('workLog');

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (!projectId || !token) {
    throw new Error(
      `[SanityService] Missing credentials: NEXT_PUBLIC_SANITY_PROJECT_ID is ${projectId ? 'PRESENT' : 'MISSING'}, SANITY_API_WRITE_TOKEN is ${token ? 'PRESENT' : 'MISSING'}. Check GitHub Repository Secrets vs Variables.`
    );
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  });

  console.log(`[SanityService] Connecting to Sanity (${dataset})...`);

  // 2. Find parent project or create DRAFT project (Strict Human Review Gate)
  let projectIdRef: string | null = null;
  let reviewAlertRequired = false;

  try {
    const parent = await client.fetch<{ _id: string } | null>(
      `*[_type == "project" && (slug.current == $slug || _id == $projId || _id == $draftProjId)][0]{_id}`,
      {
        slug: config.projectSlug,
        projId: `project-${config.projectSlug}`,
        draftProjId: `drafts.project-${config.projectSlug}`,
      }
    );

    if (parent?._id) {
      projectIdRef = parent._id.replace(/^drafts\./, '');
      console.log(`[SanityService] Found parent project ID: ${projectIdRef}`);
    } else {
      // Accessible Schemas Rule: Projects are ALWAYS draft when created. Human review is required.
      console.log(`[SanityService] No project found matching slug '${config.projectSlug}'.`);
      console.log(`[SanityService] Creating new Project as DRAFT ('drafts.project-${config.projectSlug}') for mandatory human review...`);

      const draftProjectPayload = {
        _id: `drafts.project-${config.projectSlug}`,
        _type: 'project',
        title: config.projectTitle,
        slug: { _type: 'slug', current: config.projectSlug },
        shortDescription: config.note || `Autonomous engineering project: ${config.projectTitle}`,
        projectType: config.category || 'Engineering',
        ...(config.liveUrl ? { liveUrl: config.liveUrl } : {}),
        ...(targetRepo ? { repositoryUrl: `https://github.com/${targetRepo}` } : {}),
      };

      await client.createOrReplace(draftProjectPayload);
      projectIdRef = `project-${config.projectSlug}`;
      reviewAlertRequired = true;

      console.log(
        `[SanityService] [Human Review Required] Draft Project created: drafts.project-${config.projectSlug}. Raised alert for human review.`
      );
    }
  } catch (err) {
    console.warn(`[SanityService] Project reference query/draft creation error:`, err);
  }

  // 3. Upload Playwright screenshot if present
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

  // 4. Assemble Portable Text content array
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

  // 5. Construct idempotent document ID & Draft determination
  const cleanSha = commitSha.slice(0, 10);
  const isDraft = Boolean(config.requireHumanApproval);
  const docId = isDraft
    ? `drafts.devlog-${config.projectSlug}-${cleanSha}`
    : `devlog-${config.projectSlug}-${cleanSha}`;

  if (isDraft) {
    reviewAlertRequired = true;
  }

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
    ...(projectIdRef
      ? {
          project: {
            _type: 'reference',
            _ref: projectIdRef,
            _weak: true, // Allows referencing draft projects awaiting human review
          },
        }
      : {}),
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

  if (reviewAlertRequired) {
    console.log(`[SanityService] [Notification] Document '${result._id}' requires human review before live release.`);
  }

  return { docId: result._id, assetId: uploadedAssetId, reviewAlertRequired };
}

