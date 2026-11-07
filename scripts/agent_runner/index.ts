import { fetchPortfolioConfig } from './services/configService';
import { fetchGitHubContext } from './services/githubContextService';
import { captureLiveScreenshot } from './services/playwrightService';
import {
  evaluateEditorialTriage,
  distillFileSummaries,
  synthesizeDevLog,
  synthesizeArticle,
  synthesizeArticlePatch,
} from './services/geminiService';
import {
  persistDevLogToSanity,
  getProjectHistory,
  persistArticleDraftToSanity,
  persistArticlePatchToSanity,
  getArticleBySlug,
} from './services/sanityService';
import type { RunnerInputs } from './types';

/**
 * Phase 2 Master Runner Entrypoint
 * Orchestrates autonomous background devlog generation for GitHub Actions runner
 */

function parseInputs(): RunnerInputs {
  const args = process.argv.slice(2);
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  return {
    targetRepo: getArg('--repo') || process.env.TARGET_REPO || '',
    commitSha: getArg('--sha') || process.env.COMMIT_SHA || '',
    baseSha: getArg('--base') || process.env.BASE_SHA || '',
    branch: getArg('--branch') || process.env.BRANCH || 'main',
    prNumber: getArg('--pr') || process.env.PR_NUMBER,
    prTitle: getArg('--title') || process.env.PR_TITLE,
    sender: getArg('--sender') || process.env.SENDER || 'Developer',
  };
}

export async function runAgenticDevlog() {
  const inputs = parseInputs();

  console.log('========================================================');
  console.log('Autonomous DevLog Agent Runner (Phase 2)');
  console.log('========================================================');
  console.log(`Target Repo: ${inputs.targetRepo}`);
  console.log(`Commit SHA:  ${inputs.commitSha}`);
  if (inputs.baseSha) {
    console.log(`Base SHA:    ${inputs.baseSha} (Push Range Comparison)`);
  }
  console.log(`Branch:      ${inputs.branch}`);
  console.log(`PR Number:   ${inputs.prNumber || 'N/A (Direct Push)'}`);
  console.log(`PR Title:    ${inputs.prTitle || 'N/A'}`);
  console.log('========================================================\n');

  if (!inputs.targetRepo || !inputs.commitSha) {
    console.error('[Runner] Error: Missing required inputs (--repo and --sha or TARGET_REPO and COMMIT_SHA).');
    process.exit(1);
  }

  // 1. Fetch & Dynamically Validate .portfolio.json
  const config = await fetchPortfolioConfig(inputs.targetRepo, inputs.commitSha);
  if (!config) {
    console.log('[Runner] Skipping: .portfolio.json is not present or failed validation.');
    process.exit(0);
  }

  if (config.track === false) {
    console.log(`[Runner] Skipping: Project "${config.projectTitle || inputs.targetRepo}" has explicitly disabled tracking ("track": false).`);
    process.exit(0);
  }

  // Enforce primaryBranch filter if specified
  if (inputs.branch && config.primaryBranch && inputs.branch !== config.primaryBranch) {
    console.log(
      `[Runner] Skipping: Commit is on branch "${inputs.branch}", but tracked primaryBranch is "${config.primaryBranch}".`
    );
    process.exit(0);
  }

  console.log(`[Runner] Tracking enabled for project: "${config.projectTitle || inputs.targetRepo}" (primary branch: ${config.primaryBranch})`);

  // 2. Fetch Git Context & Diff (scrubbing ignored directories & supporting multi-commit push ranges)
  const gitContext = await fetchGitHubContext(
    inputs.targetRepo,
    inputs.commitSha,
    inputs.prNumber,
    config.ignoreDirectory,
    undefined,
    inputs.baseSha
  );

  if (gitContext.changedFiles.length === 0) {
    console.log('[Runner] Skipping: Zero functional files to evaluate (all changes are ignored or binary artifacts).');
    process.exit(0);
  }

  const effectiveTitle = inputs.prTitle || gitContext.commitMessage.split('\n')[0] || 'Engineering Update';

  // 3. Fetch Project History Digest (Ultra-lightweight memory of past milestones & articles)
  const projectSlugCandidate =
    config.projectSlug ||
    (config.projectTitle
      ? config.projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : inputs.targetRepo.split('/')[1]);

  const historyDigest = await getProjectHistory(projectSlugCandidate);
  if (historyDigest.recentWorkLogs.length > 0 || historyDigest.existingArticles.length > 0) {
    console.log(
      `[Runner] Loaded history for "${projectSlugCandidate}": ${historyDigest.recentWorkLogs.length} previous worklog(s), ${historyDigest.existingArticles.length} published article(s).`
    );
  } else {
    console.log(`[Runner] Initial project context: 0 previous worklogs for "${projectSlugCandidate}".`);
  }

  // 4. Prompt 1: Tier 3 Editorial Triage Gate with Cumulative Milestone Evaluation
  const triage = await evaluateEditorialTriage(effectiveTitle, gitContext, config, historyDigest);
  console.log(`[Runner] Triage Result: Score ${triage.score}/10 | Publishable: ${triage.publishable}`);
  console.log(`[Runner] AI Agent's Rationale: ${triage.rationale}`);
  if (triage.articleAction && triage.articleAction !== 'none') {
    console.log(
      `[Runner] 📰 Article Recommendation: ${triage.articleAction.toUpperCase()}${triage.targetArticleSlug ? ` (Target: "${triage.targetArticleSlug}")` : ''}`
    );
    if (triage.articleRationale) {
      console.log(`[Runner] Article Rationale: ${triage.articleRationale}`);
    }
  }

  // Autonomous Agent Resolution: If projectTitle, projectSlug, or category were omitted by human, adopt agent's synthesis
  if (!config.projectTitle) {
    config.projectTitle = triage.suggestedProjectTitle || inputs.targetRepo.split('/')[1] || 'Engineering Project';
    console.log(`[Runner] Agent autonomously synthesized project title: "${config.projectTitle}"`);
  }
  if (!config.projectSlug) {
    config.projectSlug = config.projectTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    console.log(`[Runner] Agent derived project slug: "${config.projectSlug}"`);
  }
  if (!config.category && triage.suggestedCategory) {
    config.category = triage.suggestedCategory;
    console.log(`[Runner] Agent classified category: "${config.category}"`);
  }

  if (!triage.publishable || triage.score < 7) {
    console.log(`[Runner] Skipping: Change does not meet editorial threshold (score: ${triage.score}, threshold: >= 7).`);
    process.exit(0);
  }

  // 5. Stage 2: Per-File Semantic Distillation (Map Stage)
  const fileSummaries = await distillFileSummaries(gitContext.fileDeltas, config);
  console.log(`[Runner] Distilled ${fileSummaries.length} module summary(s) for holistic synthesis.`);

  // 6. Capture Headless Screenshot (if configured)
  let screenshotBuffer: Buffer | null = null;
  if (config.mediaPreferences?.captureScreenshots && config.liveUrl) {
    screenshotBuffer = await captureLiveScreenshot(config.liveUrl);
  } else {
    console.log('[Runner] Screenshot capture skipped (captureScreenshots is false or liveUrl not defined).');
  }

  // 7. Stage 3: Cross-Referenced Holistic Synthesis (Reduce Stage)
  const synthesis = await synthesizeDevLog(effectiveTitle, gitContext, config, triage, fileSummaries, historyDigest);
  console.log(`[Runner] Synthesized DevLog: "${synthesis.title}" [${synthesis.badge}]`);

  // 8. Persist to Sanity Content Lake (enforcing schema access control and drafts)
  const { docId, reviewAlertRequired } = await persistDevLogToSanity(
    config,
    inputs.commitSha,
    synthesis,
    screenshotBuffer,
    inputs.sender,
    inputs.targetRepo
  );

  // 9. Article Generation Gate: Long-Form Technical Deep Dive or Architecture Addendum
  let generatedArticleDocId: string | undefined;
  let articleReviewUrl: string | undefined;

  if (triage.articleAction === 'create_article') {
    console.log('\n[Runner] 🚀 Landmark Milestone Detected -> Triggering Autonomous Long-Form Article Creation...');
    try {
      const articleSynthesis = await synthesizeArticle(
        effectiveTitle,
        gitContext,
        config,
        triage,
        fileSummaries,
        historyDigest
      );
      const articleResult = await persistArticleDraftToSanity(
        config,
        articleSynthesis,
        inputs.sender,
        inputs.targetRepo
      );
      generatedArticleDocId = articleResult.docId;
      articleReviewUrl = articleResult.reviewUrl;
      console.log(`[Runner] 📰 Staged New Article Draft: ${generatedArticleDocId}`);
      console.log(`[Runner] 🔗 Review in Sanity Studio: ${articleReviewUrl}`);
    } catch (articleErr) {
      console.error('[Runner] Article synthesis or staging failed:', articleErr);
    }
  } else if (triage.articleAction === 'update_article' && triage.targetArticleSlug) {
    console.log(`\n[Runner] 🔄 Architectural Delta Detected -> Updating Article "${triage.targetArticleSlug}"...`);
    try {
      const existingArticle = await getArticleBySlug(triage.targetArticleSlug);
      const patchSynthesis = await synthesizeArticlePatch(
        triage.targetArticleSlug,
        existingArticle,
        effectiveTitle,
        gitContext,
        config,
        triage,
        fileSummaries
      );
      const patchResult = await persistArticlePatchToSanity(
        triage.targetArticleSlug,
        patchSynthesis,
        config
      );
      generatedArticleDocId = patchResult.docId;
      articleReviewUrl = patchResult.reviewUrl;
      console.log(`[Runner] 📰 Staged Article Update Patch: ${generatedArticleDocId}`);
      console.log(`[Runner] 🔗 Review in Sanity Studio: ${articleReviewUrl}`);
    } catch (patchErr) {
      console.error('[Runner] Article patch synthesis or staging failed:', patchErr);
    }
  }

  console.log('\n========================================================');
  console.log(`Autonomous DevLog Pipeline Successfully Completed!`);
  console.log(`WorkLog Document: ${docId}`);
  if (generatedArticleDocId) {
    console.log(`Article Draft:    ${generatedArticleDocId} (hidden: true)`);
    if (articleReviewUrl) {
      console.log(`Review Link:      ${articleReviewUrl}`);
    }
  }
  if (reviewAlertRequired) {
    console.log(`Status: PENDING HUMAN REVIEW (Published to Sanity Lake with hidden: true for audit)`);
  } else {
    console.log(`Status: PUBLISHED LIVE (Triggering instant Next.js ISR revalidation)`);
  }
  console.log('========================================================\n');
}

// Execute CLI
if (require.main === module) {
  runAgenticDevlog().catch((err) => {
    console.error('[Runner Fatal Error]:', err);
    process.exit(1);
  });
}

