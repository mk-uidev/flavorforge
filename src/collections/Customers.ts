import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: ['firstName', 'lastName', 'email', 'phone', 'totalOrders'],
    group: 'Store',
  },
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: false, // Disable email verification for immediate registration
    forgotPassword: {
      generateEmailHTML: (args) => {
        const { token, user } = args || {}
        return `
          <h1>Reset your password</h1>
          <p>Hi ${user.firstName},</p>
          <p>Click the link below to reset your password:</p>
          <a href="${process.env.NEXT_PUBLIC_PAYLOAD_URL}/reset-password?token=${token}">
            Reset Password
          </a>
        `
      },
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) {
        // Admin users from Users collection OR hardcoded admin email
        if ((user.collection === 'users' && (user as { roles?: string[] }).roles?.includes('admin')) || (user as { email?: string }).email === 'admin@circle-kitchen.om') {
          return true
        }
        // Customers can only see their own profile
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },
    create: () => true, // Anyone can register
    update: ({ req: { user } }) => {
      if (user) {
        // Admin users from Users collection OR hardcoded admin email
        if ((user.collection === 'users' && (user as { roles?: string[] }).roles?.includes('admin')) || (user as { email?: string }).email === 'admin@circle-kitchen.om') {
          return true
        }
        // Customers can only update their own profile
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },
    delete: ({ req: { user } }) => (user?.collection === 'users' && (user as { roles?: string[] })?.roles?.includes('admin')) || (user as { email?: string })?.email === 'admin@circle-kitchen.om',
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      label: 'First Name',
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      label: 'Last Name',
    },
    {
      name: 'phone',
      type: 'text',
      required: false,
      label: 'Phone Number',
      validate: (value: string | null | undefined) => {
        // Basic Omani phone number validation - completely optional
        if (!value || value.trim() === '') return true // Skip validation if empty
        const phoneRegex = /^(\+968|968|0)?[79]\d{7}$/
        if (!phoneRegex.test(value)) {
          return 'Please enter a valid Omani phone number'
        }
        return true
      },
    },
    {
      name: 'dateOfBirth',
      type: 'date',
      label: 'Date of Birth',
    },
    {
      name: 'defaultAddress',
      type: 'group',
      label: 'Default Delivery Address',
      admin: {
        description: 'Optional: Save your default delivery address for faster checkout',
      },
      fields: [
        {
          name: 'street',
          type: 'text',
          label: 'Street Address',
          required: false,
        },
        {
          name: 'area',
          type: 'text',
          label: 'Area/Neighborhood',
          required: false,
        },
        {
          name: 'city',
          type: 'text',
          label: 'City',
          defaultValue: 'Muscat',
          required: false,
        },
        {
          name: 'postalCode',
          type: 'text',
          label: 'Postal Code',
          required: false,
        },
      ],
    },
    {
      name: 'dietaryPreferences',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Vegetarian', value: 'vegetarian' },
        { label: 'Vegan', value: 'vegan' },
        { label: 'Halal', value: 'halal' },
        { label: 'No Spicy Food', value: 'no-spicy' },
        { label: 'Low Sodium', value: 'low-sodium' },
        { label: 'Gluten Free', value: 'gluten-free' },
      ],
    },
    {
      name: 'allergens',
      type: 'text',
      label: 'Food Allergies',
      admin: {
        description: 'Please list any food allergies or restrictions',
      },
    },
    {
      name: 'preferredSpiceLevel',
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
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Account Active',
      access: {
        update: ({ req: { user } }) => (user?.collection === 'users' && (user as { roles?: string[] })?.roles?.includes('admin')) || (user as { email?: string })?.email === 'admin@circle-kitchen.om',
      },
    },
    {
      name: 'totalOrders',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
      label: 'Total Orders Placed',
    },
    {
      name: 'totalSpent',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
      label: 'Total Amount Spent (OMR)',
    },
    {
      name: 'lastOrderDate',
      type: 'date',
      admin: {
        readOnly: true,
      },
      label: 'Last Order Date',
    },
    {
      name: 'loyaltyPoints',
      type: 'number',
      defaultValue: 0,
      label: 'Loyalty Points',
    },

  ],
}
