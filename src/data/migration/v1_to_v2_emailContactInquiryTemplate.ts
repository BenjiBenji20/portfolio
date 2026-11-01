import { v2Client } from './sanityClients';
import { DEFAULT_EMAIL_INQUIRY_TEMPLATE } from './defaultData';

export async function migrateEmailContactInquiryTemplate({ dryRun = false } = {}) {
  console.log('\n--- [6/6] Migrating Email Contact Inquiry Template ---');

  const targetDoc = {
    _id: 'emailContactInquiryTemplate',
    _type: 'emailContactInquiryTemplate',
    dispatchType: DEFAULT_EMAIL_INQUIRY_TEMPLATE.dispatchType,
    subjectPrefix: DEFAULT_EMAIL_INQUIRY_TEMPLATE.subjectPrefix,
    headline: DEFAULT_EMAIL_INQUIRY_TEMPLATE.headline,
    footerNote: DEFAULT_EMAIL_INQUIRY_TEMPLATE.footerNote,
  };

  if (dryRun) {
    console.log('[DRY-RUN] Target Email Template document prepared:', JSON.stringify(targetDoc, null, 2));
    return targetDoc;
  }

  console.log('Writing emailContactInquiryTemplate document to Sanity v2...');
  const result = await v2Client.createOrReplace(targetDoc);
  console.log(`✓ Email Contact Inquiry Template document updated successfully (_id: ${result._id})`);
  return result;
}

if (process.argv[1]?.endsWith('v1_to_v2_emailContactInquiryTemplate.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateEmailContactInquiryTemplate({ dryRun: isDryRun }).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

