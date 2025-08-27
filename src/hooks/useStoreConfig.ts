'use client'

import { useState, useEffect } from 'react'

interface StoreConfig {
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
    phone?: string
    email?: string
    address?: string
    googleMapsLink?: string
  }
  operatingHours: {
    openTime: string
    closeTime: string
    closedDays: string[]
  }
}

const defaultConfig: StoreConfig = {
  storeName: 'FlavorForge',
  currency: 'USD',
  currencySymbol: '$',
  currencyPosition: 'before',
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

export function useStoreConfig() {
  const [config, setConfig] = useState<StoreConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/store-config', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch store configuration')
        }

        const data = await response.json()

        if (mounted && data.success) {
          setConfig({ ...defaultConfig, ...data.config })
          setError(null)
        }
      } catch (err) {
        console.error('Error fetching store config:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          // Keep default config on error
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchConfig()

    return () => {
      mounted = false
    }
  }, [])

  /**
   * Format price according to store configuration
   */
  const formatPrice = (amount: number): string => {
    const formattedAmount = amount.toFixed(2)
    
    if (config.currencyPosition === 'after') {
      return `${formattedAmount}${config.currencySymbol}`
    } else {
      return `${config.currencySymbol}${formattedAmount}`
    }
  }

  /**
   * Check if store is currently open
   */
  const isStoreOpen = (): boolean => {
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    
    // Check if store is closed today
    if (config.operatingHours.closedDays?.includes(currentDay)) {
      return false
    }
    
    // Check if current time is within operating hours
    const { openTime, closeTime } = config.operatingHours
    
    return currentTime >= openTime && currentTime <= closeTime
  }

  /**
   * Calculate delivery fee based on order amount and service type
   */
  const calculateDeliveryFee = (orderAmount: number, serviceType: 'delivery' | 'pickup' = 'delivery'): number => {
    // No delivery fee for pickup orders or if delivery is disabled
    if (serviceType === 'pickup' || !isDeliveryEnabled()) {
      return 0
    }
    
    // Free delivery if order amount meets threshold
    if (config.serviceOptions.freeDeliveryThreshold > 0 && orderAmount >= config.serviceOptions.freeDeliveryThreshold) {
      return 0
    }
    
    return config.serviceOptions.deliveryFee
  }

  /**
   * Calculate tax amount
   */
  const calculateTax = (amount: number): number => {
    return (amount * config.taxRate) / 100
  }

  /**
   * Check if order meets minimum amount requirement
   */
  const meetsMinimumOrder = (amount: number): boolean => {
    return amount >= config.minOrderAmount
  }

  /**
   * Check if delivery service is enabled
   */
  const isDeliveryEnabled = (): boolean => {
    return config.serviceOptions?.enableDelivery ?? true
  }

  /**
   * Check if pickup service is enabled
   */
  const isPickupEnabled = (): boolean => {
    return config.serviceOptions?.enablePickup ?? true
  }

  /**
   * Get available service options
   */
  const getAvailableServices = (): ('delivery' | 'pickup')[] => {
    const services: ('delivery' | 'pickup')[] = []
    
    if (isDeliveryEnabled()) {
      services.push('delivery')
    }
    
    if (isPickupEnabled()) {
      services.push('pickup')
    }
    
    return services
  }

  /**
   * Get service message for display
   */
  const getServiceMessage = (serviceType: 'delivery' | 'pickup'): string => {
    if (serviceType === 'delivery') {
      return config.serviceOptions?.deliveryMessage || 'We deliver to your doorstep'
    } else {
      return config.serviceOptions?.pickupMessage || 'Ready for pickup in 30 minutes'
    }
  }

  /**
   * Get estimated service time
   */
  const getEstimatedServiceTime = (serviceType: 'delivery' | 'pickup'): string => {
    if (serviceType === 'delivery') {
      return config.serviceOptions?.estimatedDeliveryTime || '45-60 minutes'
    } else {
      return config.serviceOptions?.estimatedPickupTime || '30 minutes'
    }
  }

  /**
   * Get pickup address with fallback to store address
   */
  const getPickupAddress = (): string => {
    return config.serviceOptions?.pickupAddress || config.contactInfo?.address || 'Please contact store for pickup address'
  }

  /**
   * Get Google Maps link for store location
   */
  const getGoogleMapsLink = (): string => {
    return config.contactInfo?.googleMapsLink || ''
  }

  return {
    config,
    loading,
    error,
    formatPrice,
    isStoreOpen,
    calculateDeliveryFee,
    calculateTax,
    meetsMinimumOrder,
    isDeliveryEnabled,
    isPickupEnabled,
    getAvailableServices,
    getServiceMessage,
    getEstimatedServiceTime,
    getPickupAddress,
    getGoogleMapsLink,
  }
}
