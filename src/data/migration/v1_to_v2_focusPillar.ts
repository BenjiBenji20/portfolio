import { v2Client } from './sanityClients';
import { DEFAULT_FOCUS_PILLARS } from './defaultData';

export async function migrateFocusPillars({ dryRun = false } = {}) {
  console.log('\n--- [4/6] Migrating Focus Pillars ---');

  const results = [];
  for (let i = 0; i < DEFAULT_FOCUS_PILLARS.length; i++) {
    const pillar = DEFAULT_FOCUS_PILLARS[i];
    const rawId = pillar._id || `focus-${i + 1}`;
    const docId: string = rawId.startsWith('focus-') ? `focusPillar-${rawId.replace('focus-', '')}` : rawId;
    const targetDoc = {
      _id: docId,
      _type: 'focusPillar',
      title: pillar.title,
      description: pillar.description,
      order: pillar.order ?? (i + 1),
    };

    if (dryRun) {
      console.log(`[DRY-RUN] Target Focus Pillar document (${docId}):`, JSON.stringify(targetDoc, null, 2));
      results.push(targetDoc);
    } else {
      console.log(`Writing focusPillar document "${docId}" (${pillar.title})...`);
      const res = await v2Client.createOrReplace(targetDoc);
      console.log(`✓ Focus Pillar "${docId}" written successfully`);
      results.push(res);
    }
  }

  console.log(`✓ Completed migrating ${results.length} focus pillar records.`);
  return results;
}

if (process.argv[1]?.endsWith('v1_to_v2_focusPillar.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateFocusPillars({ dryRun: isDryRun }).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

