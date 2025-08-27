import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'createdAt'],
    group: 'Content',
  },
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      },
      {
        name: 'icon',
        width: 64,
        height: 64,
        position: 'centre',
      },
      {
        name: 'icon-large',
        width: 128,
        height: 128,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  access: {
    read: () => true, // Public read access for media files
    create: ({ req: { user } }) => Boolean(user), // Only authenticated users can upload
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
      admin: {
        description: 'Alternative text for accessibility and SEO',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: {
        description: 'Optional caption for the image',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Media Category',
      options: [
        { label: 'Category Icons', value: 'category-icons' },
        { label: 'Product Images', value: 'product-images' },
        { label: 'General', value: 'general' },
      ],
      defaultValue: 'general',
      admin: {
        description: 'Categorize media for easier organization',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create') {
          data.uploadedBy = req.user?.id
        }
        return data
      },
    ],
  },
}
