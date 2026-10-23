import { defineField, defineType } from 'sanity';

export const focusPillarType = defineType({
  name: 'focusPillar',
  title: 'Focus Pillars',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Pillar Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon Image',
      type: 'image',
      description: 'Rendered with 100% circular radius matching standard icon size (14x14px)',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          initialValue: 'Focus pillar icon',
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Sequence number (1, 2, 3) for horizontal pillar ordering',
      initialValue: 1,
      validation: (Rule) => Rule.integer(),
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      media: 'icon',
      order: 'order',
    },
    prepare({ title, subtitle, media, order }) {
      return {
        title,
        subtitle: `Order: ${order ?? 1} · ${subtitle || ''}`,
        media,
      };
    },
  },
});
