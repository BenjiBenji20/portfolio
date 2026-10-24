import { defineArrayMember, defineField, defineType } from 'sanity';
import { authorField } from './fields/author';

export const workLogType = defineType({
  name: 'workLog',
  title: 'Work Logs',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Log Title / Milestone',
      type: 'string',
      placeholder: 'e.g. PPR & Streaming Layout Boundaries',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'project',
      title: 'Parent Project',
      type: 'reference',
      to: [{ type: 'project' }],
      description: 'The parent project this work log belongs to (search and select existing project)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'badge',
      title: 'Category Badge',
      type: 'string',
      options: {
        list: [
          { title: 'Production Release', value: 'Production Release' },
          { title: 'Architecture', value: 'Architecture' },
          { title: 'Optimization', value: 'Optimization' },
          { title: 'Security', value: 'Security' },
          { title: 'Feature', value: 'Feature' },
          { title: 'Refactor', value: 'Refactor' },
        ],
      },
      initialValue: 'Feature',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Log Date',
      type: 'date',
      initialValue: () => new Date().toISOString().split('T')[0],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Technical Summary (Markdown)',
      type: 'text',
      rows: 4,
      description:
        'Autonomous (for agentic writer) devlog summary highlighting technical changes, trade-offs, and architecture',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'commitSha',
      title: 'Git Commit SHA (Optional)',
      type: 'string',
      description: 'Associated commit hash for linking back to GitHub diff',
    }),
    defineField({
      name: 'backlinks',
      title: 'Reference Backlinks (Optional)',
      type: 'array',
      description:
        'External link references (e.g. GitHub Pull Request, commit diff, deployment preview, or documentation) uploaded by the AI agent or human author for direct technical verification',
      of: [defineArrayMember({ type: 'backlinkItem' })],
    }),
    authorField,
    defineField({
      name: 'developers',
      title: 'Contributing Developers',
      type: 'array',
      description:
        'Names of developer(s) who created or collaborated on the associated commit or Pull Request',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
  ],
  orderings: [
    {
      title: 'Date (Newest First)',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      projectTitle: 'project.title',
      projectSlug: 'project.slug.current',
      badge: 'badge',
      date: 'date',
      author: 'author',
    },
    prepare({ title, projectTitle, projectSlug, badge, date, author }) {
      const proj = projectTitle || projectSlug || '';
      return {
        title: title || 'Work Log Entry',
        subtitle: `[${badge || 'Log'}] ${proj} · ${date || ''} · ${author || 'Agentic Writer'}`,
      };
    },
  },
});
