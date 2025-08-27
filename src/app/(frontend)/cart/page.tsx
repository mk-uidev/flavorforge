'use client'

import React, { useState, useEffect } from 'react'
import { Minus, Plus, Trash2, ArrowLeft, MapPin, Truck, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartSimple } from '@/hooks/useCartSimple'
import { useStoreConfig } from '@/hooks/useStoreConfig'

import Link from 'next/link'

export default function CartPage() {
  const { items, removeItem, updateQuantity, fixMinimumQuantities, mounted } = useCartSimple()
  const { 
    config: storeConfig, 
    formatPrice, 
    calculateDeliveryFee, 
    calculateTax, 
    meetsMinimumOrder, 
    isDeliveryEnabled,
    isPickupEnabled,
    getAvailableServices,
    getServiceMessage,
    getEstimatedServiceTime,
    loading: configLoading 
  } = useStoreConfig()

  // Service selection state
  const availableServices = getAvailableServices()
  const [selectedService, setSelectedService] = useState<'delivery' | 'pickup'>(() => {
    // Default to the first available service, or pickup if delivery is disabled
    if (availableServices.length > 0) {
      return availableServices[0]
    }
    return isPickupEnabled() ? 'pickup' : 'delivery'
  })

  // Update selected service when available services change
  useEffect(() => {
    if (availableServices.length > 0 && !availableServices.includes(selectedService)) {
      setSelectedService(availableServices[0])
    }
  }, [availableServices, selectedService])

  // For cart items, price is already the final discounted price
  // We'll use this as subtotal for now and can enhance with discount data later
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  
  const deliveryFee = calculateDeliveryFee(subtotal, selectedService)
  const taxAmount = calculateTax(subtotal)
  const finalPrice = subtotal + deliveryFee + taxAmount

  // Check if all items meet minimum order quantities
  const itemsWithMinQtyIssues = items.filter(item => {
    const minQty = item.minOrderQuantity || 1
    return item.quantity < minQty
  })

  const hasMinQtyIssues = itemsWithMinQtyIssues.length > 0
  const canProceedToCheckout = meetsMinimumOrder(subtotal) && !hasMinQtyIssues

  if (!mounted || configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Back Button & Title */}
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold text-gray-800">{items.length} Items</h1>
              {items.length > 0 && (
                <Link href="/" className="ml-4 text-red-500 text-sm font-medium">
                  Add more items
                </Link>
              )}
            </div>

            {/* Delivery Location */}
            <div className="flex items-center text-gray-700">
              <MapPin className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-sm">Muscat, Oman</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Add some delicious items from our menu</p>
            <Link href="/">
              <Button className="bg-red-500 hover:bg-red-600 px-8 py-3 rounded-xl">
                Browse Menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Food Image */}
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-2xl">🍽️</span>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>

                      {/* Minimum Quantity Warning */}
                      {item.minOrderQuantity && item.quantity < item.minOrderQuantity && (
                        <div className="text-xs text-red-600 font-medium mt-1">
                          ⚠️ Minimum {item.minOrderQuantity} required
                        </div>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          const minQty = item.minOrderQuantity || 1
                          const newQty = Math.max(minQty, item.quantity - 1)
                          if (newQty === 0) {
                            updateQuantity(item.id, 0) // Allow removal
                          } else {
                            updateQuantity(item.id, newQty)
                          }
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-red-500 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        item.minOrderQuantity && item.quantity < item.minOrderQuantity
                          ? 'bg-red-200 text-red-800 border-2 border-red-400'
                          : 'bg-red-500 text-white'
                      }`}>
                        {item.quantity}
                      </div>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-red-500 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Service Selection - Only show if multiple services available */}
            {availableServices.length > 1 ? (
              <div className="mt-6">
                <h3 className="font-bold text-gray-800 mb-4">Service Option</h3>
                <div className="grid grid-cols-1 gap-3">
                  {availableServices.map((service) => (
                    <button
                      key={service}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedService === service
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {service === 'delivery' ? (
                            <Truck className="w-5 h-5 text-red-500" />
                          ) : (
                            <Package className="w-5 h-5 text-blue-500" />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 capitalize">
                              {service}
                            </div>
                            <div className="text-sm text-gray-600">
                              {getServiceMessage(service)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Est. {getEstimatedServiceTime(service)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {service === 'pickup' ? 'FREE' : 
                              deliveryFee === 0 ? 'FREE' : formatPrice(storeConfig.serviceOptions?.deliveryFee || 0)
                            }
                          </div>
                          {service === 'delivery' && storeConfig.serviceOptions?.freeDeliveryThreshold > 0 && deliveryFee > 0 && (
                            <div className="text-xs text-green-600">
                              Free over {formatPrice(storeConfig.serviceOptions.freeDeliveryThreshold)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : availableServices.length === 1 ? (
              <div className="mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {availableServices[0] === 'delivery' ? (
                      <Truck className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Package className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <div className="font-semibold text-blue-800 capitalize">
                        {availableServices[0]} Only
                      </div>
                      <div className="text-sm text-blue-600">
                        {getServiceMessage(availableServices[0])}
                      </div>
                      <div className="text-xs text-blue-500">
                        Est. {getEstimatedServiceTime(availableServices[0])}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* People Also Ordered Section */}
            <div className="mt-8">
              <h3 className="font-bold text-gray-800 mb-4">People also ordered</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🥗</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Mixed Salad</p>
                    <p className="text-gray-600 text-xs">{formatPrice(5.00)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🧃</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Fresh Juice</p>
                    <p className="text-gray-600 text-xs">{formatPrice(3.00)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-6 bg-white rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
              
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              {taxAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax ({storeConfig.taxRate}%)</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
              )}
              
              {/* Only show delivery/service fee if applicable */}
              {(selectedService === 'delivery' && isDeliveryEnabled()) || (selectedService === 'pickup' && deliveryFee > 0) ? (
                <div className="flex justify-between text-gray-600">
                  <span>{selectedService === 'delivery' ? 'Delivery Fee' : 'Service Fee'}</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>
              ) : null}
              
              {selectedService === 'delivery' && isDeliveryEnabled() && storeConfig.serviceOptions?.freeDeliveryThreshold > 0 && deliveryFee > 0 && (
                <div className="text-sm text-green-600">
                  Add {formatPrice(storeConfig.serviceOptions.freeDeliveryThreshold - subtotal)} more for free delivery
                </div>
              )}
              
              <hr className="my-3" />
              
              <div className="flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span>{formatPrice(finalPrice)}</span>
              </div>
            </div>

            {/* Minimum Quantity Issues Warning */}
            {hasMinQtyIssues && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-red-800">⚠️ Minimum Quantity Requirements</h4>
                  <Button 
                    onClick={fixMinimumQuantities}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 h-auto"
                  >
                    Fix All
                  </Button>
                </div>
                <div className="space-y-1">
                  {itemsWithMinQtyIssues.map(item => (
                    <p key={item.id} className="text-sm text-red-700">
                      • <strong>{item.name}</strong>: Add {(item.minOrderQuantity || 1) - item.quantity} more (minimum {item.minOrderQuantity} required)
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Checkout Button - Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:relative md:bottom-auto md:border-t-0 md:bg-transparent md:p-0 md:mt-6">
              <div className="max-w-6xl mx-auto">
                {canProceedToCheckout ? (
                  <Link href={`/checkout?service=${selectedService}`}>
                    <Button 
                      className="w-full bg-red-500 hover:bg-red-600 h-14 rounded-xl text-lg font-semibold"
                    >
                      Checkout · {formatPrice(finalPrice)}
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    className="w-full bg-gray-400 h-14 rounded-xl text-lg font-semibold cursor-not-allowed"
                    disabled
                  >
                    {!meetsMinimumOrder(subtotal) 
                      ? `Minimum order ${formatPrice(storeConfig.minOrderAmount)} required`
                      : hasMinQtyIssues
                      ? 'Complete minimum quantities to checkout'
                      : 'Cannot proceed to checkout'
                    }
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
