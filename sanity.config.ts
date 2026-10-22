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
            // Singleton Profile Document
            S.listItem()
              .title('Profile (sidebar)')
              .id('profile')
              .child(
                S.document()
                  .schemaType('profile')
                  .documentId('profile')
              ),
            // Generic list items excluding singleton
            ...S.documentTypeListItems().filter(
              (listItem) => listItem.getId() !== 'profile'
            ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
