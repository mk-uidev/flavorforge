import type { CollectionConfig } from 'payload'

export const OrderStatusHistory: CollectionConfig = {
  slug: 'order-status-history',
  admin: {
    useAsTitle: 'order',
    hidden: true, // Hide from main admin navigation
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user?.collection === 'users' && (user as { roles?: string[] })?.roles?.includes('admin')),
    delete: ({ req: { user } }) => Boolean(user?.collection === 'users' && (user as { roles?: string[] })?.roles?.includes('admin')),
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Preparing', value: 'preparing' },
        { label: 'Out for Delivery', value: 'out-for-delivery' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'changedBy',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      label: 'Changed By',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Status Change Notes',
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          data.timestamp = new Date()
        }
        return data
      },
    ],
  },
}
