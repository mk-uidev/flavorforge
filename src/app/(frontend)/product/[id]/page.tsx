'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Heart, Star, Clock, Plus, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { getFoodItems, getFoodItemImageUrl, getFoodItemImageSizes, getPriceInfo, getEffectivePrice, getSavingsPercentage, type FoodItem } from '@/lib/api'
import { useCartSimple } from '@/hooks/useCartSimple'
import { useStoreConfig } from '@/hooks/useStoreConfig'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const customizationOptions = {
  burgers: [
    { id: 'brioche', name: 'Brioche', price: 0 },
    { id: 'gluten-free', name: 'Gluten free', price: 1.50 },
    { id: 'wholemeal', name: 'Wholemeal', price: 0 },
    { id: 'white-sesame', name: 'White sesame', price: 0 }
  ],
  rice: [
    { id: 'regular', name: 'Regular Portion', price: 0 },
    { id: 'large', name: 'Large Portion', price: 2.00 },
    { id: 'extra-spicy', name: 'Extra Spicy', price: 0.50 }
  ],
  curries: [
    { id: 'mild', name: 'Mild Spice', price: 0 },
    { id: 'medium', name: 'Medium Spice', price: 0 },
    { id: 'hot', name: 'Hot Spice', price: 0 },
    { id: 'extra-rice', name: 'Extra Rice', price: 1.50 }
  ]
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [item, setItem] = useState<FoodItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  
  const { addItem } = useCartSimple()
  const { config: storeConfig, formatPrice, loading: configLoading } = useStoreConfig()

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const items = await getFoodItems()
        const foundItem = items.find(i => i.id === params.id)
        if (foundItem) {
          setItem(foundItem)
          // Set initial quantity to minimum order quantity
          const minQty = foundItem.minOrderQuantity || 1
          setQuantity(minQty)
          // Set default option for each category
          const category = foundItem.category
          if (category && customizationOptions[category as keyof typeof customizationOptions]) {
            setSelectedOptions([customizationOptions[category as keyof typeof customizationOptions][0].id])
          }
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Failed to fetch item:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [params.id, router])

  const getCustomizationOptions = () => {
    if (!item?.category) return []
    return customizationOptions[item.category as keyof typeof customizationOptions] || []
  }

  const getOptionPrice = () => {
    const options = getCustomizationOptions()
    return selectedOptions.reduce((total, optionId) => {
      const option = options.find(opt => opt.id === optionId)
      return total + (option?.price || 0)
    }, 0)
  }

  const getTotalPrice = () => {
    if (!item) return 0
    const effectivePrice = getEffectivePrice(item)
    return effectivePrice + getOptionPrice()
  }

  const handleAddToCart = () => {
    if (!item) return
    
    const customizedItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: getTotalPrice(),
      category: (typeof item.category === 'object' ? item.category.name : item.category) as string,
      image: getFoodItemImageUrl(item),
      customization: selectedOptions,
      minOrderQuantity: item.minOrderQuantity || 1
    }
    
    addItem(customizedItem, quantity)
    
    router.push('/cart')
  }

  if (loading || configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-600">Item not found</p>
          <Link href="/">
            <Button className="mt-4 bg-red-500 hover:bg-red-600">
              Back to Menu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const options = getCustomizationOptions()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2"
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Product Image */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative h-64 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center overflow-hidden">
            {getFoodItemImageUrl(item) !== '/placeholder-food.svg' ? (
              <img 
                src={getFoodItemImageSizes(item).card} 
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-8xl">🍽️</span>
            )}
            
            {/* Offer Badge */}
            {(() => {
              const priceInfo = getPriceInfo(item)
              return priceInfo.hasDiscount && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-bold">
                  {getSavingsPercentage(item)}% OFF
                </div>
              )
            })()}
          </div>
        </Card>

        {/* Product Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-2">{item.name}</h1>
            <p className="text-muted-foreground mb-4">{item.description}</p>
            
            {/* Price Information */}
            <div className="mb-4">
              {(() => {
                const priceInfo = getPriceInfo(item)
                return (
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">
                      {formatPrice(priceInfo.displayPrice)}
                    </div>
                    {priceInfo.hasDiscount && (
                      <>
                        <div className="text-lg text-gray-500 line-through">
                          {formatPrice(priceInfo.originalPrice)}
                        </div>
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                          Save {formatPrice(priceInfo.savings)}
                        </Badge>
                      </>
                    )}
                  </div>
                )
              })()}
            </div>
            
            <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{item.preparationTime} min</span>
              </div>
              
              {/* Minimum Order Quantity */}
              {item.minOrderQuantity && item.minOrderQuantity > 1 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  📦 Min Order: {item.minOrderQuantity}
                </Badge>
              )}
              
              {/* Veg/NonVeg Badge */}
              {item.isVegetarian ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                  🌱 Vegetarian
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                  🍖 Non-Vegetarian
                </Badge>
              )}
              
              {/* Ratings */}
              {storeConfig.showRatings && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span>4.5 (120+ reviews)</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customization Options */}
        {options.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Choice of {item.category === 'rice' ? 'portion' : item.category === 'curries' ? 'spice level' : 'bun'}
              </h3>
              <p className="text-sm text-red-500 font-medium mb-4">Required</p>
              
              <RadioGroup 
                value={selectedOptions[0] || ''} 
                onValueChange={(value) => setSelectedOptions([value])}
                className="space-y-3"
              >
                {options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between p-4 border rounded-xl hover:border-red-500 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="font-medium cursor-pointer">
                        {option.name}
                      </Label>
                    </div>
                    <span className="text-muted-foreground">
                      {option.price > 0 ? `+${formatPrice(option.price)}` : formatPrice(0)}
                    </span>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Quantity & Add to Cart */}
        <Card className="mb-20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-semibold">Quantity</span>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const minQty = item?.minOrderQuantity || 1
                    setQuantity(Math.max(minQty, quantity - 1))
                  }}
                  disabled={quantity <= (item?.minOrderQuantity || 1)}
                  className="h-10 w-10 rounded-full"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Minimum Quantity Notice */}
            {item?.minOrderQuantity && item.minOrderQuantity > 1 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  📦 <strong>Minimum order:</strong> {item.minOrderQuantity} {item.minOrderQuantity === 1 ? 'unit' : 'units'}
                </p>
              </div>
            )}

            <Button 
              onClick={handleAddToCart}
              className="w-full h-14 text-lg font-semibold bg-red-500 hover:bg-red-600"
              size="lg"
            >
              Add to Cart · {formatPrice(getTotalPrice() * quantity)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
