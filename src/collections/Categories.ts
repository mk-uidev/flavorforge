import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'description', 'sortOrder', 'isActive'],
    group: 'Store',
  },
  access: {
    read: () => true, // Public read access for frontend
    create: ({ req: { user } }) => Boolean(user), // Authenticated users can create
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      label: 'Category Name',
      admin: {
        description: 'Display name for the category (e.g., "Rice Dishes")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL Slug',
      admin: {
        description: 'URL-friendly version (e.g., "rice-dishes")',
        placeholder: 'auto-generated from name',
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Brief description of what this category includes',
        placeholder: 'e.g., Traditional rice dishes with aromatic spices...',
      },
    },
    {
      name: 'icon',
      type: 'relationship',
      relationTo: 'media',
      label: 'Category Icon',
      admin: {
        description: 'Upload an icon for this category (recommended: 64x64px, transparent background)',
      },
      filterOptions: {
        category: {
          equals: 'category-icons',
        },
      },
    },
    {
      name: 'imageUrl',
      type: 'text',
      label: 'Category Image URL (Fallback)',
      admin: {
        description: 'Optional fallback image URL if no icon is uploaded',
        placeholder: 'https://example.com/category-image.jpg',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Sort Order',
      admin: {
        description: 'Lower numbers appear first (0 = first)',
        step: 1,
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
      admin: {
        description: 'Only active categories are shown to customers',
      },
    },
    {
      name: 'itemCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of items in this category (auto-calculated)',
      },
      label: 'Item Count',
    },
  ],
  hooks: {
    afterChange: [
      async ({ req, doc }) => {
        // Update item count when category changes
        try {
          const itemCount = await req.payload.count({
            collection: 'products',
            where: {
              category: {
                equals: doc.id,
              },
            },
          })

          if (itemCount.totalDocs !== doc.itemCount) {
            await req.payload.update({
              collection: 'categories',
              id: doc.id,
              data: {
                itemCount: itemCount.totalDocs,
              },
            })
          }
        } catch (error) {
          console.error('Error updating category item count:', error)
        }
      },
    ],
  },
}
