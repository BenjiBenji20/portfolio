import { defineField, defineType } from 'sanity';

export const projectType = defineType({
  name: 'project',
  title: 'Projects',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL identifier (serves as the slug reference for blog articles)',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      description: 'Concise summary displayed on project and home cards',
      validation: (Rule) => Rule.required().max(280),
    }),
    defineField({
      name: 'projectType',
      title: 'Project Type / Category',
      type: 'string',
      placeholder: 'e.g. RAG, Edge AI, Public Site, AI, Automation',
      description: 'Domain classification (e.g. RAG, Edge AI, SaaS Portal, Computer Vision, Automation)',
    }),
    defineField({
      name: 'employer',
      title: 'Client / Employer',
      type: 'string',
      description: 'Optional company or client associated with this project',
    }),
    defineField({
      name: 'collaborators',
      title: 'Collaborators',
      type: 'array',
      description: 'Teammates or co-engineers who contributed to this project',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Collaborator Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'role',
              title: 'Contribution / Role',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'Profile / Portfolio URL',
              type: 'url',
            }),
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'role',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'logo',
      title: 'Project Logo / Icon',
      type: 'image',
      description: 'Optional square/circular logo or icon for the project',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          initialValue: 'Project logo',
        }),
      ],
    }),
    defineField({
      name: 'website',
      title: 'Live Website URL',
      type: 'url',
    }),
    defineField({
      name: 'repository',
      title: 'Repository URL',
      type: 'url',
    }),
    defineField({
      name: 'techStacks',
      title: 'Tech Stacks',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'status',
      title: 'Project Status',
      type: 'string',
      options: {
        list: [
          { title: 'In Development', value: 'development' },
          { title: 'Production / Live', value: 'production' },
          { title: 'Completed', value: 'completed' },
          { title: 'Archived', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'production',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dateStarted',
      title: 'Date Started',
      type: 'date',
    }),
    defineField({
      name: 'dateFinished',
      title: 'Date Finished',
      type: 'date',
      description: 'Leave empty if currently active or ongoing',
    }),
    defineField({
      name: 'featured',
      title: 'Featured on Home',
      type: 'boolean',
      description: 'Enable to display in Home’s Featured Projects section (limit 4)',
      initialValue: false,
    }),
    defineField({
      name: 'hidden',
      title: 'Hidden from Portfolio',
      type: 'boolean',
      description: 'If enabled, hides this project and its associated blog page from the site',
      initialValue: false,
    }),
    defineField({
      name: 'priorityValue',
      title: 'Priority Value',
      type: 'number',
      description: 'Display weight (higher values display first)',
      initialValue: 0,
      validation: (Rule) => Rule.integer(),
    }),
  ],
  orderings: [
    {
      title: 'Priority (High to Low)',
      name: 'priorityDesc',
      by: [
        { field: 'priorityValue', direction: 'desc' },
        { field: 'dateStarted', direction: 'desc' },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'projectType',
      media: 'logo',
      featured: 'featured',
      hidden: 'hidden',
    },
    prepare({ title, subtitle, media, featured, hidden }) {
      const tags = [];
      if (featured) tags.push('★ Featured');
      if (hidden) tags.push('🚫 Hidden');
      return {
        title,
        subtitle: `${subtitle || 'Project'}${tags.length ? ` · ${tags.join(' ')}` : ''}`,
        media,
      };
    },
  },
});
