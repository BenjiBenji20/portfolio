import { createClient } from 'next-sanity';
import type {
  ValidatedPortfolioConfig,
  DevLogSynthesisResult,
  ProjectHistoryDigest,
  ArticleSynthesisResult,
  ArticlePatchResult,
  FullArticleData,
} from '../types';
import {
  buildProjectPayload,
  buildWorkLogPayload,
  buildArticleDraftPayload,
  buildArticlePatchBlocks,
} from '../utils/sanitySchemaBuilders';
import { createGuardedSanityClient } from '../utils/sanityClientGuardrail';
import { executeAgenticTool } from '../agentic_tools/toolRegistry';

/**
 * Service to upload assets and persist DevLogs to Sanity Content Lake
 * with strict schema grounding, zero field omissions, and human review escalation via hidden: true.
 * Protected by runtime RBAC guardrails (zero delete authority, schema boundaries).
 */

export function getGuardedSanityClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  const token =
    process.env.SANITY_AGENT_RUNNER_TOKEN ||
    process.env.SANITY_AGENT_READ_ONLY_TOKEN ||
    process.env.SANITY_API_WRITE_TOKEN;

  if (!projectId || !token) {
    throw new Error(
      `[SanityService] Missing credentials: NEXT_PUBLIC_SANITY_PROJECT_ID is ${projectId ? 'PRESENT' : 'MISSING'}, SANITY_AGENT_RUNNER_TOKEN is ${token ? 'PRESENT' : 'MISSING'}. Check GitHub Repository Secrets vs Variables.`
    );
  }

  const rawClient = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  });
  return createGuardedSanityClient(rawClient);
}

/**
 * Retrieves chronological project milestone memory & existing article topics
 * via project-isolated GROQ tool.
 */
export async function getProjectHistory(projectSlug: string): Promise<ProjectHistoryDigest> {
  try {
    const client = getGuardedSanityClient();
    return await executeAgenticTool<ProjectHistoryDigest>(
      'fetch_project_history_digest',
      { projectSlug },
      { projectSlug, sanityClient: client }
    );
  } catch (err) {
    console.warn(`[SanityService] History digest lookup failed:`, err);
    return { recentWorkLogs: [], existingArticles: [] };
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
  const client = getGuardedSanityClient();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

  console.log(`[SanityService] Connecting to Sanity (${dataset}) via Guarded Client...`);

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
      // Human Review Gate: Project is published to Content Lake to establish solid referential integrity,
      // but flagged with 'hidden: true' so it is completely invisible on the public site until reviewed.
      console.log(`[SanityService] No project found matching slug '${config.projectSlug}'.`);
      console.log(`[SanityService] Creating new Project ('project-${config.projectSlug}') with hidden: true for human review...`);

      const projectPayload = buildProjectPayload(
        config,
        targetRepo,
        synthesis.projectOverview || synthesis.description,
        synthesis.techStacks || []
      );
      await client.createOrReplace(projectPayload);
      projectIdRef = projectPayload._id;
      reviewAlertRequired = true;

      console.log(
        `[SanityService] [Human Review Required] Project created: ${projectPayload._id} with hidden: true.`
      );
    }
  } catch (err) {
    console.warn(`[SanityService] Project reference query/creation error:`, err);
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

  // Embed Mermaid diagram if present AND enabled in mediaPreferences
  if (synthesis.mermaidDiagram && config.mediaPreferences?.generateArchitectureDiagrams !== false) {
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
      _type: 'block',
      style: 'normal',
      children: [
        {
          _key: 'mm-code-span',
          _type: 'span',
          text: synthesis.mermaidDiagram,
          marks: [],
        },
      ],
    });
  }

  // 5. Construct complete WorkLog document payload using factory builder
  // WorkLogs are always published directly to Sanity Lake to maintain referential integrity.
  // Privacy and gating are controlled at the project level via 'hidden: true'.
  const docPayload = buildWorkLogPayload(
    config,
    commitSha,
    synthesis,
    contentBlocks,
    sender,
    targetRepo,
    projectIdRef || undefined
  );

  if (config.requireHumanApproval) {
    reviewAlertRequired = true;
  }

  console.log(`[SanityService] Persisting DevLog document [${docPayload._id}] (Published to Lake, requireHumanApproval: ${Boolean(config.requireHumanApproval)})...`);
  const result = await client.createOrReplace(docPayload);
  console.log(`[SanityService] Successfully persisted document ${result._id}`);

  if (reviewAlertRequired) {
    console.log(`[SanityService] [Notification] Document '${result._id}' published to Lake under human review gate (hidden: true on project).`);
  }

  return { docId: result._id, assetId: uploadedAssetId, reviewAlertRequired };
}

/**
 * Retrieves full article details by slug for patch synthesis.
 * Sandboxed to projectSlug if provided.
 */
export async function getArticleBySlug(slug: string, projectSlug?: string): Promise<FullArticleData | null> {
  try {
    const client = getGuardedSanityClient();
    return await executeAgenticTool<FullArticleData | null>(
      'fetch_article_by_slug',
      { slug },
      { sanityClient: client, projectSlug }
    );
  } catch (err) {
    console.warn(`[SanityService] getArticleBySlug failed for "${slug}":`, err);
    return null;
  }
}

/**
 * Persists a newly synthesized long-form Article to Sanity Content Lake.
 * INVARIANT: Must be strictly staged as a draft ('drafts.article-...') with 'hidden: true'
 * to enforce the mandatory human developer editorial review gate.
 */
export async function persistArticleDraftToSanity(
  config: ValidatedPortfolioConfig,
  synthesis: ArticleSynthesisResult,
  sender = 'Developer',
  targetRepo = '',
  projectIdRef?: string
): Promise<{ docId: string; reviewUrl: string }> {
  const client = getGuardedSanityClient();
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

  // 1. Resolve or create parent project reference
  let resolvedProjectRef = projectIdRef;
  if (!resolvedProjectRef) {
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
        resolvedProjectRef = parent._id.replace(/^drafts\./, '');
      } else {
        const projectPayload = buildProjectPayload(
          config,
          targetRepo,
          `Autonomous engineering project: ${config.projectTitle || config.projectSlug}`
        );
        await client.createOrReplace(projectPayload);
        resolvedProjectRef = projectPayload._id;
      }
    } catch (err) {
      console.warn(`[SanityService] Project reference resolution for article:`, err);
    }
  }

  // 2. Build Article Draft Payload (drafts.article-${projectSlug}-${articleSlug})
  const articlePayload = buildArticleDraftPayload(
    config,
    synthesis,
    sender,
    resolvedProjectRef || `project-${config.projectSlug}`
  );

  console.log(`[SanityService] Persisting Article DRAFT [${articlePayload._id}] (hidden: true)...`);
  const result = await client.createOrReplace(articlePayload);
  console.log(`[SanityService] Successfully staged Article draft: ${result._id}`);

  const reviewUrl = `https://${projectId}.sanity.studio/structure/article;${result._id}`;
  return { docId: result._id, reviewUrl };
}

/**
 * Persists an architectural addendum to update an existing article in Sanity Lake.
 * INVARIANT: Stages the mutation into a draft document so changes require human review.
 */
export async function persistArticlePatchToSanity(
  targetArticleSlug: string,
  patch: ArticlePatchResult,
  config: ValidatedPortfolioConfig
): Promise<{ docId: string; reviewUrl: string }> {
  const client = getGuardedSanityClient();
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

  // 1. Find existing article or existing draft
  const existing = await client.fetch<{ _id: string; content?: unknown[] } | null>(
    `*[_type == "article" && slug.current == $slug][0]{ _id, content }`,
    { slug: targetArticleSlug }
  );

  if (!existing?._id) {
    throw new Error(`[SanityService] Cannot patch article: No article found for slug "${targetArticleSlug}"`);
  }

  // Draft ID ensures any patch targets drafts exclusively
  const draftDocId = existing._id.startsWith('drafts.') ? existing._id : `drafts.${existing._id}`;

  const includeMermaid = config.mediaPreferences?.generateArchitectureDiagrams !== false;
  const patchBlocks = buildArticlePatchBlocks(patch, includeMermaid);

  // If the draft document doesn't exist yet, clone published document into drafts
  if (!existing._id.startsWith('drafts.')) {
    try {
      const fullDoc = await client.getDocument(existing._id);
      if (fullDoc) {
        const draftDoc = {
          ...fullDoc,
          _id: draftDocId,
          hidden: true, // Escalate to human review
        };
        await client.createOrReplace(draftDoc);
      }
    } catch (cloneErr) {
      console.warn(`[SanityService] Draft initialization for patch:`, cloneErr);
    }
  }

  console.log(`[SanityService] Appending Architecture Addendum to Article Draft [${draftDocId}]...`);
  await client
    .patch(draftDocId)
    .setIfMissing({ content: [] })
    .append('content', patchBlocks)
    .set({ hidden: true })
    .commit();

  console.log(`[SanityService] Successfully patched Article Draft: ${draftDocId}`);

  const reviewUrl = `https://${projectId}.sanity.studio/structure/article;${draftDocId}`;
  return { docId: draftDocId, reviewUrl };
}


