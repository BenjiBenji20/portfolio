import { fetchPortfolioConfig } from './services/configService';
import { fetchGitHubContext } from './services/githubContextService';
import { captureLiveScreenshot } from './services/playwrightService';
import {
  evaluateEditorialTriage,
  distillFileSummaries,
  synthesizeDevLog,
} from './services/geminiService';
import { persistDevLogToSanity } from './services/sanityService';
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
    console.log(`[Runner] Skipping: Project "${config.projectTitle}" has explicitly disabled tracking ("track": false).`);
    process.exit(0);
  }

  console.log(`[Runner] Tracking enabled for project: "${config.projectTitle}" (slug: ${config.projectSlug})`);

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

  // 3. Prompt 1: Tier 3 Editorial Triage Gate
  const triage = await evaluateEditorialTriage(effectiveTitle, gitContext, config);
  console.log(`[Runner] Triage Result: Score ${triage.score}/10 | Publishable: ${triage.publishable}`);
  console.log(`[Runner] AI Agent's Rationale: ${triage.rationale}`);

  if (!triage.publishable || triage.score < 7) {
    console.log(`[Runner] Skipping: Change does not meet editorial threshold (score: ${triage.score}, threshold: >= 7).`);
    process.exit(0);
  }

  // 4. Stage 2: Per-File Semantic Distillation (Map Stage)
  const fileSummaries = await distillFileSummaries(gitContext.fileDeltas, config);
  console.log(`[Runner] Distilled ${fileSummaries.length} module summary(s) for holistic synthesis.`);

  // 5. Capture Headless Screenshot (if configured)
  let screenshotBuffer: Buffer | null = null;
  if (config.mediaPreferences?.captureScreenshots && config.liveUrl) {
    screenshotBuffer = await captureLiveScreenshot(config.liveUrl);
  } else {
    console.log('[Runner] Screenshot capture skipped (captureScreenshots is false or liveUrl not defined).');
  }

  // 6. Stage 3: Cross-Referenced Holistic Synthesis (Reduce Stage)
  const synthesis = await synthesizeDevLog(effectiveTitle, gitContext, config, triage, fileSummaries);
  console.log(`[Runner] Synthesized DevLog: "${synthesis.title}" [${synthesis.badge}]`);

  // 7. Persist to Sanity Content Lake (enforcing schema access control and drafts)
  const { docId, reviewAlertRequired } = await persistDevLogToSanity(
    config,
    inputs.commitSha,
    synthesis,
    screenshotBuffer,
    inputs.sender,
    inputs.targetRepo
  );

  console.log('\n========================================================');
  console.log(`Autonomous DevLog Pipeline Successfully Completed!`);
  console.log(`Sanity Document: ${docId}`);
  if (reviewAlertRequired) {
    console.log(`Status: PENDING HUMAN REVIEW (Saved as DRAFT in Sanity Studio)`);
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

