import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'roles', 'createdAt'],
    group: 'System',
  },
  auth: true,
  access: {
    read: ({ req: { user } }) => {
      // Allow users to read their own profile, admins can read all
      if (user) {
        if ((user as { roles?: string[] }).roles?.includes('admin')) {
          return true
        }
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },
    create: ({ req: { user } }) => {
      // Only admins can create new users
      return (user as { roles?: string[] } | null)?.roles?.includes('admin') ?? false
    },
    update: ({ req: { user } }) => {
      // Admins can update any user, users can update themselves
      if (user) {
        if ((user as { roles?: string[] }).roles?.includes('admin')) {
          return true
        }
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete users
      return (user as { roles?: string[] } | null)?.roles?.includes('admin') ?? false
    },
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['user'],
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'User',
          value: 'user',
        },
        {
          label: 'Customer',
          value: 'customer',
        },
      ],
      access: {
        // Only admins can modify roles
        update: ({ req: { user } }) => (user as { roles?: string[] } | null)?.roles?.includes('admin') ?? false,
      },
      admin: {
        description: 'Select user roles. Admins have full access to the system.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Account Active',
      access: {
        // Only admins can modify account status
        update: ({ req: { user } }) => (user as { roles?: string[] } | null)?.roles?.includes('admin') ?? false,
      },
    },
    {
      name: 'lastLogin',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last login timestamp',
      },
    },
  ],
}
