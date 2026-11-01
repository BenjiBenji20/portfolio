import { migrateBlog } from './v1_to_v2_blog';
import { migrateArticles } from './v1_to_v2_article';
import { migrateWorkLogs } from './v1_to_v2_workLog';

export async function runAllBlogMigrations({ dryRun = false } = {}) {
  console.log('====================================================');
  console.log(`Starting Blog, Articles & Work Logs Migration (dryRun: ${dryRun})`);
  console.log('Target: "blog", "article", and "workLog" collections ONLY.');
  console.log('Home page schemas (profile, overview, experience, etc.) are strictly EXCLUDED.');
  console.log('====================================================\n');

  const stats = {
    blog: false,
    articles: 0,
    workLogs: 0,
  };

  try {
    // 1. Blog Preview (Singleton)
    const blogRes = await migrateBlog({ dryRun });
    stats.blog = Boolean(blogRes);

    // 2. Articles (13 documents: 9 projectImages + 4 projectTechnology)
    const articlesRes = await migrateArticles({ dryRun });
    stats.articles = Array.isArray(articlesRes) ? articlesRes.length : 0;

    // 3. Work Logs (26 documents: projectBlogEntry / Daily Blog)
    const workLogsRes = await migrateWorkLogs({ dryRun });
    stats.workLogs = Array.isArray(workLogsRes) ? workLogsRes.length : 0;

    console.log('\n====================================================');
    console.log('Blog & Articles Migration Completed Successfully!');
    console.log('Summary:', stats);
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Blog ecosystem migration encountered an error:', error);
    throw error;
  }
}

if (process.argv[1]?.endsWith('runBlogMigration.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  runAllBlogMigrations({ dryRun: isDryRun }).catch(() => {
    process.exit(1);
  });
}

