import { v2Client } from './sanityClients';
import { DEFAULT_SUMMARY_OVERVIEW } from './defaultData';

export async function migrateSummaryOverview({ dryRun = false } = {}) {
  console.log('\n--- [2/6] Migrating Summary Overview ---');

  const targetDoc = {
    _id: 'summaryOverview',
    _type: 'summaryOverview',
    summaryText: DEFAULT_SUMMARY_OVERVIEW.summaryText,
  };

  if (dryRun) {
    console.log('[DRY-RUN] Target Summary Overview document prepared:', JSON.stringify(targetDoc, null, 2));
    return targetDoc;
  }

  console.log('Writing summaryOverview document to Sanity v2...');
  const result = await v2Client.createOrReplace(targetDoc);
  console.log(`✓ Summary Overview document updated successfully (_id: ${result._id})`);
  return result;
}

if (process.argv[1]?.endsWith('v1_to_v2_summaryOverview.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateSummaryOverview({ dryRun: isDryRun }).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

