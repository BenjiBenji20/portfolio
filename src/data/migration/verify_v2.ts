import { v2Client } from './sanityClients';

interface SanityDocPreview {
  _id: string;
  _type: string;
  title?: string;
  position?: string;
  fullName?: string;
  header?: string;
  dispatchType?: string;
  featuredSkills?: string[];
}

async function verify() {
  console.log('Querying Sanity v2 to verify created documents...');
  const docs: SanityDocPreview[] = await v2Client.fetch(`*[
    _type in ["profile", "summaryOverview", "experience", "focusPillar", "contact", "emailContactInquiryTemplate"]
  ]{_id, _type, title, position, fullName, header, dispatchType, featuredSkills}`);

  console.log('Found documents in v2:');
  docs.forEach((d) => {
    console.log(`- [${d._type}] ID: ${d._id} | Label: ${d.fullName || d.position || d.title || d.header || d.dispatchType || d._id}`);
    if (d._type === 'profile') {
      console.log('  Featured Skills count:', d.featuredSkills?.length, d.featuredSkills);
    }
  });
}

verify().catch(console.error);

