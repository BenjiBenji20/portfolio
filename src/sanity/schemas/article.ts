import { defineArrayMember, defineField, defineType } from 'sanity';
import { authorField } from './fields/author';

export const articleType = defineType({
  name: 'article',
  title: 'Articles',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Article Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Article Slug',
      type: 'slug',
      description: 'Unique URL identifier for this article route',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'project',
      title: 'Parent Project',
      type: 'reference',
      to: [{ type: 'project' }],
      description: 'The parent project this article belongs to (search and select existing project)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Short Excerpt',
      type: 'text',
      rows: 3,
      description: 'Teaser summary displayed in the 2x2 article grid',
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          initialValue: 'Article cover image',
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'readTime',
      title: 'Estimated Read Time',
      type: 'string',
      placeholder: 'e.g. 6 min read',
    }),
    defineField({
      name: 'priorityValue',
      title: 'Priority Value',
      type: 'number',
      description: 'Display weight (higher values display first in the 2x2 grid)',
      initialValue: 0,
      validation: (Rule) => Rule.integer(),
    }),
    authorField,
    defineField({
      name: 'developers',
      title: 'Contributing Developers',
      type: 'array',
      description:
        'Names of developer(s) who contributed to, authored, or collaborated on this article or feature',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'hidden',
      title: 'Hidden from Portfolio',
      type: 'boolean',
      description:
        'Approval Gate: If enabled (true), this article will not be visible on the public site. Set to false to approve and publish.',
      initialValue: true,
    }),
    defineField({
      name: 'content',
      title: 'Article Body (PortableText)',
      type: 'array',
      description: 'Rich article narrative with typography, code, and extensible media blocks',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 1', value: 'h1' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'URL',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'Target URL',
                  },
                ],
              },
            ],
          },
        }),

        defineArrayMember({ type: 'projectMediaImage' }),
        defineArrayMember({ type: 'projectMediaSanityVideo' }),
        defineArrayMember({ type: 'projectMediaYoutube' }),
        defineArrayMember({ type: 'projectMediaVimeo' }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Priority (High to Low)',
      name: 'priorityDesc',
      by: [
        { field: 'priorityValue', direction: 'desc' },
        { field: 'publishedAt', direction: 'desc' },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      projectTitle: 'project.title',
      projectSlug: 'project.slug.current',
      priorityValue: 'priorityValue',
      hidden: 'hidden',
      author: 'author',
      media: 'coverImage',
    },
    prepare({ title, projectTitle, projectSlug, priorityValue, hidden, author, media }) {
      const tags: string[] = [];
      if (hidden) tags.push('🚫 Hidden');
      const proj = projectTitle || projectSlug || 'No Project';
      const meta = [
        `Project: ${proj}`,
        `Priority: ${priorityValue ?? 0}`,
        author || 'Human',
        ...tags,
      ].filter(Boolean);

      return {
        title: title || 'Untitled Article',
        subtitle: meta.join(' · '),
        media,
      };
    },
  },
});
