import { defineArrayMember, defineField, defineType } from 'sanity';
import { authorField } from './fields/author';

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
      name: 'media',
      title: 'Media & Gallery Assets',
      description: 'Images and videos used as project card backgrounds and full-bleed carousels',
      type: 'array',
      of: [
        // 1. Image Asset
        defineArrayMember({
          name: 'projectMediaImage',
          title: 'Image',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              description: 'Accessible description of the image',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              title: 'alt',
              subtitle: 'caption',
              media: 'asset',
            },
            prepare({ title, subtitle, media }) {
              return {
                title: title || 'Project Image',
                subtitle: subtitle || 'Image asset',
                media,
              };
            },
          },
        }),

        // 2. Native Sanity CDN Video
        defineArrayMember({
          name: 'projectMediaSanityVideo',
          title: 'Native Sanity Video',
          type: 'file',
          options: {
            accept: 'video/mp4,video/webm,video/quicktime',
          },
          fields: [
            defineField({
              name: 'title',
              title: 'Video Title / Label',
              type: 'string',
            }),
            defineField({
              name: 'poster',
              title: 'Video Poster / Cover Image',
              type: 'image',
              description: 'Thumbnail displayed prior to playback or in low-power modes',
              options: { hotspot: true },
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
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
                subtitle: subtitle || 'Uploaded to Sanity CDN',
                media,
              };
            },
          },
        }),

        // 3. YouTube Embed
        defineArrayMember({
          name: 'projectMediaYoutube',
          title: 'YouTube Embed',
          type: 'object',
          fields: [
            defineField({
              name: 'url',
              title: 'YouTube URL',
              type: 'url',
              description: 'Standard watch link (e.g. https://www.youtube.com/watch?v=...) or short link',
              validation: (Rule) =>
                Rule.required().custom((url) => {
                  if (!url) return true;
                  const isYouTube = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)/.test(url);
                  return isYouTube ? true : 'Must be a valid YouTube URL';
                }),
            }),
            defineField({
              name: 'title',
              title: 'Video Title',
              type: 'string',
            }),
            defineField({
              name: 'poster',
              title: 'Custom Thumbnail / Poster',
              type: 'image',
              description: 'Optional custom cover image override',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
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

        // 4. Vimeo Embed
        defineArrayMember({
          name: 'projectMediaVimeo',
          title: 'Vimeo Embed',
          type: 'object',
          fields: [
            defineField({
              name: 'url',
              title: 'Vimeo URL',
              type: 'url',
              description: 'Vimeo video URL (e.g. https://vimeo.com/123456789)',
              validation: (Rule) =>
                Rule.required().custom((url) => {
                  if (!url) return true;
                  const isVimeo = /vimeo\.com\/\d+/.test(url);
                  return isVimeo ? true : 'Must be a valid Vimeo video URL';
                }),
            }),
            defineField({
              name: 'title',
              title: 'Video Title',
              type: 'string',
            }),
            defineField({
              name: 'poster',
              title: 'Custom Thumbnail / Poster',
              type: 'image',
              description: 'Optional custom cover image override',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
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
    authorField,
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
      priorityValue: 'priorityValue',
      author: 'author',
    },
    prepare({ title, subtitle, media, featured, hidden, priorityValue, author }) {
      const tags = [];
      if (featured) tags.push('★ Featured');
      if (hidden) tags.push('🚫 Hidden');
      const priorityLabel = `Priority: ${priorityValue ?? 0}`;
      const authorLabel = `Author: ${author || 'Human'}`;
      const meta = [priorityLabel, authorLabel, subtitle || 'Project', ...tags].filter(Boolean);
      return {
        title,
        subtitle: meta.join(' · '),
        media,
      };
    },
  },
});
