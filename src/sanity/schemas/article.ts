import { defineArrayMember, defineField, defineType } from 'sanity';
import { authorField } from './fields/author';
import { commonMediaFields } from './blog';

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

        // 1. Image Block
        defineArrayMember({
          name: 'projectMediaImage',
          title: 'Image Block',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
            ...commonMediaFields,
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'caption',
              media: 'asset',
            },
            prepare({ title, subtitle, media }) {
              return {
                title: title || 'Image Block',
                subtitle: subtitle || 'Image Asset',
                media,
              };
            },
          },
        }),

        // 2. Native Video Block
        defineArrayMember({
          name: 'projectMediaSanityVideo',
          title: 'Native Sanity Video',
          type: 'file',
          options: {
            accept: 'video/mp4,video/webm,video/quicktime',
          },
          fields: [
            defineField({
              name: 'poster',
              title: 'Video Poster / Cover Image',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
            ...commonMediaFields,
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'caption',
              media: 'poster',
            },
            prepare({ title, subtitle, media }) {
              return {
                title: title || 'Native Video Asset',
                subtitle: subtitle || 'Uploaded Video',
                media,
              };
            },
          },
        }),

        // 3. YouTube Embed Block
        defineArrayMember({
          name: 'projectMediaYoutube',
          title: 'YouTube Embed',
          type: 'object',
          fields: [
            defineField({
              name: 'url',
              title: 'YouTube URL',
              type: 'url',
              validation: (Rule) =>
                Rule.required().custom((url) => {
                  if (!url) return true;
                  const isYouTube =
                    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/.test(
                      url
                    );
                  return isYouTube ? true : 'Must be a valid YouTube URL';
                }),
            }),
            defineField({
              name: 'poster',
              title: 'Custom Thumbnail / Poster',
              type: 'image',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
            ...commonMediaFields,
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'url',
              media: 'poster',
            },
            prepare({ title, subtitle, media }) {
              return {
                title: title || 'YouTube Video',
                subtitle: subtitle || 'YouTube Embed',
                media,
              };
            },
          },
        }),

        // 4. Vimeo Embed Block
        defineArrayMember({
          name: 'projectMediaVimeo',
          title: 'Vimeo Embed',
          type: 'object',
          fields: [
            defineField({
              name: 'url',
              title: 'Vimeo URL',
              type: 'url',
              validation: (Rule) =>
                Rule.required().custom((url) => {
                  if (!url) return true;
                  const isVimeo = /vimeo\.com\/(?:video\/)?(\d+)/.test(url);
                  return isVimeo ? true : 'Must be a valid Vimeo URL';
                }),
            }),
            defineField({
              name: 'poster',
              title: 'Custom Thumbnail / Poster',
              type: 'image',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
            ...commonMediaFields,
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'url',
              media: 'poster',
            },
            prepare({ title, subtitle, media }) {
              return {
                title: title || 'Vimeo Video',
                subtitle: subtitle || 'Vimeo Embed',
                media,
              };
            },
          },
        }),
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
