import { v1Client, v2Client } from './sanityClients';
import { DEFAULT_PROFILE } from './defaultData';

interface TechStackItem {
  _id: string;
  name: string;
  category?: string;
}

export async function migrateProfile({ dryRun = false } = {}) {
  console.log('\n--- [1/6] Migrating Profile ---');

  // 1. Extract techStack names from v1 (Strict Read-Only)
  console.log('Fetching techStack from Portfolio v1...');
  const v1TechStacks: TechStackItem[] = await v1Client.fetch(
    '*[_type == "techStack"]{_id, name, category} | order(name asc)'
  );

  const extractedSkillNames = v1TechStacks
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name));

  console.log(`Extracted ${extractedSkillNames.length} skill chips from v1:`, extractedSkillNames);

  // 2. Fetch existing v2 profile to preserve any uploaded media asset references
  const existingV2Profile = await v2Client.fetch(
    '*[_type == "profile" && _id == "profile"][0]{_id, avatar, status}'
  );

  // 3. Assemble target document
  const targetDoc = {
    _id: 'profile',
    _type: 'profile',
    fullName: DEFAULT_PROFILE.fullName,
    headline: DEFAULT_PROFILE.headline,
    motto: DEFAULT_PROFILE.motto,
    status: {
      isAvailable: DEFAULT_PROFILE.status.isAvailable,
      statusMessage: DEFAULT_PROFILE.status.statusMessage,
      ...(existingV2Profile?.status?.icon ? { icon: existingV2Profile.status.icon } : {}),
    },
    currentAffiliation: DEFAULT_PROFILE.currentAffiliation,
    location: DEFAULT_PROFILE.location,
    education: DEFAULT_PROFILE.education,
    certifications: DEFAULT_PROFILE.certifications,
    socialLinks: DEFAULT_PROFILE.socialLinks,
    // Featured skills migrated directly from v1 techStack
    featuredSkills: extractedSkillNames.length > 0 ? extractedSkillNames : DEFAULT_PROFILE.featuredSkills,
    ...(existingV2Profile?.avatar ? { avatar: existingV2Profile.avatar } : {}),
  };

  if (dryRun) {
    console.log('[DRY-RUN] Target Profile document prepared:', JSON.stringify(targetDoc, null, 2));
    return targetDoc;
  }

  // 4. Commit to Sanity v2
  console.log('Writing profile document to Sanity v2...');
  const result = await v2Client.createOrReplace(targetDoc);
  console.log(`✓ Profile document updated successfully (_id: ${result._id})`);
  return result;
}

// Allow standalone execution
if (process.argv[1]?.endsWith('v1_to_v2_profile.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateProfile({ dryRun: isDryRun }).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
