'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, Clock, User, MapPin, ShoppingBag, Truck, Package, ExternalLink, LogOut, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCartSimple } from '@/hooks/useCartSimple'
import { useStoreConfig } from '@/hooks/useStoreConfig'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CheckoutPage() {
  const { items, clearCart, mounted } = useCartSimple()
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
    getPickupAddress,
    getGoogleMapsLink,
    loading: configLoading 
  } = useStoreConfig()
  const { customer, isAuthenticated, logout } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Service selection state
  const availableServices = getAvailableServices()
  const serviceFromUrl = searchParams.get('service') as 'delivery' | 'pickup' | null
  const [selectedService, setSelectedService] = useState<'delivery' | 'pickup'>(() => {
    // Use service from URL if valid and available
    if (serviceFromUrl && availableServices.includes(serviceFromUrl)) {
      return serviceFromUrl
    }
    // Default to the first available service, or pickup if delivery is disabled
    if (availableServices.length > 0) {
      return availableServices[0]
    }
    return isPickupEnabled() ? 'pickup' : 'delivery'
  })

  // Update selected service when available services change
  useEffect(() => {
    if (availableServices.length > 0 && !availableServices.includes(selectedService)) {
      // Don't override if service came from URL and is still valid
      if (!serviceFromUrl || !availableServices.includes(serviceFromUrl)) {
        setSelectedService(availableServices[0])
      }
    }
  }, [availableServices, selectedService, serviceFromUrl])
  
  const [loading, setLoading] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    area: '',
    city: 'Muscat',
    postalCode: '',
    phone: ''
  })
  
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // For cart items, price is already the final discounted price
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  
  const deliveryFee = calculateDeliveryFee(subtotal, selectedService)
  const taxAmount = calculateTax(subtotal)
  const totalAmount = subtotal + deliveryFee + taxAmount

  // Set minimum booking date (24 hours from now)
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = tomorrow.toISOString().split('T')[0]
    setBookingDate(minDate)
    setBookingTime('12:00')
  }, [])

  // Auto-fill phone if same as customer phone
  useEffect(() => {
    if (customerInfo.phone && !deliveryAddress.phone && selectedService === 'delivery') {
      setDeliveryAddress(prev => ({ ...prev, phone: customerInfo.phone }))
    }
  }, [customerInfo.phone, deliveryAddress.phone, selectedService])

  // Clear delivery address when pickup is selected
  useEffect(() => {
    if (selectedService === 'pickup') {
      setDeliveryAddress({
        street: '',
        area: '',
        city: 'Muscat',
        postalCode: '',
        phone: ''
      })
    }
  }, [selectedService])

  // Auto-fill customer info when logged in
  useEffect(() => {
    if (customer && isAuthenticated) {
      setCustomerInfo({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        password: '', // Don't pre-fill password for security
        confirmPassword: '' // Don't pre-fill confirm password for security
      })
      
      // Auto-fill delivery address if customer has default address
      if (customer.defaultAddress && selectedService === 'delivery') {
        setDeliveryAddress(prev => ({
          ...prev,
          street: customer.defaultAddress?.street || '',
          area: customer.defaultAddress?.area || '',
          city: customer.defaultAddress?.city || 'Muscat',
          postalCode: customer.defaultAddress?.postalCode || '',
          phone: customer.phone // Use customer phone as delivery phone
        }))
      }
    }
  }, [customer, isAuthenticated, selectedService])

  const handleCheckout = async () => {
    if (!mounted || configLoading || items.length === 0) {
      alert('Your cart is empty!')
      return
    }

    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      alert('Please fill in all customer information')
      return
    }

    // Validate password for new customers (non-authenticated users)
    if (!isAuthenticated && (!customerInfo.password || customerInfo.password.length < 6)) {
      alert('Please enter a password with at least 6 characters.')
      return
    }

    // Validate passwords match for new customers
    if (!isAuthenticated && customerInfo.password !== customerInfo.confirmPassword) {
      alert('Passwords do not match. Please check your passwords and try again.')
      return
    }

    if (selectedService === 'delivery' && isDeliveryEnabled() && (!deliveryAddress.street || !deliveryAddress.area || !deliveryAddress.phone)) {
      alert('Please fill in all required delivery address fields')
      return
    }

    if (!bookingDate || !bookingTime) {
      alert(`Please select ${selectedService} date and time`)
      return
    }

    setLoading(true)

    try {
      // Combine date and time
      const deliveryDateTime = new Date(`${bookingDate}T${bookingTime}:00`)
      
      const checkoutData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price, // Use effective (discounted) price for order total
          quantity: item.quantity,
          category: item.category
        })),
        customerInfo,
        deliveryAddress: (selectedService === 'delivery' && isDeliveryEnabled()) ? deliveryAddress : null,
        serviceType: selectedService,
        bookingDate: deliveryDateTime.toISOString(),
        customerNotes,
        totalAmount
      }

      // Debug logging
      console.log('🛒 Checkout data being sent:', checkoutData)
      console.log('📦 Items with IDs:', checkoutData.items)

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
        body: JSON.stringify(checkoutData)
      })

      const result = await response.json()

      if (result.success) {
        // Show success message based on customer creation
        if (result.customer?.isNewCustomer) {
          showToast({
            title: '🎉 Account Created & Order Placed!',
            description: `Welcome to FlavorForge! Your account has been created and order ${result.order.orderNumber} is confirmed.`,
            type: 'success'
          })
        } else {
          showToast({
            title: '✅ Order Placed Successfully!',
            description: `Order ${result.order.orderNumber} has been confirmed.`,
            type: 'success'
          })
        }

        // Clear cart and redirect to success page with auth token
        clearCart()
        const successUrl = `/order-success?orderNumber=${result.order.orderNumber}`
        const urlWithToken = result.authToken ? `${successUrl}&authToken=${result.authToken}` : successUrl
        router.push(urlWithToken)
      } else {
        alert(`Checkout failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('An error occurred during checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center h-16">
              <Link href="/" className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold">Checkout</h1>
            </div>
          </div>
        </header>
        
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious items to your cart before checkout.</p>
          <Link href="/">
            <Button>Browse Menu</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center h-16">
            <Link href="/" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Customer Information
                  </div>
                  {isAuthenticated && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600 font-medium">✅ Logged in as {customer?.firstName}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={logout}
                        className="h-8 px-3"
                      >
                        <LogOut className="w-3 h-3 mr-1" />
                        Logout
                      </Button>
                    </div>
                  )}
                </CardTitle>
                {!isAuthenticated && (
                  <p className="text-sm text-green-600 mt-2">
                    🔒 <strong>Account will be created automatically</strong> - just fill in your details and we&#39;ll save them for faster checkout next time!
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      placeholder="John"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      placeholder="Doe"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="john@example.com"
                    className="mt-1"
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    placeholder="+968 9X XXX XXX"
                    className="mt-1"
                  />
                </div>

                {/* Password - only for new customers */}
                {!isAuthenticated && (
                  <>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={customerInfo.password}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, password: e.target.value }))}
                          required
                          placeholder="At least 6 characters"
                          className="pr-10"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={customerInfo.confirmPassword}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                          placeholder="Confirm your password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Service Selection */}
            {availableServices.length > 1 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Service Option</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availableServices.map((service) => (
                    <button
                      key={service}
                      onClick={() => setSelectedService(service)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
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
                              calculateDeliveryFee(subtotal, service) === 0 ? 'FREE' : formatPrice(storeConfig.serviceOptions?.deliveryFee || 0)
                            }
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            ) : availableServices.length === 1 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Service Information</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            ) : null}

            {/* Delivery Address */}
            {selectedService === 'delivery' && isDeliveryEnabled() && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">
                    Street Address {selectedService === 'delivery' && isDeliveryEnabled() ? '*' : ''}
                  </Label>
                  <Input
                    id="street"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                    required={selectedService === 'delivery' && isDeliveryEnabled()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="area">
                      Area/Neighborhood {selectedService === 'delivery' && isDeliveryEnabled() ? '*' : ''}
                    </Label>
                    <Input
                      id="area"
                      value={deliveryAddress.area}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, area: e.target.value }))}
                      required={selectedService === 'delivery' && isDeliveryEnabled()}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={deliveryAddress.postalCode}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryPhone">
                      Delivery Phone {selectedService === 'delivery' && isDeliveryEnabled() ? '*' : ''}
                    </Label>
                    <Input
                      id="deliveryPhone"
                      value={deliveryAddress.phone}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value }))}
                      required={selectedService === 'delivery' && isDeliveryEnabled()}
                    />
                  </div>
                </div>
                </CardContent>
              </Card>
            )}

            {/* Pickup Information */}
            {selectedService === 'pickup' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Pickup Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Pickup Address</h4>
                    <p className="text-blue-700 whitespace-pre-line">
                      {getPickupAddress()}
                    </p>
                    {storeConfig.contactInfo?.phone && (
                      <p className="text-sm text-blue-600 mt-2">
                        📞 Please call us when you arrive: {storeConfig.contactInfo.phone}
                      </p>
                    )}
                    {storeConfig.contactInfo?.email && (
                      <p className="text-sm text-blue-600">
                        📧 Contact: {storeConfig.contactInfo.email}
                      </p>
                    )}
                    {getGoogleMapsLink() && (
                      <div className="mt-3">
                        <a 
                          href={getGoogleMapsLink()} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Get Directions
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {selectedService === 'delivery' ? 'Delivery Schedule' : 'Pickup Schedule'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bookingDate">{selectedService === 'delivery' ? 'Delivery Date' : 'Pickup Date'} *</Label>
                    <Input
                      id="bookingDate"
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bookingTime">{selectedService === 'delivery' ? 'Delivery Time' : 'Pickup Time'} *</Label>
                    <Input
                      id="bookingTime"
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Orders must be placed at least 24 hours in advance
                </div>
              </CardContent>
            </Card>

            {/* Customer Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any special instructions for your order (dietary requirements, delivery notes, etc.)"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-gray-600 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <hr />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax ({storeConfig.taxRate}%)</span>
                      <span>{formatPrice(taxAmount)}</span>
                    </div>
                  )}
                  
                  {/* Only show delivery/service fee if applicable */}
                  {(selectedService === 'delivery' && isDeliveryEnabled()) || (selectedService === 'pickup' && deliveryFee > 0) ? (
                    <div className="flex justify-between text-sm">
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
                  
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {!meetsMinimumOrder(subtotal) && (
                  <div className="text-sm text-red-600 mb-2 text-center">
                    Minimum order amount is {formatPrice(storeConfig.minOrderAmount)}
                  </div>
                )}
                
                <Button 
                  onClick={handleCheckout} 
                  disabled={loading || !meetsMinimumOrder(subtotal)}
                  className="w-full"
                  size="lg"
                >
                  {loading 
                    ? 'Processing Order...' 
                    : !meetsMinimumOrder(subtotal)
                      ? `Minimum order ${formatPrice(storeConfig.minOrderAmount)} required`
                      : `Place Order - ${formatPrice(totalAmount)}`
                  }
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}