import { defineArrayMember, defineField, defineType } from 'sanity';
import { backlinkItem, commonMediaFields } from './objects/media';

export { backlinkItem, commonMediaFields };


export const blogType = defineType({
  name: 'blog',
  title: 'Software Engineer Blog',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Blog Title',
      type: 'string',
      initialValue: 'Software Engineering Background & Works',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last Updated Date',
      type: 'datetime',
    }),
    defineField({
      name: 'readTime',
      title: 'Estimated Read Time',
      type: 'string',
      placeholder: 'e.g. 10 min read',
    }),
    defineField({
      name: 'content',
      title: 'Blog Content (PortableText)',
      type: 'array',
      description: 'Rich technical narrative with standard typography and standalone extensible media blocks',
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
  preview: {
    select: {
      title: 'title',
      subtitle: 'readTime',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Software Engineer Blog',
        subtitle: subtitle ? `Estimated read time: ${subtitle}` : 'Software Engineer Works',
      };
    },
  },
});
