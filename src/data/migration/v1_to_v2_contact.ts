import { v2Client } from './sanityClients';
import { DEFAULT_CONTACT } from './defaultData';

export async function migrateContact({ dryRun = false } = {}) {
  console.log('\n--- [5/6] Migrating Contact (Global) ---');

  const targetDoc = {
    _id: 'contact',
    _type: 'contact',
    header: DEFAULT_CONTACT.header,
    shortDescription: DEFAULT_CONTACT.shortDescription,
    followUp: DEFAULT_CONTACT.followUp,
    contacts: DEFAULT_CONTACT.contacts,
    subjects: DEFAULT_CONTACT.subjects,
  };

  if (dryRun) {
    console.log('[DRY-RUN] Target Contact document prepared:', JSON.stringify(targetDoc, null, 2));
    return targetDoc;
  }

  console.log('Writing contact document to Sanity v2...');
  const result = await v2Client.createOrReplace(targetDoc);
  console.log(`✓ Contact document updated successfully (_id: ${result._id})`);
  return result;
}

if (process.argv[1]?.endsWith('v1_to_v2_contact.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateContact({ dryRun: isDryRun }).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

