import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './src/sanity/schemas';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '105v1dbr';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
  name: 'default',
  title: 'Benjineer Portfolio Studio',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Singleton Contact Document (Global)
            S.listItem()
              .title('Contact (Global)')
              .id('contact')
              .child(
                S.document()
                  .schemaType('contact')
                  .documentId('contact')
              ),

            // Singleton Email Contact Inquiry Template Document
            S.listItem()
              .title('Email Contact Inquiry Template')
              .id('emailContactInquiryTemplate')
              .child(
                S.document()
                  .schemaType('emailContactInquiryTemplate')
                  .documentId('emailContactInquiryTemplate')
              ),

            // Horizontal line separator
            S.divider(),

            // Singleton Profile Document (Sidebar)
            S.listItem()
              .title('Profile (Sidebar)')
              .id('profile')
              .child(
                S.document()
                  .schemaType('profile')
                  .documentId('profile')
              ),

            // Horizontal line separator
            S.divider(),

            // Home Page Grouped Schemas
            S.listItem()
              .title('Summary Overview')
              .id('summaryOverview')
              .child(
                S.document()
                  .schemaType('summaryOverview')
                  .documentId('summaryOverview')
              ),
            S.documentTypeListItem('focusPillar').title('Focus Pillars'),
            S.documentTypeListItem('experience').title('Experience & Roles'),

            // Horizontal line separator
            S.divider(),

            // Projects
            S.documentTypeListItem('project').title('Projects'),

            // Horizontal line separator
            S.divider(),

            // Blog Preview
            S.listItem()
              .title('Blog Preview')
              .id('blog')
              .child(
                S.document()
                  .schemaType('blog')
                  .documentId('blog')
              ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
