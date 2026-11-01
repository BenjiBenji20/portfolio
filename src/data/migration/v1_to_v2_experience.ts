import { v2Client } from './sanityClients';
import { DEFAULT_EXPERIENCES } from './defaultData';

export async function migrateExperiences({ dryRun = false } = {}) {
  console.log('\n--- [3/6] Migrating Experience & Roles ---');

  const results = [];
  for (let i = 0; i < DEFAULT_EXPERIENCES.length; i++) {
    const exp = DEFAULT_EXPERIENCES[i];
    const rawId = exp._id || `exp-${i + 1}`;
    const docId: string = rawId.startsWith('exp-') ? `experience-${rawId.replace('exp-', '')}` : rawId;
    const targetDoc = {
      _id: docId,
      _type: 'experience',
      position: exp.position,
      employer: exp.employer,
      employmentRange: exp.employmentRange,
      mainDescription: exp.mainDescription,
      accomplishments: exp.accomplishments || [],
      isCurrent: Boolean(exp.isCurrent),
      order: exp.order ?? (i + 1),
    };

    if (dryRun) {
      console.log(`[DRY-RUN] Target Experience document (${docId}):`, JSON.stringify(targetDoc, null, 2));
      results.push(targetDoc);
    } else {
      console.log(`Writing experience document "${docId}" (${exp.position} @ ${exp.employer})...`);
      const res = await v2Client.createOrReplace(targetDoc);
      console.log(`✓ Experience "${docId}" written successfully`);
      results.push(res);
    }
  }

  console.log(`✓ Completed migrating ${results.length} experience records.`);
  return results;
}

if (process.argv[1]?.endsWith('v1_to_v2_experience.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateExperiences({ dryRun: isDryRun }).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

