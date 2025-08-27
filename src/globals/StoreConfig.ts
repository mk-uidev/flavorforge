import type { GlobalConfig } from 'payload'

export const StoreConfig: GlobalConfig = {
  slug: 'store-config',
  label: 'Store Configuration',
  admin: {
    group: 'Store',
    description: 'Configure your store settings including currency and display options',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      // Only admins can update store config
      return Boolean(user && user.collection === 'users' && (user as { roles?: string[] })?.roles?.includes('admin'))
    },
  },
  fields: [
    {
      name: 'storeName',
      type: 'text',
      label: 'Store Name',
      defaultValue: 'FlavorForge',
      required: true,
      admin: {
        description: 'The name of your store',
      },
    },
    {
      name: 'currency',
      type: 'select',
      label: 'Store Currency',
      required: true,
      defaultValue: 'USD',
      options: [
        {
          label: 'US Dollar (USD) - $',
          value: 'USD',
        },
        {
          label: 'Euro (EUR) - €',
          value: 'EUR',
        },
        {
          label: 'British Pound (GBP) - £',
          value: 'GBP',
        },
        {
          label: 'Omani Rial (OMR) - ر.ع.',
          value: 'OMR',
        },
        {
          label: 'UAE Dirham (AED) - د.إ',
          value: 'AED',
        },
        {
          label: 'Saudi Riyal (SAR) - ﷼',
          value: 'SAR',
        },
        {
          label: 'Indian Rupee (INR) - ₹',
          value: 'INR',
        },
        {
          label: 'Canadian Dollar (CAD) - C$',
          value: 'CAD',
        },
        {
          label: 'Australian Dollar (AUD) - A$',
          value: 'AUD',
        },
        {
          label: 'Japanese Yen (JPY) - ¥',
          value: 'JPY',
        },
        {
          label: 'Chinese Yuan (CNY) - ¥',
          value: 'CNY',
        },
      ],
      admin: {
        description: 'Select the currency for your store. This will affect how prices are displayed.',
      },
    },
    {
      name: 'currencySymbol',
      type: 'text',
      label: 'Currency Symbol',
      defaultValue: '$',
      required: true,
      admin: {
        description: 'The symbol that will be displayed with prices (e.g., $, €, £, ر.ع.)',
      },
    },
    {
      name: 'currencyPosition',
      type: 'select',
      label: 'Currency Symbol Position',
      required: true,
      defaultValue: 'before',
      options: [
        {
          label: 'Before Amount ($10.00)',
          value: 'before',
        },
        {
          label: 'After Amount (10.00$)',
          value: 'after',
        },
      ],
      admin: {
        description: 'Choose where to display the currency symbol relative to the price',
      },
    },
    {
      name: 'showRatings',
      type: 'checkbox',
      label: 'Show Product Ratings',
      defaultValue: true,
      admin: {
        description: 'Toggle to show or hide product ratings throughout your store',
      },
    },
    {
      name: 'allowReviews',
      type: 'checkbox',
      label: 'Allow Customer Reviews',
      defaultValue: true,
      admin: {
        description: 'Allow customers to leave reviews and ratings for products',
      },
    },
    {
      name: 'taxRate',
      type: 'number',
      label: 'Tax Rate (%)',
      defaultValue: 0,
      min: 0,
      max: 100,
      admin: {
        description: 'Default tax rate as a percentage (e.g., 10 for 10%)',
        step: 0.1,
      },
    },

    {
      name: 'minOrderAmount',
      type: 'number',
      label: 'Minimum Order Amount',
      defaultValue: 5,
      min: 0,
      admin: {
        description: 'Minimum amount required to place an order',
        step: 0.1,
      },
    },
    // Service Options
    {
      name: 'serviceOptions',
      type: 'group',
      label: 'Service Options',
      fields: [
        // Delivery Service Section
        {
          name: 'enableDelivery',
          type: 'checkbox',
          label: 'Enable Delivery Service',
          defaultValue: true,
          admin: {
            description: 'Allow customers to choose delivery service',
          },
        },
        {
          name: 'deliveryMessage',
          type: 'text',
          label: 'Delivery Service Message',
          defaultValue: 'We deliver to your doorstep',
          admin: {
            condition: (data) => Boolean(data?.serviceOptions?.enableDelivery),
            description: 'Message shown to customers about delivery service',
            placeholder: 'Free delivery on orders over $50',
          },
        },
        {
          name: 'estimatedDeliveryTime',
          type: 'text',
          label: 'Estimated Delivery Time',
          defaultValue: '45-60 minutes',
          admin: {
            condition: (data) => Boolean(data?.serviceOptions?.enableDelivery),
            description: 'Estimated delivery time shown to customers',
            placeholder: '30-45 minutes',
          },
        },
        {
          name: 'deliveryFee',
          type: 'number',
          label: 'Default Delivery Fee',
          defaultValue: 1.00,
          min: 0,
          admin: {
            condition: (data) => Boolean(data?.serviceOptions?.enableDelivery),
            description: 'Default delivery fee for orders',
            step: 0.1,
          },
        },
        {
          name: 'freeDeliveryThreshold',
          type: 'number',
          label: 'Free Delivery Threshold',
          defaultValue: 50,
          min: 0,
          admin: {
            condition: (data) => Boolean(data?.serviceOptions?.enableDelivery),
            description: 'Minimum order amount for free delivery (0 to disable free delivery)',
            step: 0.1,
          },
        },
        
        // Pickup Service Section
        {
          name: 'enablePickup',
          type: 'checkbox',
          label: 'Enable Pickup Service',
          defaultValue: true,
          admin: {
            description: 'Allow customers to choose pickup/takeaway service',
          },
        },
        {
          name: 'pickupMessage',
          type: 'text',
          label: 'Pickup Service Message',
          defaultValue: 'Ready for pickup in 30 minutes',
          admin: {
            condition: (data) => Boolean(data?.serviceOptions?.enablePickup),
            description: 'Message shown to customers about pickup service',
            placeholder: 'Order ready in 30 minutes',
          },
        },
        {
          name: 'pickupAddress',
          type: 'textarea',
          label: 'Pickup Address',
          admin: {
            condition: (data) => Boolean(data?.serviceOptions?.enablePickup),
            description: 'Address where customers can pickup their orders. If left empty, the store address from Contact Information will be used.',
            placeholder: 'Store address for pickup (optional - defaults to store address)',
          },
        },
        {
          name: 'estimatedPickupTime',
          type: 'text',
          label: 'Estimated Pickup Time',
          defaultValue: '30 minutes',
          admin: {
            condition: (data) => Boolean(data?.serviceOptions?.enablePickup),
            description: 'Estimated pickup time shown to customers',
            placeholder: '15-30 minutes',
          },
        },
      ],
      admin: {
        description: 'Configure delivery and pickup service options',
      },
    },
    {
      name: 'storeTimezone',
      type: 'select',
      label: 'Store Timezone',
      required: true,
      defaultValue: 'Asia/Muscat',
      options: [
        { label: 'Asia/Muscat (Gulf Standard Time)', value: 'Asia/Muscat' },
        { label: 'Asia/Dubai (Gulf Standard Time)', value: 'Asia/Dubai' },
        { label: 'Asia/Kolkata (India Standard Time)', value: 'Asia/Kolkata' },
        { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
        { label: 'America/New_York (Eastern Time)', value: 'America/New_York' },
        { label: 'America/Los_Angeles (Pacific Time)', value: 'America/Los_Angeles' },
        { label: 'Australia/Sydney (Australian Eastern Time)', value: 'Australia/Sydney' },
      ],
      admin: {
        description: 'Timezone for order timestamps and delivery scheduling',
      },
    },
    {
      name: 'contactInfo',
      type: 'group',
      label: 'Contact Information',
      fields: [
        {
          name: 'phone',
          type: 'text',
          label: 'Store Phone Number',
          admin: {
            placeholder: '+968 1234 5678',
          },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Store Email',
          admin: {
            placeholder: 'contact@flavorforge.com',
          },
        },
        {
          name: 'address',
          type: 'textarea',
          label: 'Store Address',
          admin: {
            placeholder: 'Store address for customer contact',
          },
        },
        {
          name: 'googleMapsLink',
          type: 'text',
          label: 'Google Maps Link',
          admin: {
            placeholder: 'https://maps.google.com/maps?q=Your+Store+Address',
            description: 'Link to your store location on Google Maps. Customers can click this to get directions.',
          },
        },
      ],
      admin: {
        description: 'Contact information displayed to customers',
      },
    },
    {
      name: 'operatingHours',
      type: 'group',
      label: 'Operating Hours',
      fields: [
        {
          name: 'openTime',
          type: 'text',
          label: 'Opening Time',
          defaultValue: '09:00',
          admin: {
            placeholder: '09:00',
            description: 'Store opening time (24-hour format)',
          },
        },
        {
          name: 'closeTime',
          type: 'text',
          label: 'Closing Time',
          defaultValue: '22:00',
          admin: {
            placeholder: '22:00',
            description: 'Store closing time (24-hour format)',
          },
        },
        {
          name: 'closedDays',
          type: 'select',
          label: 'Closed Days',
          hasMany: true,
          options: [
            { label: 'Sunday', value: 'sunday' },
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
          ],
          admin: {
            description: 'Days when the store is closed',
          },
        },
      ],
    },
  ],
}
