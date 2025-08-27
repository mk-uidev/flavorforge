import { createNoCacheFetch } from './cache'

export interface MediaFile {
  id: string
  filename: string
  alt?: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
  url: string
  sizes?: {
    thumbnail?: {
      url: string
      width: number
      height: number
    }
    icon?: {
      url: string
      width: number
      height: number
    }
    'icon-large'?: {
      url: string
      width: number
      height: number
    }
  }
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: MediaFile | string // Can be populated MediaFile object or just ID
  imageUrl?: string
  sortOrder: number
  isActive: boolean
  itemCount: number
}

export interface FoodItem {
  id: string
  name: string
  description: string
  category: Category | string // Can be populated object or just ID
  price: number
  minOrderQuantity: number
  preparationTime: number
  isVegetarian: boolean
  isSpicy: string
  ingredients: string
  allergens?: string
  servingSize: string
  isAvailable: boolean
  image?: MediaFile | string // Can be populated MediaFile object or just ID
  imageUrl?: string
  // Offer/Discount fields
  isOnOffer?: boolean
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
  offerStartDate?: string
  offerEndDate?: string
}

export async function getCategories(): Promise<Category[]> {
  try {
    const response = await createNoCacheFetch('/api/categories?where[isActive][equals]=true&sort=sortOrder&depth=1&limit=100')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('📂 Fetched categories:', data.docs?.length || 0, 'categories')
    console.log('🎨 Categories with icons:', data.docs?.filter((cat: Category) => cat.icon)?.length || 0)
    return data.docs || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function getFoodItems(): Promise<FoodItem[]> {
  try {
    const response = await createNoCacheFetch('/api/products?depth=2&limit=100')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch food items: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('🍽️ Fetched food items:', data.docs?.length || 0, 'items')
    console.log('🔍 Sample item:', data.docs?.[0] ? { id: data.docs[0].id, name: data.docs[0].name } : 'No items')
    return data.docs || []
  } catch (error) {
    console.error('Error fetching food items:', error)
    return []
  }
}

export async function getFoodItemsByCategory(category: string): Promise<FoodItem[]> {
  try {
    const response = await createNoCacheFetch(
      `/api/products?where[isAvailable][equals]=true&where[category][equals]=${category}&limit=100`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch food items')
    }
    
    const data = await response.json()
    return data.docs || []
  } catch (error) {
    console.error('Error fetching food items by category:', error)
    return []
  }
}

// Helper function to get the appropriate image URL for a food item
export function getFoodItemImageUrl(item: FoodItem): string {
  // Priority: uploaded image -> fallback imageUrl -> placeholder
  if (item.image && typeof item.image === 'object' && item.image.url) {
    return item.image.url
  }
  
  if (item.imageUrl) {
    return item.imageUrl
  }
  
  return '/placeholder-food.svg'
}

// Helper function to get different image sizes for a food item
export function getFoodItemImageSizes(item: FoodItem) {
  const baseUrl = getFoodItemImageUrl(item)
  
  // If we have an uploaded image with sizes, use those
  if (item.image && typeof item.image === 'object' && item.image.sizes) {
    return {
      thumbnail: item.image.sizes.thumbnail?.url || baseUrl,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      card: (item.image.sizes as any).card?.url || baseUrl,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tablet: (item.image.sizes as any).tablet?.url || baseUrl,
      full: baseUrl
    }
  }
  
  // For fallback URLs or placeholders, return the same URL for all sizes
  return {
    thumbnail: baseUrl,
    card: baseUrl,
    tablet: baseUrl,
    full: baseUrl
  }
}

// Helper function to check if an offer is currently active
export function isOfferActive(item: FoodItem): boolean {
  if (!item.isOnOffer || !item.discountValue || item.discountValue <= 0) {
    return false
  }
  
  const now = new Date()
  
  // Check start date
  if (item.offerStartDate) {
    const startDate = new Date(item.offerStartDate)
    if (now < startDate) {
      return false
    }
  }
  
  // Check end date
  if (item.offerEndDate) {
    const endDate = new Date(item.offerEndDate)
    if (now > endDate) {
      return false
    }
  }
  
  return true
}

// Helper function to calculate the effective (discounted) price
export function getEffectivePrice(item: FoodItem): number {
  if (!isOfferActive(item)) {
    return item.price
  }
  
  const { discountType, discountValue } = item
  
  if (discountType === 'percentage' && discountValue) {
    const discountAmount = (item.price * discountValue) / 100
    return Math.max(0, item.price - discountAmount)
  }
  
  if (discountType === 'fixed' && discountValue) {
    return Math.max(0, item.price - discountValue)
  }
  
  return item.price
}

// Helper function to calculate savings amount
export function getSavingsAmount(item: FoodItem): number {
  if (!isOfferActive(item)) {
    return 0
  }
  
  return item.price - getEffectivePrice(item)
}

// Helper function to calculate savings percentage
export function getSavingsPercentage(item: FoodItem): number {
  if (!isOfferActive(item)) {
    return 0
  }
  
  const savings = getSavingsAmount(item)
  return Math.round((savings / item.price) * 100)
}

// Helper function to get comprehensive pricing information
export function getPriceInfo(item: FoodItem) {
  const isOnSale = isOfferActive(item)
  const originalPrice = item.price
  const effectivePrice = getEffectivePrice(item)
  const savings = getSavingsAmount(item)
  const savingsPercentage = getSavingsPercentage(item)
  
  return {
    isOnSale,
    originalPrice,
    effectivePrice,
    savings,
    savingsPercentage,
    displayPrice: effectivePrice, // The price to show prominently
    hasDiscount: isOnSale && savings > 0
  }
}
