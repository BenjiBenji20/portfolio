import { defineField, defineType } from 'sanity';

export const experienceType = defineType({
  name: 'experience',
  title: 'Experience & Roles',
  type: 'document',
  fields: [
    defineField({
      name: 'position',
      title: 'Position / Role Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'employer',
      title: 'Employer / Organization',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'employmentRange',
      title: 'Employment Period',
      type: 'string',
      placeholder: 'Sep 2026 — Present',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainDescription',
      title: 'Main Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'accomplishments',
      title: 'Accomplishments (Collapsible Bullets)',
      type: 'array',
      description: 'Hidden collapsible bullet points under the main role description',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'isCurrent',
      title: 'Currently Working Here',
      type: 'boolean',
      description: 'Highlights the timeline dot in sky-500',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order sequence (1 for most recent, 2, 3...)',
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
      title: 'position',
      subtitle: 'employer',
      isCurrent: 'isCurrent',
      order: 'order',
    },
    prepare({ title, subtitle, isCurrent, order }) {
      const orderLabel = `Order: ${order ?? 1}`;
      const meta = [orderLabel, subtitle, isCurrent ? '(Current)' : null].filter(Boolean);
      return {
        title,
        subtitle: meta.join(' · '),
      };
    },
  },
});
