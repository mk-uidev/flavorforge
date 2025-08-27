import type { CollectionConfig } from 'payload'

export const FoodItems: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Product',
    plural: 'Products',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Store',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Product Name',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Category',
      admin: {
        description: 'Select the category this product belongs to',
      },
      filterOptions: {
        isActive: {
          equals: true,
        },
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Price (OMR)',
      min: 0,
      admin: {
        description: 'Price in Omani Riyal',
      },
    },
    {
      name: 'minOrderQuantity',
      type: 'number',
      defaultValue: 1,
      min: 1,
      label: 'Minimum Order Quantity',
      admin: {
        description: 'Minimum number of units customers must order (e.g., 2 for family portions)',
      },
    },
    // Offer/Discount Section
    {
      name: 'isOnOffer',
      type: 'checkbox',
      defaultValue: false,
      label: 'Enable Offer/Discount',
      admin: {
        description: 'Check to enable special pricing for this product',
      },
    },
    {
      name: 'discountType',
      type: 'select',
      options: [
        { label: 'Percentage Off', value: 'percentage' },
        { label: 'Fixed Amount Off', value: 'fixed' },
      ],
      defaultValue: 'percentage',
      label: 'Discount Type',
      admin: {
        condition: (data) => Boolean(data?.isOnOffer),
        description: 'Choose how the discount should be calculated',
      },
    },
    {
      name: 'discountValue',
      type: 'number',
      min: 0,
      label: 'Discount Value',
      admin: {
        condition: (data) => Boolean(data?.isOnOffer),
        description: 'For percentage: enter number (e.g., 20 for 20% off). For fixed: enter amount in OMR',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validate: (value: any, { data }: any) => {
        if (!data?.isOnOffer) return true;
        if (!value || value <= 0) return 'Discount value must be greater than 0';
        if (data.discountType === 'percentage' && value > 100) {
          return 'Percentage discount cannot exceed 100%';
        }
        if (data.discountType === 'fixed' && value >= data.price) {
          return 'Fixed discount cannot exceed the product price';
        }
        return true;
      },
    },
    {
      name: 'offerStartDate',
      type: 'date',
      label: 'Offer Start Date',
      admin: {
        condition: (data) => Boolean(data?.isOnOffer),
        description: 'When the offer becomes active (optional - leave empty for immediate start)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'offerEndDate',
      type: 'date',
      label: 'Offer End Date',
      admin: {
        condition: (data) => Boolean(data?.isOnOffer),
        description: 'When the offer expires (optional - leave empty for no expiration)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'preparationTime',
      type: 'number',
      required: true,
      label: 'Preparation Time (minutes)',
      min: 0,
    },
    {
      name: 'isAvailable',
      type: 'checkbox',
      defaultValue: true,
      label: 'Available for Order',
    },
    {
      name: 'isVegetarian',
      type: 'checkbox',
      defaultValue: false,
      label: 'Vegetarian',
    },
    {
      name: 'isSpicy',
      type: 'select',
      options: [
        { label: 'Mild', value: 'mild' },
        { label: 'Medium', value: 'medium' },
        { label: 'Hot', value: 'hot' },
        { label: 'Very Hot', value: 'very-hot' },
      ],
      defaultValue: 'mild',
    },
    {
      name: 'ingredients',
      type: 'textarea',
      label: 'Ingredients',
    },
    {
      name: 'allergens',
      type: 'text',
      label: 'Allergens',
      admin: {
        description: 'Common allergens (nuts, dairy, gluten, etc.)',
      },
    },
    {
      name: 'image',
      type: 'relationship',
      relationTo: 'media',
      label: 'Product Image',
      admin: {
        description: 'Upload a product image from your media library (recommended: 768x1024px)',
      },
      filterOptions: {
        mimeType: {
          contains: 'image/',
        },
      },
    },
    {
      name: 'imageUrl',
      type: 'text',
      label: 'Product Image URL (Fallback)',
      admin: {
        description: 'Optional fallback image URL if no image is uploaded above',
        placeholder: 'https://example.com/image.jpg',
      },
    },
    {
      name: 'servingSize',
      type: 'text',
      label: 'Serving Size',
      defaultValue: '1 person',
    },
  ],
}
