import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerName', 'status', 'totalAmount', 'bookingDate'],
    group: 'Store',
  },
  versions: false, // Disable versioning to avoid "Changed By" requirement
  access: {
    read: ({ req: { user } }) => {
      if (user) {
        // Admin can see all orders
        if ((user.collection === 'users' && (user as { roles?: string[] }).roles?.includes('admin')) || (user as { email?: string }).email === 'admin@circle-kitchen.om') {
          return true
        }
        // Customers can only see their own orders
        return {
          customer: {
            equals: user.id,
          },
        }
      }
      return false
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (user) {
        // Admin can update any order
        if ((user.collection === 'users' && (user as { roles?: string[] }).roles?.includes('admin')) || (user as { email?: string }).email === 'admin@circle-kitchen.om') {
          return true
        }
        // Regular users can update orders (for status changes, etc.)
        return Boolean(user)
      }
      return false
    },
    delete: ({ req: { user } }) => {
      if (user) {
        return (user.collection === 'users' && (user as { roles?: string[] }).roles?.includes('admin')) || (user as { email?: string }).email === 'admin@circle-kitchen.om'
      }
      return false
    },
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ value, operation }) => {
            if (operation === 'create' && !value) {
              const timestamp = Date.now()
              return `ORD-${timestamp}`
            }
            return value
          },
        ],
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      label: 'Customer',
      admin: {
        allowCreate: false,
        description: 'Select the customer for this order',
      },
    },
    {
      name: 'customerName',
      type: 'text',
      admin: {
        readOnly: true,
        hidden: true, // Hidden in forms but used for display
        description: 'Auto-generated customer name for display',
      },
      hooks: {
        beforeChange: [
          async ({ value, req, data }) => {
            if (data?.customer && typeof data.customer === 'string') {
              try {
                const customer = await req.payload.findByID({
                  collection: 'customers',
                  id: data.customer,
                })
                return `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
              } catch (error) {
                console.error('Error fetching customer for name:', error)
                return 'Unknown Customer'
              }
            }
            return value || 'Unknown Customer'
          },
        ],
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'foodItem',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          label: 'Unit Price (OMR)',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'subtotal',
          type: 'number',
          required: true,
          label: 'Subtotal (OMR)',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      label: 'Total Amount (OMR)',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Preparing', value: 'preparing' },
        { label: 'Ready for Pickup', value: 'ready-for-pickup' },
        { label: 'Out for Delivery', value: 'out-for-delivery' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'serviceType',
      type: 'select',
      required: true,
      defaultValue: 'delivery',
      label: 'Service Type',
      options: [
        { label: 'Delivery', value: 'delivery' },
        { label: 'Pickup', value: 'pickup' },
      ],
      admin: {
        description: 'Whether this is a delivery or pickup order',
      },
    },
    {
      name: 'bookingDate',
      type: 'date',
      required: true,
      label: 'Service Date & Time',
      admin: {
        description: 'Must be at least 24 hours from order placement',
      },
      validate: (value) => {
        if (!value) return 'Booking date is required'
        const now = new Date()
        const bookingDate = new Date(value)
        const timeDiff = bookingDate.getTime() - now.getTime()
        const hoursDiff = timeDiff / (1000 * 3600)

        if (hoursDiff < 24) {
          return 'Booking must be at least 24 hours in advance'
        }
        return true
      },
    },
    {
      name: 'customerNotes',
      type: 'textarea',
      label: 'Customer Notes',
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Admin Notes',
      access: {
        read: ({ req: { user } }) => Boolean(user?.collection === 'users' && (user as { roles?: string[] })?.roles?.includes('admin')),
        update: ({ req: { user } }) => Boolean(user?.collection === 'users' && (user as { roles?: string[] })?.roles?.includes('admin')),
      },
    },
    {
      name: 'deliveryAddress',
      type: 'group',
      label: 'Delivery Address',
      admin: {
        condition: (data) => data?.serviceType === 'delivery',
        description: 'Required for delivery orders only',
      },
      fields: [
        {
          name: 'street',
          type: 'text',
          required: false,
          admin: {
            condition: (data, siblingData, { user }) => {
              // Get the parent data (order) to check serviceType
              const orderData = data || {}
              return orderData.serviceType === 'delivery'
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate: (value: any, { data }: any) => {
            if (data?.serviceType === 'delivery' && !value) {
              return 'Street address is required for delivery orders'
            }
            return true
          },
        },
        {
          name: 'area',
          type: 'text',
          required: false,
          admin: {
            condition: (data, siblingData, { user }) => {
              const orderData = data || {}
              return orderData.serviceType === 'delivery'
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate: (value: any, { data }: any) => {
            if (data?.serviceType === 'delivery' && !value) {
              return 'Area is required for delivery orders'
            }
            return true
          },
        },
        {
          name: 'city',
          type: 'text',
          required: false,
          defaultValue: 'Muscat',
          admin: {
            condition: (data, siblingData, { user }) => {
              const orderData = data || {}
              return orderData.serviceType === 'delivery'
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate: (value: any, { data }: any) => {
            if (data?.serviceType === 'delivery' && !value) {
              return 'City is required for delivery orders'
            }
            return true
          },
        },
        {
          name: 'postalCode',
          type: 'text',
          admin: {
            condition: (data, siblingData, { user }) => {
              const orderData = data || {}
              return orderData.serviceType === 'delivery'
            }
          },
        },
        {
          name: 'phone',
          type: 'text',
          required: false,
          admin: {
            condition: (data, siblingData, { user }) => {
              const orderData = data || {}
              return orderData.serviceType === 'delivery'
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validate: (value: any, { data }: any) => {
            if (data?.serviceType === 'delivery' && !value) {
              return 'Phone number is required for delivery orders'
            }
            return true
          },
        },
      ],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      name: 'estimatedDeliveryTime',
      type: 'date',
      label: 'Estimated Service Time',
      admin: {
        description: 'Estimated time for delivery or pickup completion',
      },
    },
    {
      name: 'actualDeliveryTime',
      type: 'date',
      label: 'Actual Service Time',
      admin: {
        description: 'Actual time when order was delivered or picked up',
      },
    },
  ],
}
