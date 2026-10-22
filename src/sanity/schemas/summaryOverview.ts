import { defineField, defineType } from 'sanity';

export const summaryOverviewType = defineType({
  name: 'summaryOverview',
  title: 'Summary Overview',
  type: 'document',
  fields: [
    defineField({
      name: 'summaryText',
      title: 'Summary Overview Text',
      type: 'array',
      description: 'Concise intro summary on the Home page. Allows bold (**strong**) formatting. Keep under 350 characters.',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
            ],
            annotations: [],
          },
        },
      ],
      validation: (Rule) =>
        Rule.custom((blocks) => {
          if (!blocks || !Array.isArray(blocks)) return true;
          const text = blocks
            // @ts-expect-error portable text block extraction
            .map((b) => b.children?.map((c) => c.text).join('') || '')
            .join(' ');
          return text.length > 350
            ? 'Summary overview should be concise (max 350 characters)'
            : true;
        }),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Summary Overview',
        subtitle: 'Home page intro motto & overview statement',
      };
    },
  },
});
