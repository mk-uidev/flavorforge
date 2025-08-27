'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock, MapPin, Phone, Package, Truck, LoaderCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useStoreConfig } from '@/hooks/useStoreConfig'
import { useAuth } from '@/contexts/AuthContext'
import { Media } from '@/payload-types'

interface OrderItem {
  foodItem: {
    id: string
    name: string
    price: number
    image?: (string | null) | Media
  }
  quantity: number
  price: number
  subtotal: number
}

interface Order {
  id: string
  orderNumber: string
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  items: OrderItem[]
  totalAmount: number
  status: string
  serviceType: 'delivery' | 'pickup'
  bookingDate: string
  customerNotes?: string
  deliveryAddress?: {
    street: string
    area: string
    city: string
    postalCode?: string
    phone: string
  }
  createdAt: string
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')
  const authToken = searchParams.get('authToken')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loginStatus, setLoginStatus] = useState<'idle' | 'logging-in' | 'success' | 'failed'>('idle')
  const { formatPrice, calculateDeliveryFee, calculateTax, config, isDeliveryEnabled } = useStoreConfig()
  const { isAuthenticated } = useAuth()

  // Get status color based on order status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ready-for-pickup':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'out-for-delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Format status text for display
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'confirmed':
        return 'Confirmed'
      case 'preparing':
        return 'Preparing'
      case 'ready-for-pickup':
        return 'Ready for Pickup'
      case 'out-for-delivery':
        return 'Out for Delivery'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setError('No order number provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/orders?orderNumber=${orderNumber}`)
        const result = await response.json()

        if (result.success) {
          setOrder(result.order)
        } else {
          setError(result.error || 'Failed to fetch order details')
        }
      } catch (err) {
        setError('Failed to load order details')
        console.error('Order fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber])

  // Auto-login effect - automatically log in user after order placement
  useEffect(() => {
    const performAutoLogin = async () => {
      // Only auto-login if:
      // 1. We have an auth token from checkout
      // 2. User is not already authenticated
      // 3. We haven't attempted login yet
      // 4. Order is loaded
      if (authToken && !isAuthenticated && loginStatus === 'idle' && order) {
        setLoginStatus('logging-in')
        
        try {
          // Create customer data from the order information
          const customerData = {
            id: order.customer.id || '', // Use customer ID from order
            email: order.customer.email,
            firstName: order.customer.firstName,
            lastName: order.customer.lastName,
            phone: order.customer.phone,
            defaultAddress: null
          }
          
          // Store the auth token and customer data
          localStorage.setItem('auth_token', authToken)
          localStorage.setItem('customer_data', JSON.stringify(customerData))
          
          // Trigger a page refresh to update auth context
          // Note: This is a simple approach - alternatively we could update the auth context directly
          setLoginStatus('success')
          
          // Update the URL to remove the auth token for security
          const url = new URL(window.location.href)
          url.searchParams.delete('authToken')
          window.history.replaceState({}, '', url.toString())
          
          console.log('✅ Customer automatically logged in after order placement')
          
        } catch (error) {
          console.error('Auto-login failed:', error)
          setLoginStatus('failed')
        }
      }
    }

    // Wait for order to be loaded before attempting auto-login
    if (order && !loading) {
      performAutoLogin()
    }
  }, [authToken, isAuthenticated, loginStatus, order, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Phone className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'We could not find the order details.'}</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isDelivery = order.serviceType === 'delivery'
  const bookingDate = new Date(order.bookingDate)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <h1 className="text-xl font-semibold">Order Confirmation</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">Order Placed Successfully!</h1>
          
          {/* Order Status Badge */}
          <div className="flex justify-center mb-4">
            <Badge 
              variant="outline" 
              className={`px-4 py-2 text-sm font-medium border ${getStatusColor(order.status)}`}
            >
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          
          <p className="text-lg text-gray-600 mb-2">
            Thank you, {order.customer.firstName}! We&#39;ve received your order and will start preparing your delicious meal.
          </p>
          <p className="text-gray-500 mb-1">
            Order Number: <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
          </p>
          <p className="text-gray-500">
            {isDelivery ? (
              <><Truck className="w-4 h-4 inline mr-1" />Delivery</>
            ) : (
              <><Package className="w-4 h-4 inline mr-1" />Pickup</>
            )} • {bookingDate.toLocaleDateString()} at {bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          
          {/* Auto-login status indicator */}
          {authToken && loginStatus === 'logging-in' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center">
                <LoaderCircle className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">Setting up your account...</span>
              </div>
            </div>
          )}
          
          {authToken && loginStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800">✅ You&#39;re now logged in! Track your order anytime.</span>
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Items List - Match Cart Format */}
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start py-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.foodItem.name}</p>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>Qty: {item.quantity}</span>
                      <span className="mx-2">×</span>
                      <span>{formatPrice(item.price)}</span>
                      {/* Show original price if different (discount applied) */}
                      {item.foodItem.price && item.price < item.foodItem.price && (
                        <span className="ml-2 line-through text-gray-400">
                          {formatPrice(item.foodItem.price)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPrice(item.subtotal)}</p>
                    {/* Show savings if applicable */}
                    {item.foodItem.price && item.price < item.foodItem.price && (
                      <p className="text-xs text-green-600 mt-1">
                        Save {formatPrice((item.foodItem.price - item.price) * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              <hr className="my-4" />
              
              {/* Pricing Breakdown Section */}
              <h4 className="font-semibold text-gray-800 mb-3">Pricing Breakdown</h4>
              
              {/* Order Summary - Match Cart Format Exactly */}
              <div className="space-y-3">
                {(() => {
                  // Calculate original subtotal (before discounts)
                  const originalSubtotal = order.items.reduce((sum, item) => {
                    const originalPrice = item.foodItem.price || item.price; // Use food item price as original
                    return sum + (originalPrice * item.quantity);
                  }, 0);
                  
                  // Calculate total discount amount
                  const totalDiscount = order.items.reduce((sum, item) => {
                    const originalPrice = item.foodItem.price || item.price;
                    if (originalPrice > item.price) {
                      return sum + ((originalPrice - item.price) * item.quantity);
                    }
                    return sum;
                  }, 0);
                  
                  // Net subtotal after discounts
                  const subtotal = originalSubtotal - totalDiscount;
                  
                  const deliveryFee = isDelivery ? calculateDeliveryFee(subtotal, 'delivery') : 0;
                  const taxAmount = calculateTax(subtotal); // Tax on discounted subtotal
                  const finalPrice = subtotal + deliveryFee + taxAmount; // Total includes all fees
                  
                  return (
                    <>
                      {/* Subtotal (original prices) */}
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(originalSubtotal)}</span>
                      </div>
                      
                      {/* Discount as minus line item */}
                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-{formatPrice(totalDiscount)}</span>
                        </div>
                      )}
                      
                      {/* Tax (with percentage, like cart) */}
                      {taxAmount > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Tax ({config.taxRate}%)</span>
                          <span>{formatPrice(taxAmount)}</span>
                        </div>
                      )}
                      
                      {/* Service Fee - Only show if applicable (match cart logic) */}
                      {(isDelivery && isDeliveryEnabled()) || (!isDelivery && deliveryFee > 0) ? (
                        <div className="flex justify-between text-gray-600">
                          <span>{isDelivery ? 'Delivery Fee' : 'Service Fee'}</span>
                          <span>
                            {deliveryFee === 0 ? (
                              <span className="text-green-600 font-medium">FREE</span>
                            ) : (
                              formatPrice(deliveryFee)
                            )}
                          </span>
                        </div>
                      ) : null}
                      
                      {/* Free delivery message (if applicable) */}
                      {isDelivery && isDeliveryEnabled() && config.serviceOptions?.freeDeliveryThreshold > 0 && deliveryFee === 0 && subtotal >= config.serviceOptions.freeDeliveryThreshold && (
                        <div className="text-sm text-green-600">
                          🎉 You saved {formatPrice(config.serviceOptions?.deliveryFee || 0)} on delivery!
                        </div>
                      )}
                      
                      <hr className="my-3" />
                      
                      {/* Final Total (match cart's "Total" label) */}
                      <div className="flex justify-between font-bold text-lg text-gray-900">
                        <span>Total</span>
                        <span>{formatPrice(finalPrice)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        {isDelivery && order.deliveryAddress && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">Delivery Address:</p>
                <p className="text-gray-600">
                  {order.deliveryAddress.street}<br />
                  {order.deliveryAddress.area}, {order.deliveryAddress.city}
                  {order.deliveryAddress.postalCode && `, ${order.deliveryAddress.postalCode}`}
                </p>
                <p className="text-sm text-gray-600">
                  Contact: {order.deliveryAddress.phone}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isDelivery && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Pickup Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">Pickup Location:</p>
                <p className="text-gray-600">Circle Kitchen<br />Store Address (as configured in admin)</p>
                <p className="text-sm text-gray-600">
                  Please bring your order number: <strong>#{order.orderNumber}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {order.customerNotes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{order.customerNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What&#39;s Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-orange-600">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Order Confirmation</h4>
                  <p className="text-sm text-gray-600">We&#39;ll send you an email confirmation at {order.customer.email}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-orange-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Preparation</h4>
                  <p className="text-sm text-gray-600">We&#39;ll start preparing your meal 2 hours before {isDelivery ? 'delivery' : 'pickup'}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-orange-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">{isDelivery ? 'Delivery' : 'Ready for Pickup'}</h4>
                  <p className="text-sm text-gray-600">
                    {isDelivery 
                      ? 'Your fresh meal will be delivered at your scheduled time'
                      : 'We\'ll notify you when your order is ready for pickup'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Important Reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <span>Your order is scheduled for {isDelivery ? 'delivery' : 'pickup'} on {bookingDate.toLocaleDateString()} at {bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              {isDelivery ? (
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <span>Please ensure someone is available at the delivery address</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-sm">
                  <Package className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <span>Please bring your order number when picking up</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <span>We&#39;ll call you at {order.customer.phone} 30 minutes before {isDelivery ? 'delivery' : 'pickup'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700 mb-4">
                If you have any questions about your order or need to make changes, please contact us as soon as possible.
              </p>
              <div className="space-y-2 text-sm text-blue-700">
                <p><strong>Phone:</strong> +968 XXXX XXXX</p>
                <p><strong>Email:</strong> support@circle-kitchen.om</p>
                <p><strong>Hours:</strong> 9:00 AM - 9:00 PM</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full h-12">
              Continue Shopping
            </Button>
          </Link>
          <Link href={`/admin/collections/orders/${order.id}`} className="flex-1">
            <Button className="w-full h-12 bg-orange-600 hover:bg-orange-700">
              View Order Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
