import { v2Client } from './sanityClients';

async function check() {
  const counts = await v2Client.fetch(`{
    "profile": count(*[_type == "profile"]),
    "summaryOverview": count(*[_type == "summaryOverview"]),
    "experience": count(*[_type == "experience"]),
    "focusPillar": count(*[_type == "focusPillar"]),
    "contact": count(*[_type == "contact"]),
    "emailTemplate": count(*[_type == "emailContactInquiryTemplate"]),
    "project": count(*[_type == "project"]),
    "blog": count(*[_type == "blog"]),
    "article": count(*[_type == "article"]),
    "workLog": count(*[_type == "workLog"])
  }`);

  console.log('Sanity v2 Final Dataset Document Counts:');
  console.table(counts);
}

check().catch(console.error);
