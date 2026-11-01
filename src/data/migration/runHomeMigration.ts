import { migrateProfile } from './v1_to_v2_profile';
import { migrateSummaryOverview } from './v1_to_v2_summaryOverview';
import { migrateExperiences } from './v1_to_v2_experience';
import { migrateFocusPillars } from './v1_to_v2_focusPillar';
import { migrateContact } from './v1_to_v2_contact';
import { migrateEmailContactInquiryTemplate } from './v1_to_v2_emailContactInquiryTemplate';

export async function runAllHomeMigrations({ dryRun = false } = {}) {
  console.log('====================================================');
  console.log(`Starting Home Page Schemas Migration (dryRun: ${dryRun})`);
  console.log('Source v1 (Read-Only): se9bi4c1 | Target v2: 105v1dbr');
  console.log('====================================================');

  const stats = {
    profile: false,
    summaryOverview: false,
    experiences: 0,
    focusPillars: 0,
    contact: false,
    emailTemplate: false,
  };

  try {
    // 1. Profile with extracted skill chips
    await migrateProfile({ dryRun });
    stats.profile = true;

    // 2. Summary Overview
    await migrateSummaryOverview({ dryRun });
    stats.summaryOverview = true;

    // 3. Experiences & Roles
    const expResults = await migrateExperiences({ dryRun });
    stats.experiences = Array.isArray(expResults) ? expResults.length : 0;

    // 4. Focus Pillars
    const fpResults = await migrateFocusPillars({ dryRun });
    stats.focusPillars = Array.isArray(fpResults) ? fpResults.length : 0;

    // 5. Contact (Global)
    await migrateContact({ dryRun });
    stats.contact = true;

    // 6. Email Contact Inquiry Template
    await migrateEmailContactInquiryTemplate({ dryRun });
    stats.emailTemplate = true;

    console.log('\n====================================================');
    console.log('Migration Completed Successfully!');
    console.log('Summary:', stats);
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Migration encountered an error:', error);
    throw error;
  }
}

if (process.argv[1]?.endsWith('runHomeMigration.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  runAllHomeMigrations({ dryRun: isDryRun }).catch(() => {
    process.exit(1);
  });
}

