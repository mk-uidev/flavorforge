import { getPayload } from 'payload'
import configPromise from '@payload-config'

// Store configuration type
export interface StoreConfig {
  storeName: string
  currency: string
  currencySymbol: string
  currencyPosition: 'before' | 'after'
  showRatings: boolean
  allowReviews: boolean
  taxRate: number
  minOrderAmount: number
  storeTimezone: string
  serviceOptions: {
    enableDelivery: boolean
    enablePickup: boolean
    deliveryMessage: string
    pickupMessage: string
    pickupAddress: string
    estimatedDeliveryTime: string
    estimatedPickupTime: string
    deliveryFee: number
    freeDeliveryThreshold: number
  }
  contactInfo: {
    phone: string
    email: string
    address: string
    googleMapsLink: string
  }
  operatingHours: {
    openTime: string
    closeTime: string
    closedDays: string[]
  }
}

// Default store configuration
const defaultConfig = {
  storeName: 'FlavorForge',
  currency: 'USD',
  currencySymbol: '$',
  currencyPosition: 'before' as 'before' | 'after',
  showRatings: true,
  allowReviews: true,
  taxRate: 0,
  minOrderAmount: 5,
  storeTimezone: 'Asia/Muscat',
  serviceOptions: {
    enableDelivery: true,
    enablePickup: true,
    deliveryMessage: 'We deliver to your doorstep',
    pickupMessage: 'Ready for pickup in 30 minutes',
    pickupAddress: '',
    estimatedDeliveryTime: '45-60 minutes',
    estimatedPickupTime: '30 minutes',
    deliveryFee: 1.00,
    freeDeliveryThreshold: 50,
  },
  contactInfo: {
    phone: '',
    email: '',
    address: '',
    googleMapsLink: '',
  },
  operatingHours: {
    openTime: '09:00',
    closeTime: '22:00',
    closedDays: [],
  },
}

// Cache for store config to avoid repeated database calls
let configCache: StoreConfig | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get store configuration from the database
 * Returns cached config if available and recent, otherwise fetches from database
 */
export async function getStoreConfig() {
  const now = Date.now()
  
  // Return cached config if it's still fresh
  if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return configCache
  }

  try {
    const payload = await getPayload({ config: configPromise })
    
    const config = await payload.findGlobal({
      slug: 'store-config',
    })

    if (config) {
      // Cast to any to handle Payload's nullable types, then merge with defaults
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      configCache = { ...defaultConfig, ...(config as any) }
    } else {
      // No config found, use defaults
      configCache = defaultConfig
    }
    
    cacheTimestamp = now
    return configCache
  } catch (error) {
    console.error('Error fetching store config:', error)
    return defaultConfig
  }
}

/**
 * Format price according to store configuration
 */
export function formatPrice(amount: number, config?: StoreConfig): string {
  const storeConfig = config || defaultConfig
  const { currencySymbol, currencyPosition } = storeConfig
  
  const formattedAmount = amount.toFixed(2)
  
  if (currencyPosition === 'after') {
    return `${formattedAmount}${currencySymbol}`
  } else {
    return `${currencySymbol}${formattedAmount}`
  }
}

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    OMR: 'ر.ع.',
    AED: 'د.إ',
    SAR: '﷼',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
  }
  
  return symbols[currencyCode] || '$'
}

/**
 * Clear the config cache (useful after config updates)
 */
export function clearConfigCache() {
  configCache = null
  cacheTimestamp = 0
}

/**
 * Check if store is currently open based on operating hours
 */
export function isStoreOpen(config?: StoreConfig): boolean {
  const storeConfig = config || defaultConfig
  const { operatingHours } = storeConfig
  
  if (!operatingHours) return true
  
  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
  
  // Check if store is closed today
  if (operatingHours.closedDays?.includes(currentDay)) {
    return false
  }
  
  // Check if current time is within operating hours
  const { openTime = '00:00', closeTime = '23:59' } = operatingHours
  
  return currentTime >= openTime && currentTime <= closeTime
}

/**
 * Calculate delivery fee based on order amount, service type, and store configuration
 */
export function calculateDeliveryFee(orderAmount: number, serviceType: 'delivery' | 'pickup' = 'delivery', config?: StoreConfig): number {
  const storeConfig = config || defaultConfig
  const { serviceOptions } = storeConfig
  const { deliveryFee = 0, freeDeliveryThreshold = 0 } = serviceOptions || {}
  
  // No delivery fee for pickup orders or if delivery is disabled
  if (serviceType === 'pickup' || !isDeliveryEnabled(storeConfig)) {
    return 0
  }
  
  // Free delivery if order amount meets threshold
  if (freeDeliveryThreshold > 0 && orderAmount >= freeDeliveryThreshold) {
    return 0
  }
  
  return deliveryFee
}

/**
 * Calculate tax amount based on store configuration
 */
export function calculateTax(amount: number, config?: StoreConfig): number {
  const storeConfig = config || defaultConfig
  const { taxRate = 0 } = storeConfig
  
  return (amount * taxRate) / 100
}

/**
 * Check if delivery service is enabled
 */
export function isDeliveryEnabled(config?: StoreConfig): boolean {
  const storeConfig = config || defaultConfig
  return storeConfig.serviceOptions?.enableDelivery ?? true
}

/**
 * Check if pickup service is enabled
 */
export function isPickupEnabled(config?: StoreConfig): boolean {
  const storeConfig = config || defaultConfig
  return storeConfig.serviceOptions?.enablePickup ?? true
}

/**
 * Get available service options
 */
export function getAvailableServices(config?: StoreConfig): ('delivery' | 'pickup')[] {
  const storeConfig = config || defaultConfig
  const services: ('delivery' | 'pickup')[] = []
  
  if (isDeliveryEnabled(storeConfig)) {
    services.push('delivery')
  }
  
  if (isPickupEnabled(storeConfig)) {
    services.push('pickup')
  }
  
  return services
}

/**
 * Get service message for display
 */
export function getServiceMessage(serviceType: 'delivery' | 'pickup', config?: StoreConfig): string {
  const storeConfig = config || defaultConfig
  const { serviceOptions } = storeConfig
  
  if (serviceType === 'delivery') {
    return serviceOptions?.deliveryMessage || 'We deliver to your doorstep'
  } else {
    return serviceOptions?.pickupMessage || 'Ready for pickup in 30 minutes'
  }
}

/**
 * Get estimated service time
 */
export function getEstimatedServiceTime(serviceType: 'delivery' | 'pickup', config?: StoreConfig): string {
  const storeConfig = config || defaultConfig
  const { serviceOptions } = storeConfig
  
  if (serviceType === 'delivery') {
    return serviceOptions?.estimatedDeliveryTime || '45-60 minutes'
  } else {
    return serviceOptions?.estimatedPickupTime || '30 minutes'
  }
}

/**
 * Get pickup address with fallback to store address
 */
export function getPickupAddress(config?: StoreConfig): string {
  const storeConfig = config || defaultConfig
  const { serviceOptions, contactInfo } = storeConfig
  
  return serviceOptions?.pickupAddress || contactInfo?.address || 'Please contact store for pickup address'
}

/**
 * Get Google Maps link for store location
 */
export function getGoogleMapsLink(config?: StoreConfig): string {
  const storeConfig = config || defaultConfig
  const { contactInfo } = storeConfig
  
  return contactInfo?.googleMapsLink || ''
}
