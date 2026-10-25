import { defineArrayMember, defineField, defineType } from 'sanity';

export const backlinkItem = defineType({
  name: 'backlinkItem',
  title: 'Backlink Item',
  type: 'object',
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform Name',
      type: 'string',
      placeholder: 'e.g. GitHub, Live Demo, Figma, Documentation',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Target URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Platform Icon (Optional)',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: {
      title: 'platform',
      subtitle: 'url',
      media: 'icon',
    },
  },
});

export const commonMediaFields = [
  defineField({
    name: 'title',
    title: 'Media Title',
    type: 'string',
    description: 'Optional display title shown in the lightbox and overlays',
  }),
  defineField({
    name: 'description',
    title: 'Detailed Description',
    type: 'text',
    rows: 3,
    description: 'Detailed technical context displayed in the lightbox details panel or mobile overlay',
  }),
  defineField({
    name: 'backlinks',
    title: 'Backlinks',
    type: 'array',
    description: 'Reference links to source code, live demos, or documentation with icons',
    of: [defineArrayMember({ type: 'backlinkItem' })],
  }),
  defineField({
    name: 'readTime',
    title: 'Read Time',
    type: 'string',
    placeholder: 'e.g. 3 min read',
  }),
  defineField({
    name: 'publishedAt',
    title: 'Published Date',
    type: 'datetime',
    initialValue: () => new Date().toISOString(),
  }),
];

export const projectMediaImageType = defineType({
  name: 'projectMediaImage',
  title: 'Image Block',
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
});

export const projectMediaSanityVideoType = defineType({
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
});

export const projectMediaYoutubeType = defineType({
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
            /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/.test(url);
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
        subtitle: subtitle || 'Video Link',
        media,
      };
    },
  },
});

export const projectMediaVimeoType = defineType({
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
        subtitle: subtitle || 'Video Link',
        media,
      };
    },
  },
});
