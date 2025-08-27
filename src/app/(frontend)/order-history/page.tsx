'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Package, MapPin, Truck, CheckCircle, XCircle, Loader2, Calendar, Receipt, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useStoreConfig } from '@/hooks/useStoreConfig'
import { useCartSimple } from '@/hooks/useCartSimple'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
}

interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled'
  serviceType: 'delivery' | 'pickup'
  totalAmount: number
  bookingDate: string
  createdAt?: string
  items: OrderItem[]
  deliveryAddress?: {
    street: string
    area: string
    city: string
    postalCode?: string
  }
  customerNotes?: string
  estimatedServiceTime?: string
  actualServiceTime?: string
}

export default function OrderHistoryPage() {
  const { customer, isAuthenticated, isLoading: authLoading } = useAuth()
  const { formatPrice } = useStoreConfig()
  const { addItem } = useCartSimple()
  const { showToast } = useToast()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  // Redirect if not logged in (but wait for auth to load first)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/order-history')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch order history
  useEffect(() => {
    const fetchOrderHistory = async () => {
      // Wait for auth to load and ensure we have a customer
      if (authLoading || !customer?.id) return

      try {
        setIsLoading(true)
        setError('')

        const response = await fetch(`/api/orders/customer?customerId=${customer.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch order history')
        }

        if (data.success) {
          setOrders(data.orders || [])
        } else {
          throw new Error(data.error || 'Failed to load orders')
        }
      } catch (error) {
        console.error('Order history fetch error:', error)
        setError('Failed to load order history. Please try again.')
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderHistory()
  }, [authLoading, customer?.id])

  // Handle reorder functionality
  const handleReorder = async (order: Order) => {
    try {
      let itemsAdded = 0
      
      for (const item of order.items) {
        const cartItem = {
          id: item.id,
          name: item.name,
          description: '', // We don't have description in order history
          price: item.price,
          category: item.category,
          image: '', // We don't have image in order history
          isVeg: true, // Default, since we don't store this in orders
          rating: 0, // Default
          customization: [],
          minOrderQuantity: 1 // Default
        }
        
        // Add each item to cart with its quantity
        addItem(cartItem, item.quantity)
        itemsAdded += item.quantity
      }

      showToast({
        title: 'Items Added to Cart!',
        description: `${itemsAdded} item${itemsAdded > 1 ? 's' : ''} from order ${order.orderNumber} added to your cart`,
        type: 'success'
      })

      // Navigate to cart page
      router.push('/cart')
      
    } catch (error) {
      console.error('Reorder error:', error)
      showToast({
        title: 'Reorder Failed',
        description: 'Failed to add items to cart. Please try again.',
        type: 'error'
      })
    }
  }

  // Handle cancel order functionality
  const handleCancelOrder = async () => {
    if (!orderToCancel || !customer?.id) return

    try {
      setIsCancelling(true)

      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: orderToCancel.orderNumber,
          customerId: customer.id,
          reason: cancelReason.trim() || 'Cancelled by customer'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order')
      }

      if (data.success) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderToCancel.id 
              ? { ...order, status: 'cancelled' as const }
              : order
          )
        )

        showToast({
          title: 'Order Cancelled',
          description: `Order ${orderToCancel.orderNumber} has been cancelled successfully`,
          type: 'success'
        })

        // Close the confirmation dialog
        setOrderToCancel(null)
        setCancelReason('')
      } else {
        throw new Error(data.error || 'Failed to cancel order')
      }

    } catch (error) {
      console.error('Cancel order error:', error)
      showToast({
        title: 'Cancellation Failed',
        description: error instanceof Error ? error.message : 'Failed to cancel order. Please try again.',
        type: 'error'
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-orange-100 text-orange-800'
      case 'ready': return 'bg-purple-100 text-purple-800'
      case 'out-for-delivery': return 'bg-indigo-100 text-indigo-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'preparing': return <Package className="w-4 h-4" />
      case 'ready': return <Package className="w-4 h-4" />
      case 'out-for-delivery': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'confirmed': return 'Confirmed'
      case 'preparing': return 'Preparing'
      case 'ready': return 'Ready for Pickup'
      case 'out-for-delivery': return 'Out for Delivery'
      case 'delivered': return 'Delivered'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirecting message only after auth has loaded and user is not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Store
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Order History</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Orders</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-4">You haven&#39;t placed any orders yet.</p>
            <Link href="/">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(order.bookingDate)}
                        </div>
                        <div className="flex items-center">
                          {order.serviceType === 'delivery' ? (
                            <Truck className="w-4 h-4 mr-1" />
                          ) : (
                            <Package className="w-4 h-4 mr-1" />
                          )}
                          {order.serviceType === 'delivery' ? 'Delivery' : 'Pickup'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getStatusColor(order.status)} mb-2`}>
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusLabel(order.status)}</span>
                        </div>
                      </Badge>
                      <div className="text-lg font-semibold">{formatPrice(order.totalAmount)}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    <h4 className="font-medium text-gray-900">Order Items:</h4>
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Address */}
                  {order.deliveryAddress && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Delivery Address:
                      </h4>
                      <p className="text-sm text-gray-600">
                        {order.deliveryAddress.street}, {order.deliveryAddress.area}, {order.deliveryAddress.city}
                        {order.deliveryAddress.postalCode && ` - ${order.deliveryAddress.postalCode}`}
                      </p>
                    </div>
                  )}

                  {/* Customer Notes */}
                  {order.customerNotes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-1">Notes:</h4>
                      <p className="text-sm text-gray-600">{order.customerNotes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <Link href={`/order-success?orderNumber=${order.orderNumber}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {order.status === 'delivered' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReorder(order)}
                      >
                        Reorder
                      </Button>
                    )}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setOrderToCancel(order)}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Dialog */}
      {orderToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Cancel Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Are you sure you want to cancel order <strong>{orderToCancel.orderNumber}</strong>?
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">
                      <strong>Total Amount:</strong> {formatPrice(orderToCancel.totalAmount)}
                    </p>
                    <p className="text-sm">
                      <strong>Service:</strong> {orderToCancel.serviceType === 'delivery' ? 'Delivery' : 'Pickup'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cancelReason" className="text-sm font-medium">
                    Reason for cancellation (optional)
                  </Label>
                  <Input
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g., Changed my mind, Found a better option..."
                    className="mt-1"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This helps us improve our service
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOrderToCancel(null)
                      setCancelReason('')
                    }}
                    disabled={isCancelling}
                    className="flex-1"
                  >
                    Keep Order
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Order'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
