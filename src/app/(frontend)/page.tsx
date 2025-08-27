'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Search, ShoppingCart, Star, Loader2, Heart, Plus, LogOut, Settings, History, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getFoodItems, getCategories, getFoodItemImageUrl, getPriceInfo, getEffectivePrice, getSavingsPercentage, type FoodItem, type Category } from '@/lib/api'
import { useCartSimple } from '@/hooks/useCartSimple'
import { useStoreConfig } from '@/hooks/useStoreConfig'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

// Default category icons mapping for fallback
const categoryIcons: Record<string, string> = {
  'rice-dishes': '🍚',
  'curries': '🍛', 
  'noodles': '🍜',
  'appetizers': '🥟',
  'desserts': '🍰',
  'beverages': '🥤',
  'snacks': '🥟',
  'soups': '🍲',
  'salads': '🥗',
  'mains': '🍽️',
  'specials': '⭐'
}

// Helper function to get category icon (uploaded or fallback)
const getCategoryIcon = (category: Category): { type: 'image' | 'emoji', src: string } => {
  // Check if category has uploaded icon
  if (category.icon && typeof category.icon === 'object') {
    const iconUrl = category.icon.sizes?.icon?.url || category.icon.url
    if (iconUrl) {
      return { type: 'image', src: iconUrl }
    }
  }
  
  // Fallback to emoji icon
  const emojiIcon = categoryIcons[category.slug] || '🍽️'
  return { type: 'emoji', src: emojiIcon }
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])

  const { addItem, getTotalItems } = useCartSimple()
  const { config: storeConfig, formatPrice, loading: configLoading } = useStoreConfig()
  const { customer, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [items, cats] = await Promise.all([
          getFoodItems(),
          getCategories()
        ])
        setFoodItems(items)
        setCategories(cats)
        console.log('📂 Loaded categories:', cats.map(c => c.name))
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredItems = useMemo(() => {
    let filtered = foodItems

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        // Handle both populated category objects and category IDs
        if (typeof item.category === 'object' && item.category?.id) {
          return item.category.id === selectedCategory
        } else if (typeof item.category === 'string') {
          return item.category === selectedCategory
        }
        return false
      })
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [foodItems, selectedCategory, searchQuery])

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleAddToCart = (item: FoodItem) => {
    const categoryName = typeof item.category === 'object' ? item.category.name : item.category
    const effectivePrice = getEffectivePrice(item)
    const minQuantity = item.minOrderQuantity || 1
    
    const cartItem = {
      id: item.id,
      name: item.name,
      price: effectivePrice, // Use effective (discounted) price for cart
      category: categoryName,
      image: getFoodItemImageUrl(item),
      minOrderQuantity: minQuantity
    }
    
    console.log('🛒 Adding to cart:', { 
      id: item.id, 
      name: item.name, 
      price: effectivePrice, 
      minQuantity: minQuantity,
      image: cartItem.image 
    })
    
    // Add minimum required quantity to cart
    addItem(cartItem, minQuantity)
  }

  if (loading || configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Logo className="h-8 md:h-12 w-auto" />
              </Link>
            </div>

            {/* User & Cart */}
            <div className="flex items-center space-x-3">
              {/* User Avatar Dropdown */}
              {isAuthenticated && customer ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.firstName} ${customer.lastName}`} alt={customer.firstName} />
                        <AvatarFallback className="bg-green-100 text-green-700 font-medium">
                          {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="absolute -bottom-1 -right-1 h-3 w-3 bg-white rounded-full border shadow-sm" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{customer.firstName} {customer.lastName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {customer.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/order-history" className="flex items-center">
                        <History className="mr-2 h-4 w-4" />
                        <span>Order History</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-sm text-gray-600 hover:text-gray-900 hover:bg-transparent">
                    Login
                  </Button>
                </Link>
              )}

              {/* Cart */}
              <Link href="/cart" className="relative">
                <div className="bg-red-500 p-2 md:p-3 rounded-lg">
                  <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 md:h-6 md:w-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {getTotalItems()}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for a cuisine or dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-xl border-gray-200 text-lg"
          />
        </div>

        {/* Categories */}
        <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
          {/* All Categories Button */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex flex-col items-center min-w-[80px] p-3 rounded-xl transition-all ${
              selectedCategory === 'all'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl mb-1">🍽️</span>
            <span className="text-sm font-medium">All</span>
          </button>
          
          {/* Dynamic Categories */}
          {categories.map((category) => {
            const categoryIcon = getCategoryIcon(category)
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex flex-col items-center min-w-[80px] p-3 rounded-xl transition-all ${
                  selectedCategory === category.id
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="w-8 h-8 mb-1 flex items-center justify-center">
                  {categoryIcon.type === 'image' ? (
                    <img
                      src={categoryIcon.src}
                      alt={category.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        const target = e.target as HTMLImageElement
                        const fallbackIcon = categoryIcons[category.slug] || '🍽️'
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<span class="text-2xl">${fallbackIcon}</span>`
                      }}
                    />
                  ) : (
                    <span className="text-2xl">{categoryIcon.src}</span>
                  )}
                </div>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            )
          })}
        </div>



        {/* Your Favourites */}
        {favorites.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your favourites</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems
                .filter(item => favorites.includes(item.id))
                .slice(0, 3)
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all group">
                    <div className="relative">
                      <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                        <span className="text-6xl">🍽️</span>
                      </div>
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md"
                      >
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                      </button>
                      {item.preparationTime && (
                        <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {item.preparationTime} min
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all group py-0">
                <Link href={`/product/${item.id}`}>
                  <div className="relative cursor-pointer">
                                          {/* Food Image */}
                      <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center overflow-hidden">
                        {getFoodItemImageUrl(item) !== '/placeholder-food.svg' ? (
                          <img 
                            src={getFoodItemImageUrl(item)} 
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-6xl">🍽️</span>
                      )}
                    </div>
                  
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleFavorite(item.id)
                    }}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform z-10"
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(item.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                  </button>

                    {/* Preparation Time */}
                    {item.preparationTime && (
                      <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {item.preparationTime} min
                      </div>
                    )}
                    
                    {/* Offer Badge */}
                    {(() => {
                      const priceInfo = getPriceInfo(item)
                      return priceInfo.hasDiscount && (
                        <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          {getSavingsPercentage(item)}% OFF
                        </div>
                      )
                    })()}
                  </div>
                </Link>

                <CardContent className="p-4">
                  <Link href={`/product/${item.id}`}>
                    <div className="mb-3 cursor-pointer">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 hover:text-red-600 transition-colors">{item.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      {(() => {
                        const priceInfo = getPriceInfo(item)
                        return (
                          <div className="flex items-center gap-2">
                            <div className="text-xl font-bold text-red-500">
                              {formatPrice(priceInfo.displayPrice)}
                            </div>
                            {priceInfo.hasDiscount && (
                              <>
                                <div className="text-sm text-gray-500 line-through">
                                  {formatPrice(priceInfo.originalPrice)}
                                </div>
                                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
                                  {getSavingsPercentage(item)}% OFF
                                </Badge>
                              </>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Minimum Order Quantity */}
                      {item.minOrderQuantity && item.minOrderQuantity > 1 && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                          📦 Min {item.minOrderQuantity}
                        </Badge>
                      )}
                      
                      {/* Veg/NonVeg Badge */}
                      {item.isVegetarian ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                          🌱 Veg
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">
                          🍖 Non-Veg
                        </Badge>
                      )}
                      
                      {/* Ratings */}
                      {storeConfig.showRatings && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span>4.5</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleAddToCart(item)
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4 text-6xl">🔍</div>
              <p className="text-gray-600 text-lg font-medium">No items found</p>
              <p className="text-gray-400">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}